"""
مسارات API - JSON Endpoints
"""
import hashlib
import json
import re
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, current_app
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.developer import Developer, DeveloperProject
from app.models.park import Park
from app import cache, db

api_bp = Blueprint('api', __name__)


@api_bp.route('/ping')
def ping():
    """
    نقطة فحص الحالة (Health Check / Keepalive).

    تُستخدم مع خدمات مثل UptimeRobot أو Cron-job.org
    لإرسال طلب HTTP كل 10 دقائق، مما يمنع Render
    من إيقاف السيرفر في الخطة المجانية (ينام بعد 15 دقيقة خمول).

    رابط الاستخدام: https://your-app.onrender.com/api/ping
    """
    return jsonify({
        'status': 'ok',
        'message': 'السيرفر يعمل بشكل طبيعي ✅',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'service': 'منصة العقار الذكية - الرياض'
    }), 200


@api_bp.route('/map/properties')
@cache.cached(timeout=300, query_string=True)
def map_properties():
    """جلب العقارات للخريطة"""
    prop_type = request.args.get('property_type', '')
    listing_type = request.args.get('listing_type', '')

    q = Property.query.filter(
        Property.latitude.isnot(None),
        Property.longitude.isnot(None)
    )
    if prop_type:
        q = q.filter_by(property_type=prop_type)
    if listing_type:
        q = q.filter_by(listing_type=listing_type)

    props = q.limit(500).all()
    return jsonify({
        'success': True,
        'count': len(props),
        'data': [p.to_dict() for p in props]
    })


@api_bp.route('/map/neighborhoods')
@cache.cached(timeout=600)
def map_neighborhoods():
    """جلب بيانات الأحياء كـ GeoJSON"""
    neighborhoods = Neighborhood.query.all()
    features = []
    for n in neighborhoods:
        if n.boundaries_geojson:
            features.append(n.to_geojson_feature())

    return jsonify({
        'success': True,
        'type': 'FeatureCollection',
        'features': features
    })


@api_bp.route('/map/parks')
@cache.cached(timeout=600)
def map_parks():
    """جلب بيانات الحدائق"""
    parks = Park.query.all()
    features = []
    for p in parks:
        if p.boundaries_geojson:
            try:
                boundaries = json.loads(p.boundaries_geojson)
                features.append({
                    'type': 'Feature',
                    'geometry': boundaries,
                    'properties': p.to_dict()
                })
            except (json.JSONDecodeError, TypeError) as e:
                current_app.logger.warning(f'Invalid GeoJSON for park {p.id}: {e}')
    return jsonify({
        'success': True,
        'type': 'FeatureCollection',
        'features': features
    })


@api_bp.route('/neighborhoods')
@cache.cached(timeout=300)
def neighborhoods_list():
    """قائمة الأحياء"""
    neighborhoods = Neighborhood.query.order_by(Neighborhood.name_ar).all()
    return jsonify({
        'success': True,
        'data': [n.to_dict() for n in neighborhoods]
    })


@api_bp.route('/neighborhoods/<int:nid>')
def neighborhood_detail(nid):
    """تفاصيل حي معين"""
    n = Neighborhood.query.get_or_404(nid)
    data = n.to_dict()

    # Get price history (deterministic based on neighborhood ID)
    data['price_history'] = _get_price_history(n)
    data['property_count'] = n.properties.count()

    return jsonify({'success': True, 'data': data})


@api_bp.route('/neighborhoods/compare')
def neighborhoods_compare():
    """مقارنة بين حيين"""
    ids = request.args.getlist('ids')
    if not ids:
        return jsonify({'success': False, 'message': 'يرجى تحديد الأحياء للمقارنة'})

    if len(ids) > 4:
        return jsonify({'success': False, 'message': 'يمكن مقارنة 4 أحياء كحد أقصى'})

    neighborhoods = []
    for nid in ids[:4]:  # max 4
        try:
            n = Neighborhood.query.get(int(nid))
        except (ValueError, TypeError):
            continue
        if n:
            data = n.to_dict()
            data['price_history'] = _get_price_history(n)
            neighborhoods.append(data)

    if len(neighborhoods) < 2:
        return jsonify({'success': False, 'message': 'يرجى اختيار حيين صالحين على الأقل'})

    return jsonify({'success': True, 'data': neighborhoods})


@api_bp.route('/properties/search')
def properties_search():
    """بحث العقارات"""
    prop_type = request.args.get('type', '')
    listing = request.args.get('listing', '')
    neighborhood_id = request.args.get('neighborhood_id', 0, type=int)
    min_price = request.args.get('min_price', 0, type=float)
    max_price = request.args.get('max_price', 99_000_000, type=float)
    bedrooms = request.args.get('bedrooms', 0, type=int)

    q = Property.query
    if prop_type:
        q = q.filter_by(property_type=prop_type)
    if listing:
        q = q.filter_by(listing_type=listing)
    if neighborhood_id:
        q = q.filter_by(neighborhood_id=neighborhood_id)
    if bedrooms:
        q = q.filter(Property.bedrooms >= bedrooms)
    q = q.filter(Property.price >= min_price, Property.price <= max_price)

    props = q.order_by(Property.is_featured.desc()).limit(50).all()
    return jsonify({
        'success': True,
        'count': len(props),
        'data': [p.to_dict() for p in props]
    })


@api_bp.route('/properties/<int:prop_id>')
def property_detail(prop_id):
    """جلب تفاصيل عقار واحد محدد بالمعرف"""
    p = Property.query.get_or_404(prop_id)
    return jsonify({
        'success': True,
        'data': p.to_dict()
    })


@api_bp.route('/developers')
@cache.cached(timeout=600)
def developers_list():
    """قائمة المطورين"""
    devs = Developer.query.order_by(Developer.rating.desc()).all()
    return jsonify({
        'success': True,
        'data': [d.to_dict() for d in devs]
    })


@api_bp.route('/stats/overview')
@cache.cached(timeout=300)
def stats_overview():
    """إحصائيات عامة للمنصة"""
    total_props = Property.query.count()
    sale_count = Property.query.filter_by(listing_type='sale').count()
    rent_count = Property.query.filter_by(listing_type='rent').count()
    avg_sale_price = db.session.query(db.func.avg(Property.price)).filter_by(listing_type='sale').scalar() or 0
    avg_rent_price = db.session.query(db.func.avg(Property.price)).filter_by(listing_type='rent').scalar() or 0

    return jsonify({
        'success': True,
        'data': {
            'total_properties': total_props,
            'sale_count': sale_count,
            'rent_count': rent_count,
            'avg_sale_price': round(avg_sale_price),
            'avg_rent_price': round(avg_rent_price),
            'total_neighborhoods': Neighborhood.query.count(),
            'total_developers': Developer.query.count(),
        }
    })


@api_bp.route('/stats/neighborhoods-ranking')
@cache.cached(timeout=600)
def neighborhoods_ranking():
    """ترتيب الأحياء حسب معايير مختلفة"""
    sort_by = request.args.get('sort', 'infrastructure_score')
    valid_sorts = {
        'infrastructure_score': Neighborhood.infrastructure_score.desc(),
        'land_price': Neighborhood.land_price_per_sqm.desc(),
        'rent': Neighborhood.avg_rent_per_sqm.desc(),
        'parks': Neighborhood.parks_count.desc(),
    }
    order = valid_sorts.get(sort_by, Neighborhood.infrastructure_score.desc())
    neighborhoods = Neighborhood.query.order_by(order).limit(10).all()

    return jsonify({
        'success': True,
        'sort_by': sort_by,
        'data': [n.to_dict() for n in neighborhoods]
    })


def _get_price_history(neighborhood):
    """
    إنشاء بيانات تاريخية للأسعار (حتمية بناءً على معرف الحي).
    Uses a deterministic seed based on neighborhood ID so the same
    neighborhood always returns the same price history.
    """
    import random as _random

    # Create a deterministic seed from the neighborhood ID
    seed = int(hashlib.md5(str(neighborhood.id).encode()).hexdigest()[:8], 16)
    rng = _random.Random(seed)

    base_price = neighborhood.land_price_per_sqm or 3000
    years = ['2020', '2021', '2022', '2023', '2024', '2025']
    prices = []
    p = base_price * 0.7
    for year in years:
        growth = rng.uniform(0.03, 0.18)
        p = p * (1 + growth)
        prices.append(round(p))
    return {'labels': years, 'prices': prices}


@api_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """
    مساعد عقار ذكي (AI Advisor)
    مرحلة 1: محرك ذكي يعتمد على استرجاع البيانات الحية وتوليد إجابات تفاعلية
    """
    data = request.get_json() or {}
    user_query = data.get('query', '').strip()

    if not user_query:
        return jsonify({
            'success': False,
            'reply': 'مرحباً بك في منصة عقار ذكي! كيف يمكنني مساعدتك اليوم في سوق عقارات الرياض؟ يمكنك سؤالي عن أفضل الأحياء، أو أسعار الفلل والشقق، أو مقارنة بين منطقتين.'
        })

    def normalize_search_text(value):
        value = re.sub(r'[\u064b-\u065f\u0670]', '', value.lower())
        return re.sub(r'[^\w]+', ' ', value).strip()

    normalized_query = normalize_search_text(user_query)
    all_neighborhoods = Neighborhood.query.all()
    mentioned_neighborhoods = []
    for neighborhood in all_neighborhoods:
        arabic_name = re.sub(r'^حي\s+', '', neighborhood.name_ar.strip())
        names = {neighborhood.name_ar, arabic_name, neighborhood.name_en}
        positions = []
        for name in names:
            normalized_name = normalize_search_text(name)
            if not normalized_name:
                continue
            match = re.search(
                rf'(?<!\w){re.escape(normalized_name)}(?!\w)',
                normalized_query,
            )
            if match:
                positions.append(match.start())
        if positions:
            mentioned_neighborhoods.append((min(positions), neighborhood))
    mentioned_neighborhoods = [
        neighborhood
        for _, neighborhood in sorted(mentioned_neighborhoods, key=lambda item: item[0])
    ]

    # Intent 1: Comparison between neighborhoods
    if ('قارن' in user_query or 'الفرق' in user_query or 'مقارنة' in user_query) and len(mentioned_neighborhoods) >= 2:
        comparison_rows = [
            (
                f"• **{neighborhood.name_ar}:** البنية التحتية "
                f"{int(neighborhood.infrastructure_score)}/100، سعر متر الأرض "
                f"{int(neighborhood.land_price_per_sqm):,} ريال، متوسط الإيجار "
                f"{int(neighborhood.avg_rent_per_sqm):,} ريال/م²، "
                f"{neighborhood.schools_count} مدارس، {neighborhood.hospitals_count} مستشفيات، "
                f"{neighborhood.parks_count} حدائق."
            )
            for neighborhood in mentioned_neighborhoods
        ]
        best_neighborhood = max(
            mentioned_neighborhoods,
            key=lambda neighborhood: neighborhood.infrastructure_score,
        )
        comparison_details = '\n'.join(comparison_rows)
        compared_names = ' و '.join(
            neighborhood.name_ar for neighborhood in mentioned_neighborhoods
        )
        reply = (
            f"📊 **مقارنة الأحياء: {compared_names}**\n\n"
            f"{comparison_details}\n\n"
            f"💡 **التوصية:** {best_neighborhood.name_ar} هو الأعلى في مؤشر البنية "
            f"التحتية بين الأحياء المذكورة ({int(best_neighborhood.infrastructure_score)}/100). "
            "يعتمد الاختيار الأنسب أيضاً على ميزانيتك واحتياجك للسكن أو الاستثمار."
        )
        return jsonify({'success': True, 'reply': reply})

    # Intent 2: Specific neighborhood question
    if mentioned_neighborhoods:
        n = mentioned_neighborhoods[0]
        # Count properties in this neighborhood
        prop_count = Property.query.filter_by(neighborhood_id=n.id).count()
        reply = (
            f"📍 **معلومات مفصلة عن {n.name_ar}:**\n\n"
            f"• **مؤشر البنية التحتية:** {int(n.infrastructure_score)}/100 🌟\n"
            f"• **متوسط سعر متر الأرض:** {int(n.land_price_per_sqm):,} ريال/م²\n"
            f"• **متوسط الإيجار السكني:** {int(n.avg_rent_per_sqm):,} ريال/م²\n"
            f"• **المرافق العامة:** {n.schools_count} مدارس، {n.hospitals_count} مستشفيات، {n.parks_count} حدائق، و {n.malls_count} مجمعات تجارية.\n"
            f"• **عدد العقارات المسجلة بالمنصة:** {prop_count} عقار متاح.\n\n"
            f"يمكنك استكشاف العقارات بالحي مباشرة عبر تبويب الخريطة أو صفحة العقارات!"
        )
        return jsonify({'success': True, 'reply': reply})

    # Intent 3: Best neighborhoods / recommendations
    if any(k in user_query for k in ['أفضل حي', 'افضل حي', 'أعلى تقييم', 'أرقى', 'بنية تحتية', 'عائلات']):
        top_n = Neighborhood.query.order_by(Neighborhood.infrastructure_score.desc()).limit(3).all()
        top_list = "\n".join([f"• **{item.name_ar}:** بنية تحتية {int(item.infrastructure_score)}% - سعر المتر: {int(item.land_price_per_sqm):,} ريال" for item in top_n])
        reply = (
            f"🏆 **أفضل الأحياء في الرياض بناءً على تحليلات البنية التحتية والخدمات:**\n\n"
            f"{top_list}\n\n"
            f"تتميز هذه الأحياء بجاهزية عالية للمدارس والمراكز الصحية والحدائق ومداخل الطرق الرئيسية."
        )
        return jsonify({'success': True, 'reply': reply})

    # Intent 4: Price / Budget search
    prop_type = None
    if 'فيلا' in user_query or 'فلل' in user_query:
        prop_type = 'villa'
    elif 'شقة' in user_query or 'شقق' in user_query:
        prop_type = 'apartment'
    elif 'أرض' in user_query or 'اراضي' in user_query:
        prop_type = 'land'

    listing_type = 'rent' if ('إيجار' in user_query or 'ايجار' in user_query) else 'sale' if ('بيع' in user_query or 'شراء' in user_query) else None

    # Filter properties if type detected
    if prop_type or listing_type:
        query_filter = Property.query
        if prop_type:
            query_filter = query_filter.filter_by(property_type=prop_type)
        if listing_type:
            query_filter = query_filter.filter_by(listing_type=listing_type)

        props = query_filter.order_by(Property.price.asc()).limit(3).all()
        if props:
            p_list = "\n".join([f"• **{p.title}:** بسعر {p.price_formatted()} في {p.neighborhood.name_ar if p.neighborhood else 'الرياض'}" for p in props])
            type_name = {'villa': 'الفلل', 'apartment': 'الشقق', 'land': 'الأراضي'}.get(prop_type, 'العقارات')
            listing_name = 'المتاحة للإيجار' if listing_type == 'rent' else 'المتاحة للبيع' if listing_type == 'sale' else 'المتاحة'
            reply = (
                f"🏡 **أبرز عروض {type_name} {listing_name}:**\n\n"
                f"{p_list}\n\n"
                f"اضغط على أي عقار في صفحة العقارات أو الخريطة لاستعراض تفاصيله الكاملة والتواصل!"
            )
            return jsonify({'success': True, 'reply': reply})

    # Default fallback answer
    reply = (
        "🤖 **أهلاً بك! أنا مساعد عقار ذكي التفاعلي.**\n\n"
        "أستطيع مساعدتك في الاستفسار عن:\n"
        "1. **مقارنة الأحياء:** مثل: *قارن بين حي حطين وحي الملقا*\n"
        "2. **استعراض حي معين:** مثل: *ما هي مميزات حي الياسمين؟*\n"
        "3. **أفضل الفرص الاستثمارية:** مثل: *ما هي أفضل الأحياء للعائلات؟*\n"
        "4. **البحث في الأسعار:** مثل: *أرخص الفلل المتاحة للبيع*\n\n"
        "جرّب طرح سؤالك باللغة العربية وسأجيبك فوراً بالاعتماد على قاعدة بيانات السوق!"
    )
    return jsonify({'success': True, 'reply': reply})
