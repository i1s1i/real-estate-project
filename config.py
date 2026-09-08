"""
منصة العقار الذكية - الرياض
إعدادات التطبيق
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()


def _fix_database_url(url: str | None) -> str:
    """
    إصلاح رابط قاعدة البيانات:
    - Render يوفر DATABASE_URL بصيغة 'postgres://' القديمة،
      لكن SQLAlchemy 1.4+ يتطلب 'postgresql://'.
    - يتم التصحيح تلقائياً هنا.
    """
    if url and url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql://', 1)
    return url or 'sqlite:///app.db'


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-!@#')

    # Database
    SQLALCHEMY_DATABASE_URI = _fix_database_url(os.environ.get('DATABASE_URL'))

    # رابط التطبيق الخارجي على Render (يُستخدم لإبقاء السيرفر مستيقظاً)
    # مثال: https://your-app-name.onrender.com
    RENDER_EXTERNAL_URL = os.environ.get('RENDER_EXTERNAL_URL', '')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Caching
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes

    # Compression
    COMPRESS_MIMETYPES = ['application/json', 'text/html', 'text/css', 'application/javascript']
    COMPRESS_LEVEL = 6
    COMPRESS_MIN_SIZE = 500

    # Session Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'

    # Admin credentials (change in production via environment variables)
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

    # Rate Limiting
    RATELIMIT_STORAGE_URI = 'memory://'
    RATELIMIT_DEFAULT = '200 per hour'
    LOGIN_RATE_LIMIT = '5 per minute'

    # Logging
    LOG_LEVEL = logging.INFO


class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = logging.DEBUG


class ProductionConfig(Config):
    DEBUG = False
    CACHE_TYPE = 'SimpleCache'
    SESSION_COOKIE_SECURE = True
    LOG_LEVEL = logging.WARNING

    @classmethod
    def init_app(cls, app):
        """Warn if default SECRET_KEY is used in production."""
        if app.config['SECRET_KEY'] == 'dev-secret-key-change-in-production-!@#':
            app.logger.warning(
                '⚠️  تحذير: يتم استخدام مفتاح سري افتراضي! '
                'يرجى تعيين SECRET_KEY عبر متغيرات البيئة في بيئة الإنتاج.'
            )


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
