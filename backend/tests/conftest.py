"""Configuration des tests : base SQLite temporaire, pas de compte démo, clés vides."""
from __future__ import annotations

import itertools
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # backend/
sys.path.insert(0, str(ROOT))

_tmp = Path(tempfile.mkdtemp(prefix="mindflow-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_tmp / 'test.db').as_posix()}"
os.environ["SEED_DEMO"] = "false"
os.environ["SECRET_KEY"] = "cle-de-test-suffisamment-longue-0123456789"
os.environ["GOOGLE_CLIENT_ID"] = ""
os.environ["GOOGLE_CLIENT_SECRET"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["FRONTEND_URL"] = "http://front.test"
os.environ["FRONTEND_DIST"] = str(_tmp / "pas-de-build")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

_counter = itertools.count(1)


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def make_user(client):
    """Crée un compte et renvoie ses en-têtes (Bearer + fuseau Europe/Paris)."""

    def _make(name: str = "Utilisateur"):
        n = next(_counter)
        email = f"user{n}@exemple.fr"
        response = client.post("/api/auth/register", json={"email": email, "password": "secret123", "name": f"{name} {n}"})
        assert response.status_code == 200, response.text
        client.cookies.clear()  # on s'authentifie explicitement par en-tête
        data = response.json()
        return {
            "id": data["id"],
            "email": email,
            "headers": {"Authorization": f"Bearer {data['access_token']}", "X-Timezone": "Europe/Paris"},
        }

    return _make


@pytest.fixture
def user(make_user):
    return make_user()
