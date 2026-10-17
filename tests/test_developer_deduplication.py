from config import config as app_configs

from app import create_app, db
from app.models.developer import Developer
from app.utils.seed_data import seed_database


def test_duplicate_developers_are_shown_once_on_home_and_developers_page(monkeypatch):
    class MemoryConfig(app_configs["default"]):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    monkeypatch.setitem(app_configs, "memory_test", MemoryConfig)
    app = create_app("memory_test")

    with app.app_context():
        db.create_all()
        db.session.add_all(
            [
                Developer(name_ar="شركة التطوير", rating=4.1),
                Developer(name_ar="  شركة   التطوير ", rating=4.8),
            ]
        )
        db.session.commit()

    try:
        with app.test_client() as client:
            home = client.get("/")
            developers = client.get("/developers")

        assert b'data-count="1"' in home.data
        assert developers.data.count(b'class="developer-card card-lift"') == 1
        assert b"4.8" in developers.data
        assert b"4.1" not in developers.data
    finally:
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()


def test_reseeding_does_not_add_duplicate_developers(monkeypatch):
    class MemoryConfig(app_configs["default"]):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"

    monkeypatch.setitem(app_configs, "memory_test", MemoryConfig)
    app = create_app("memory_test")

    try:
        with app.app_context():
            db.create_all()
            seed_database()
            seed_database()
            assert Developer.query.count() == 5
    finally:
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()
