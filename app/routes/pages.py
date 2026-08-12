"""
مسارات الصفحات - HTML Rendering
"""
from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, request, flash, session, current_app, abort
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.developer import Developer
from app import db

pages_bp = Blueprint('pages', __name__)


# ── Admin Authentication Decorator ────────────────────────────
def admin_required(f):
    """Decorator to require admin login for protected routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash('يرجى تسجيل الدخول أولاً', 'error')
            return redirect(url_for('pages.admin_login'))
        return f(*args, **kwargs)
    return decorated_function


@pages_bp.route('/')
def index():
    """الصفحة الرئيسية"""
    featured = Property.query.filter_by(is_featured=True).limit(6).all()
    neighborhoods = Neighborhood.query.order_by(Neighborhood.infrastructure_score.desc()).limit(8).all()
    total_properties = Property.query.count()
    total_neighborhoods = Neighborhood.query.count()
    total_developers = Developer.query.count()
    return render_template('pages/index.html',
                           featured=featured,
                           neighborhoods=neighborhoods,
                           total_properties=total_properties,
                           total_neighborhoods=total_neighborhoods,
                           total_developers=total_developers)


@pages_bp.route('/map')
def map_view():
    """صفحة الخريطة التفاعلية"""
    neighborhoods = Neighborhood.query.all()
    return render_template('pages/map.html', neighborhoods=neighborhoods)


@pages_bp.route('/compare')
def compare():
    """صفحة مقارنة الأحياء"""
    neighborhoods = Neighborhood.query.order_by(Neighborhood.name_ar).all()
    return render_template('pages/compare.html', neighborhoods=neighborhoods)


@pages_bp.route('/developers')
def developers():
    """صفحة المطورين العقاريين"""
    devs = Developer.query.order_by(Developer.rating.desc()).all()
    return render_template('pages/developers.html', developers=devs)


@pages_bp.route('/statistics')
def statistics():
    """صفحة الإحصائيات (بيانات ديناميكية من قاعدة البيانات)"""
    # 5-year trends (static demo data — matches seed scenario)
    years = ['2021', '2022', '2023', '2024', '2025']
    supply_trend = [300, 450, 700, 850, 1200]
    demand_trend = [250, 480, 680, 950, 1400]
    avg_price_trend = [3500, 3800, 4200, 5500, 6200]

    # Dynamic stats from database
    total_properties = Property.query.count()
    sale_count = Property.query.filter_by(listing_type='sale').count()
    rent_count = Property.query.filter_by(listing_type='rent').count()

    # Property type distribution (from DB)
    prop_types_labels = ['فلل', 'شقق', 'أراضي', 'تجاري']
    prop_types_data = [
        Property.query.filter_by(property_type='villa').count(),
        Property.query.filter_by(property_type='apartment').count(),
        Property.query.filter_by(property_type='land').count(),
        Property.query.filter_by(property_type='commercial').count(),
    ]

    # Rent vs Sale (from DB)
    rent_vs_sale_labels = ['إيجار', 'بيع']
    rent_vs_sale_data = [rent_count, sale_count]

    # Top ROI Neighborhoods (compute from DB data)
    top_neighborhoods = Neighborhood.query.order_by(
        (Neighborhood.avg_rent_per_sqm / db.func.nullif(Neighborhood.land_price_per_sqm, 0) * 100).desc()
    ).limit(5).all()

    top_roi_labels = [n.name_ar.replace('حي ', '') for n in top_neighborhoods]
    top_roi_data = [
        round((n.avg_rent_per_sqm / n.land_price_per_sqm * 100), 1)
        if n.land_price_per_sqm > 0 else 0
        for n in top_neighborhoods
    ]

    return render_template('pages/statistics.html',
                           years=years,
                           supply_trend=supply_trend,
                           demand_trend=demand_trend,
                           avg_price_trend=avg_price_trend,
                           prop_types_labels=prop_types_labels,
                           prop_types_data=prop_types_data,
                           rent_vs_sale_labels=rent_vs_sale_labels,
                           rent_vs_sale_data=rent_vs_sale_data,
                           top_roi_labels=top_roi_labels,
                           top_roi_data=top_roi_data,
                           total_properties=total_properties,
                           sale_count=sale_count,
                           rent_count=rent_count)



@pages_bp.route('/properties')
def properties():
    """صفحة قائمة العقارات"""
    page = request.args.get('page', 1, type=int)
    prop_type = request.args.get('type', '')
    listing = request.args.get('listing', '')
    neighborhood = request.args.get('neighborhood', '', type=str)
    min_price = request.args.get('min_price', 0, type=float)
    max_price = request.args.get('max_price', 99999999, type=float)

    q = Property.query
    if prop_type:
        q = q.filter_by(property_type=prop_type)
    if listing:
        q = q.filter_by(listing_type=listing)
    if neighborhood:
        # Validate neighborhood ID is an integer to prevent injection
        try:
            neighborhood_id = int(neighborhood)
            q = q.filter(Property.neighborhood_id == neighborhood_id)
        except (ValueError, TypeError):
            current_app.logger.warning(f'Invalid neighborhood filter value: {neighborhood}')
    q = q.filter(Property.price >= min_price, Property.price <= max_price)

    pagination = q.order_by(Property.is_featured.desc(), Property.id.desc()).paginate(page=page, per_page=12)
    neighborhoods = Neighborhood.query.order_by(Neighborhood.name_ar).all()
    return render_template('pages/properties.html',
                           pagination=pagination,
                           neighborhoods=neighborhoods,
                           filters={'type': prop_type, 'listing': listing, 'neighborhood': neighborhood})


@pages_bp.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """صفحة دخول الإدارة"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if not username or not password:
            flash('يرجى إدخال اسم المستخدم وكلمة المرور', 'error')
        elif (username == current_app.config['ADMIN_USERNAME'] and
                password == current_app.config['ADMIN_PASSWORD']):
            session['admin_logged_in'] = True
            current_app.logger.info(f'Admin login successful from {request.remote_addr}')
            return redirect(url_for('pages.admin_dashboard'))
        else:
            current_app.logger.warning(f'Failed admin login attempt from {request.remote_addr}')
            flash('بيانات الدخول غير صحيحة', 'error')
    return render_template('pages/admin_login.html')


@pages_bp.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """لوحة تحكم الإدارة"""
    stats = {
        'total_properties': Property.query.count(),
        'total_neighborhoods': Neighborhood.query.count(),
        'total_developers': Developer.query.count(),
        'sale_properties': Property.query.filter_by(listing_type='sale').count(),
        'rent_properties': Property.query.filter_by(listing_type='rent').count(),
    }
    recent = Property.query.order_by(Property.created_at.desc()).limit(10).all()
    return render_template('pages/admin_dashboard.html', stats=stats, recent=recent)


@pages_bp.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    flash('تم تسجيل الخروج بنجاح', 'success')
    return redirect(url_for('pages.index'))
