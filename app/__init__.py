# Flask App Factory
import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_caching import Cache
from flask_compress import Compress
from config import config

db = SQLAlchemy()
cache = Cache()
compress = Compress()


def create_app(config_name='default'):
    # Get the root project directory (one level above app/)
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(__name__,
                template_folder=os.path.join(root_dir, 'templates'),
                static_folder=os.path.join(root_dir, 'static'))
    app.config.from_object(config[config_name])

    # Configure logging
    log_level = app.config.get('LOG_LEVEL', logging.INFO)
    logging.basicConfig(
        level=log_level,
        format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    app.logger.setLevel(log_level)

    # Initialize extensions
    db.init_app(app)
    cache.init_app(app)
    compress.init_app(app)

    # Call config init_app if it exists (e.g. ProductionConfig warnings)
    config_class = config[config_name]
    if hasattr(config_class, 'init_app'):
        config_class.init_app(app)

    # Register blueprints
    from app.routes.pages import pages_bp
    from app.routes.api import api_bp
    from app.routes.error_handlers import errors_bp
    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(errors_bp)

    # Context processor: inject `now` for dynamic copyright year
    @app.context_processor
    def inject_now():
        from datetime import datetime, timezone
        return {'now': lambda: datetime.now(timezone.utc)}

    # Register Jinja2 template filters from utils
    from app.utils.formatters import format_price, format_area, score_to_color, score_to_grade
    app.jinja_env.filters['format_price'] = format_price
    app.jinja_env.filters['format_area'] = format_area
    app.jinja_env.filters['score_color'] = score_to_color
    app.jinja_env.filters['score_grade'] = score_to_grade

    return app
