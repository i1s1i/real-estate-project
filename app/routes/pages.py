"""
مسارات الصفحات - HTML Rendering
"""
from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, request, flash, session, current_app, abort
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.developer import Developer
from app.utils.public_market_indicators import GASTAT_REPI_Q3_2026

pages_bp = Blueprint('pages', __name__)


def _get_unique_developers():
    """Return one highest-rated record per displayed developer name."""
    developers = Developer.query.order_by(Developer.rating.desc(), Developer.id.asc()).all()
    unique_developers = {}
    for developer in developers:
        name = ' '.join((developer.name_ar or '').split()).casefold()
        if name:
            unique_developers.setdefault(name, developer)
    return list(unique_developers.values())


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
    total_developers = len(_get_unique_developers())
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
    devs = _get_unique_developers()
    return render_template('pages/developers.html', developers=devs)


@pages_bp.route('/statistics')
def statistics():
    """Show the latest verified public real-estate price index."""
    return render_template(
        'pages/statistics.html',
        indicators=GASTAT_REPI_Q3_2026,
    )



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
