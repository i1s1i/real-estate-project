from threading import Thread

import pytest
from werkzeug.serving import make_server

from app import create_app, db
from app.utils.seed_data import seed_database
from config import config as app_configs


@pytest.fixture(scope="session")
def live_server(tmp_path_factory):
    database_path = tmp_path_factory.mktemp("browser-tests") / "site.sqlite"
    config_name = "browser_tests"
    app_configs[config_name] = type(
        "BrowserTestConfig",
        (app_configs["default"],),
        {
            "TESTING": True,
            "SECRET_KEY": "browser-test-secret",
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{database_path.as_posix()}",
            "ADMIN_USERNAME": "browser-admin",
            "ADMIN_PASSWORD": "browser-test-password",
        },
    )
    try:
        app = create_app(config_name)
    finally:
        del app_configs[config_name]

    with app.app_context():
        db.create_all()
        seed_database()

    server = make_server("127.0.0.1", 0, app, threaded=True)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        thread.join(timeout=5)
        with app.app_context():
            db.session.remove()
            db.engine.dispose()


@pytest.fixture
def site_page(page, live_server):
    page.set_default_timeout(10_000)
    page.goto(live_server, wait_until="domcontentloaded")
    return page


@pytest.fixture(autouse=True)
def check_for_uncaught_page_errors(page):
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    yield
    assert not errors, f"Uncaught browser errors: {errors}"
