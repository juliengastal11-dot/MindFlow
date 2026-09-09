"""Vues agrégées : aujourd'hui, vue d'ensemble, bilan hebdomadaire."""
from datetime import datetime, timedelta, timezone

from helpers import create_item, paris_iso, patch_item, today_paris


def test_today(client, user):
    headers = user["headers"]
    today = today_paris()
    tomorrow = today + timedelta(days=1)
    yesterday = today - timedelta(days=1)

    planned_today = create_item(client, user, title="Ce matin", status="active", importance="prioritaire",
                                estimated_minutes=15, planned_at=paris_iso(today, 10))
    create_item(client, user, title="Demain", status="active", planned_at=paris_iso(tomorrow, 10))
    create_item(client, user, title="Hier", status="active", planned_at=paris_iso(yesterday, 10))
    due_today = create_item(client, user, title="Échéance", status="active", estimated_minutes=30, due_at=today.isoformat())
    create_item(client, user, title="Inbox", status="inbox")
    done = create_item(client, user, title="Faite ce matin", status="active", estimated_minutes=20, planned_at=paris_iso(today, 8))
    patch_item(client, user, done["id"], status="done")

    data = client.get("/api/today", headers=headers).json()
    assert data["date"] == today.isoformat()
    assert data["timezone"] == "Europe/Paris"
    titles = [i["title"] for i in data["items"]]
    assert titles == ["Ce matin", "Échéance", "Faite ce matin"]  # actives d'abord (par importance), terminées en dernier
    assert data["total_minutes"] == 45  # les terminées ne comptent pas
    assert data["remaining_count"] == 2 and data["done_count"] == 1
    assert {planned_today["id"], due_today["id"]} <= {i["id"] for i in data["items"]}

    # Sans en-tête de fuseau : la journée est calculée en UTC (l'API répond quand même)
    response = client.get("/api/today", headers={"Authorization": headers["Authorization"]})
    assert response.status_code == 200 and response.json()["timezone"] == "UTC"


def test_overview(client, user):
    headers = user["headers"]
    today = today_paris()
    late = create_item(client, user, title="En retard", status="active", due_at=(today - timedelta(days=2)).isoformat())
    passed = create_item(client, user, title="Créneau passé", status="active", planned_at=paris_iso(today - timedelta(days=1), 9))
    create_item(client, user, title="Plus tard", status="active", due_at=(today + timedelta(days=3)).isoformat())
    create_item(client, user, title="Au parking", status="parked")
    create_item(client, user, title="Dans l'inbox", status="inbox")
    prio = create_item(client, user, title="Priorité faite", status="active", importance="prioritaire", estimated_minutes=40)
    patch_item(client, user, prio["id"], status="done")
    often = create_item(client, user, title="Toujours reporté", status="active", planned_at="2026-09-10T08:00:00Z")
    for day in (11, 12, 13):
        client.post(f"/api/items/{often['id']}/postpone", json={"planned_at": f"2026-09-{day}T08:00:00Z"}, headers=headers)

    data = client.get("/api/overview", headers=headers).json()
    assert data["done_count"] == 1 and data["prio_done_count"] == 1 and data["minutes_done"] == 40
    assert data["captured_count"] == 7
    assert data["postponed_week"] == 3
    assert data["inbox_count"] == 1 and data["parking_count"] == 1 and data["active_count"] == 4
    assert {i["id"] for i in data["overdue"]} == {late["id"], passed["id"]}
    assert [(i["title"], i["postpone_count"]) for i in data["often_postponed"]] == [("Toujours reporté", 3)]


def test_week_recap(client, user):
    headers = user["headers"]
    now = datetime.now(timezone.utc)
    item = create_item(client, user, title="À reporter", status="active", estimated_minutes=30, planned_at=now.isoformat())
    for minutes in (5, 10):
        client.post(f"/api/items/{item['id']}/postpone", json={"planned_at": (now + timedelta(minutes=minutes)).isoformat()}, headers=headers)
    done = create_item(client, user, title="Terminée", status="active", importance="prioritaire", estimated_minutes=45)
    patch_item(client, user, done["id"], status="done")

    week = client.get("/api/overview/week", headers=headers).json()
    assert week["offset"] == 0
    assert week["done_count"] == 1 and week["prio_done_count"] == 1 and week["minutes_done"] == 45
    assert week["captured_count"] == 2
    assert week["postponed_count"] == 2
    assert week["planned_count"] == 1 and week["planned_done_count"] == 0
    assert len(week["days"]) == 7
    assert sum(d["done"] for d in week["days"]) == 1
    assert week["best_day"] == today_paris().isoformat()
    assert week["week_start"] == week["days"][0]["date"]
    assert [i["title"] for i in week["often_postponed"]] == ["À reporter"]

    # Le journal des reports survit à la suppression de l'élément
    client.delete(f"/api/items/{item['id']}", headers=headers)
    assert client.get("/api/overview/week", headers=headers).json()["postponed_count"] == 2

    last_week = client.get("/api/overview/week", params={"offset": -1}, headers=headers).json()
    assert last_week["done_count"] == 0 and last_week["postponed_count"] == 0
    assert client.get("/api/overview/week", params={"offset": 1}, headers=headers).status_code == 422
