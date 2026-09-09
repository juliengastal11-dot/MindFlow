"""Santé de l'API, inscription, connexion, session, protection des routes."""


def test_health_and_root(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.get("/api").json()["message"] == "MindFlow Business API"


def test_register_login_me(client):
    response = client.post("/api/auth/register", json={"email": "Alice@Exemple.fr", "password": "secret123", "name": "Alice"})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == "alice@exemple.fr"  # email normalisé
    assert data["name"] == "Alice"
    assert data["onboarded"] is False
    assert data["ai_key_set"] is False
    assert data["google_calendar_available"] is False
    assert data["access_token"]
    assert "mindflow_token" in response.cookies

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    client.cookies.clear()
    assert client.get("/api/auth/me", headers=headers).json()["email"] == "alice@exemple.fr"

    # Connexion : email insensible à la casse
    response = client.post("/api/auth/login", json={"email": "ALICE@exemple.fr", "password": "secret123"})
    assert response.status_code == 200
    client.cookies.clear()

    # Le cookie seul suffit aussi
    response = client.post("/api/auth/login", json={"email": "alice@exemple.fr", "password": "secret123"})
    assert client.get("/api/auth/me").status_code == 200
    assert client.post("/api/auth/logout").json() == {"ok": True}
    client.cookies.clear()


def test_login_errors(client):
    client.post("/api/auth/register", json={"email": "bob@exemple.fr", "password": "secret123"})
    client.cookies.clear()
    response = client.post("/api/auth/login", json={"email": "bob@exemple.fr", "password": "mauvais"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Email ou mot de passe incorrect"
    response = client.post("/api/auth/register", json={"email": "bob@exemple.fr", "password": "secret123"})
    assert response.status_code == 400
    assert "existe déjà" in response.json()["detail"]


def test_validation_messages_in_french(client):
    response = client.post("/api/auth/register", json={"email": "pas-un-email", "password": "123"})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "Adresse email invalide" in detail
    assert "au moins 6 caractères" in detail


def test_routes_require_auth(client):
    client.cookies.clear()
    for path in ("/api/auth/me", "/api/items", "/api/today", "/api/overview", "/api/buckets"):
        response = client.get(path)
        assert response.status_code == 401, path
    assert client.get("/api/today", headers={"Authorization": "Bearer n-importe-quoi"}).status_code == 401


def test_default_buckets_created_on_register(client, user):
    buckets = client.get("/api/buckets", headers=user["headers"]).json()
    assert [b["name"] for b in buckets] == ["À faire un jour", "Idées"]
    assert all(b["is_default"] for b in buckets)
