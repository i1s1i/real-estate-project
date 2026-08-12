"""
معالجات الأخطاء المخصصة
Custom error handlers for better user experience
"""
from flask import Blueprint, render_template

errors_bp = Blueprint('errors', __name__)


@errors_bp.app_errorhandler(404)
def not_found_error(error):
    """صفحة 404 مخصصة - الصفحة غير موجودة"""
    return render_template('pages/404.html'), 404


@errors_bp.app_errorhandler(500)
def internal_error(error):
    """صفحة 500 مخصصة - خطأ في الخادم"""
    return render_template('pages/500.html'), 500


@errors_bp.app_errorhandler(403)
def forbidden_error(error):
    """صفحة 403 مخصصة - غير مصرح"""
    return render_template('pages/404.html'), 403
