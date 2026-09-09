"""Réglages, buckets, clé IA, assistant IA (heuristiques et fournisseur simulé), Google Calendar."""
import json

import pytest

from app.services import ai
from app.services.ai import Entry, heuristic
from helpers import create_item


def test_settings(client, user):
    headers = user["headers"]
    data = client.patch("/api/settings", json={"name": "  Julien ", "interests": ["tech", "design", "inconnu"],
                                                "reminder_delay_minutes": 30, "onboarded": True}, headers=headers).json()
    assert data["name"] == "Julien"
    assert data["interests"] == ["tech", "design"]  # les clés inconnues sont ignorées
    assert data["reminder_delay_minutes"] == 30
    assert data["onboarded"] is True

    response = client.patch("/api/settings", json={"interests": ["tech", "design", "ventes", "finance"]}, headers=headers)
    assert response.status_code == 422 and "3 centres" in response.json()["detail"]
    assert client.patch("/api/settings", json={"reminder_delay_minutes": 5000}, headers=headers).status_code == 422
    assert client.patch("/api/settings", json={"reminder_delay_minutes": -1}, headers=headers).json()["reminder_delay_minutes"] == -1
    assert client.patch("/api/settings", json={"ai_provider": "gemini"}, headers=headers).json()["ai_provider"] == "gemini"


def test_buckets(client, user):
    headers = user["headers"]
    response = client.post("/api/buckets", json={"name": "Voyages", "emoji": "✈️", "color": "#38BDF8"}, headers=headers)
    assert response.status_code == 201
    bucket = response.json()
    assert bucket["emoji"] == "✈️" and bucket["is_default"] is False and bucket["position"] == 2

    item = create_item(client, user, status="active", bucket_id=bucket["id"])
    assert item["bucket_id"] == bucket["id"]
    renamed = client.patch(f"/api/buckets/{bucket['id']}", json={"name": "Escapades"}, headers=headers).json()
    assert renamed["name"] == "Escapades"

    default = client.get("/api/buckets", headers=headers).json()[0]
    response = client.delete(f"/api/buckets/{default['id']}", headers=headers)
    assert response.status_code == 400

    assert client.delete(f"/api/buckets/{bucket['id']}", headers=headers).json()["deleted"] is True
    # L'élément est conservé, simplement détaché
    assert client.get(f"/api/items/{item['id']}", headers=headers).json()["bucket_id"] is None
    assert client.post("/api/buckets", json={"name": "   "}, headers=headers).status_code == 422


def test_ai_key_lifecycle(client, user):
    headers = user["headers"]
    data = client.post("/api/settings/ai-key", json={"provider": "anthropic", "api_key": "sk-ant-test-000000"}, headers=headers).json()
    assert data["ai_key_set"] is True and data["ai_provider"] == "anthropic"
    assert "api_key" not in data and "ai_key_encrypted" not in data
    assert client.post("/api/settings/ai-key", json={"provider": "openai", "api_key": "court"}, headers=headers).status_code == 422
    assert client.delete("/api/settings/ai-key", headers=headers).json()["ai_key_set"] is False


@pytest.mark.parametrize(
    "title, importance, kind, minutes, action",
    [
        ("Payer l'URSSAF avant demain", "prioritaire", "task", 15, "tache"),
        ("Appeler le comptable", "important", "task", 15, "tache"),
        ("Inviter Léa au séminaire", "aucune", "task", 30, "tache"),
        ("Note : lien vers le dossier partagé", "aucune", "note", 5, "note"),
        ("Regarder le film Dune un jour", "aucune", "task", 30, "parking"),
        ("Créer une nouvelle app mobile", "aucune", "idea", 120, "idee"),
        ("Rédiger l'article de blog", "aucune", "task", 60, "tache"),
        ("Répondre au mail de Sophie", "aucune", "task", 15, "tache"),
        ("Préparer la présentation client pour vendredi", "important", "task", 60, "tache"),
    ],
)
def test_heuristics(title, importance, kind, minutes, action):
    suggestion = heuristic(Entry(id="x", title=title))
    assert (suggestion.importance, suggestion.type, suggestion.estimated_minutes, suggestion.action) == (importance, kind, minutes, action)


def test_ai_without_key_uses_heuristics(client, user):
    headers = user["headers"]
    data = client.post("/api/ai/suggest", json={"text": "Payer l'URSSAF avant demain"}, headers=headers).json()
    assert data["source"] == "heuristic" and data["importance"] == "prioritaire"

    a = create_item(client, user, title="Appeler le comptable", status="inbox")
    b = create_item(client, user, title="Aller à Lisbonne un jour", status="inbox")
    response = client.post("/api/ai/organize", json={"item_ids": [a["id"], b["id"], "inconnu"]}, headers=headers)
    assert response.status_code == 200
    suggestions = {s["id"]: s for s in response.json()["suggestions"]}
    assert set(suggestions) == {a["id"], b["id"]}
    assert suggestions[b["id"]]["action"] == "parking"
    assert client.post("/api/ai/organize", json={"item_ids": ["inconnu"]}, headers=headers).status_code == 404
    assert client.post("/api/ai/suggest", json={"text": ""}, headers=headers).status_code == 422


def test_ai_provider_responses_are_parsed(client, user, monkeypatch):
    headers = user["headers"]
    client.post("/api/settings/ai-key", json={"provider": "anthropic", "api_key": "sk-ant-test-000000"}, headers=headers)

    def fake_provider(api_key, current_user, entries):
        assert api_key == "sk-ant-test-000000"
        return json.dumps({"suggestions": [
            {"id": e.id, "importance": "urgent", "type": "task", "estimated_minutes": 17, "action": "tache"} for e in entries
        ]})

    monkeypatch.setitem(ai.PROVIDERS, "anthropic", fake_provider)
    data = client.post("/api/ai/suggest", json={"text": "Un truc"}, headers=headers).json()
    assert data["source"] == "ai:anthropic"
    assert data["importance"] == "urgent"
    assert data["estimated_minutes"] == 15  # arrondi au palier le plus proche

    # Réponse dans un bloc ```json, liste nue, valeurs hors référentiel remplacées par l'heuristique
    def fenced_provider(api_key, current_user, entries):
        return "```json\n" + json.dumps([{"id": e.id, "importance": "extreme", "type": "idea", "estimated_minutes": 60, "action": "idee"} for e in entries]) + "\n```"

    monkeypatch.setitem(ai.PROVIDERS, "anthropic", fenced_provider)
    item = create_item(client, user, title="Appeler le comptable", status="inbox")
    suggestion = client.post("/api/ai/organize", json={"item_ids": [item["id"]]}, headers=headers).json()["suggestions"][0]
    assert suggestion["type"] == "idea" and suggestion["action"] == "idee" and suggestion["estimated_minutes"] == 60
    assert suggestion["importance"] == "important"  # valeur invalide -> heuristique

    def failing_provider(api_key, current_user, entries):
        raise ai.AiError(400, "Clé Anthropic invalide")

    monkeypatch.setitem(ai.PROVIDERS, "anthropic", failing_provider)
    response = client.post("/api/ai/suggest", json={"text": "Un truc"}, headers=headers)
    assert response.status_code == 400 and response.json()["detail"] == "Clé Anthropic invalide"

    def broken_provider(api_key, current_user, entries):
        return "pas du json"

    monkeypatch.setitem(ai.PROVIDERS, "anthropic", broken_provider)
    assert client.post("/api/ai/suggest", json={"text": "Un truc"}, headers=headers).status_code == 502


def test_calendar_not_configured(client, user):
    response = client.get("/api/oauth/calendar/connect", headers=user["headers"])
    assert response.status_code == 400 and "GOOGLE_CLIENT_ID" in response.json()["detail"]
    response = client.get("/api/oauth/calendar/callback", params={"error": "access_denied"}, follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"] == "http://front.test/app/parametres?calendar=error"
    assert client.post("/api/oauth/calendar/disconnect", headers=user["headers"]).json() == {"ok": True}
