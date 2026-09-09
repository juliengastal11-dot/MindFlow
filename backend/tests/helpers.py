"""Petits utilitaires partagés par les tests."""
from __future__ import annotations

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")


def create_item(client, user, **body):
    payload = {"title": "Tâche de test", **body}
    response = client.post("/api/items", json=payload, headers=user["headers"])
    assert response.status_code == 201, response.text
    return response.json()


def patch_item(client, user, item_id, **body):
    response = client.patch(f"/api/items/{item_id}", json=body, headers=user["headers"])
    assert response.status_code == 200, response.text
    return response.json()


def today_paris() -> date:
    return datetime.now(PARIS).date()


def paris_iso(day: date, hour: int, minute: int = 0) -> str:
    """Heure locale (Paris) -> chaîne ISO en UTC, comme l'envoie le navigateur."""
    moment = datetime(day.year, day.month, day.day, hour, minute, tzinfo=PARIS).astimezone(timezone.utc)
    return moment.isoformat().replace("+00:00", "Z")
