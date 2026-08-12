"""
منصة العقار الذكية - الرياض
نقطة الدخول الرئيسية للتطبيق (Render-compatible)
"""
import sys
import os

# Fix encoding for Arabic text on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from app import create_app, db
from app.utils.seed_data import seed_database

# Determine config based on environment
config_name = 'production' if os.environ.get('FLASK_ENV') == 'production' else 'default'
app = create_app(config_name)

# Initialize DB and seed data on startup
with app.app_context():
    db.create_all()
    from app.models.neighborhood import Neighborhood
    if Neighborhood.query.count() == 0:
        seed_database()
        print("تم تهيئة البيانات التجريبية تلقائياً.")

if __name__ == '__main__':
    if '--init-db' in sys.argv:
        with app.app_context():
            db.create_all()
            print("تم إنشاء قاعدة البيانات بنجاح!")
            seed_database()
            print("تم ملء قاعدة البيانات بالبيانات التجريبية!")
    else:
        app.run(debug=True, host='0.0.0.0', port=5000)
