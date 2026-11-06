"""
مسارات API - JSON Endpoints
"""
import hashlib
import json
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, current_app
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.developer import Developer, DeveloperProject
from app.models.park import Park
from app import cache, db
from app.utils.rag_assistant import answer_query

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
        try:
            feature = n.to_geojson_feature()
        except (json.JSONDecodeError, TypeError) as e:
            current_app.logger.warning('Invalid GeoJSON for neighborhood %s: %s', n.id, e)
            feature = None

        if feature and not feature['geometry'] and n.center_lat is not None and n.center_lng is not None:
            feature['geometry'] = {
                'type': 'Point',
                'coordinates': [n.center_lng, n.center_lat],
            }
        if feature and feature['geometry']:
            features.append(feature)

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
        boundaries = None
        if p.boundaries_geojson:
            try:
                boundaries = json.loads(p.boundaries_geojson)
            except (json.JSONDecodeError, TypeError) as e:
                current_app.logger.warning('Invalid GeoJSON for park %s: %s', p.id, e)

        if not boundaries and p.center_lat is not None and p.center_lng is not None:
            boundaries = {
                'type': 'Point',
                'coordinates': [p.center_lng, p.center_lat],
            }
        if boundaries:
            features.append({
                'type': 'Feature',
                'geometry': boundaries,
                'properties': p.to_dict()
            })
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
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "reply": "A JSON object is required."}), 400

    user_query = data.get("query")
    if not isinstance(user_query, str) or not user_query.strip():
        return jsonify({"success": False, "reply": "Enter a question to search."}), 400

    user_query = user_query.strip()
    if len(user_query) > 500:
        return jsonify({
            "success": False,
            "reply": "Questions must be 500 characters or fewer.",
        }), 400

    return jsonify(answer_query(user_query))
