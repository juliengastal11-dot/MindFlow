"""Éléments : capture, filtres, modification, planification, triage, report, isolation."""
import pytest

from helpers import create_item, patch_item


def test_capture_defaults(client, user):
    item = create_item(client, user, title="  Appeler le comptable ", status="inbox")
    assert item["title"] == "Appeler le comptable"
    assert item["status"] == "inbox"
    assert item["type"] == "task"
    assert item["importance"] == "aucune"
    assert item["estimated_minutes"] == 0
    assert item["planned_at"] is None and item["due_at"] is None
    assert item["postpone_count"] == 0


def test_list_filters(client, user):
    create_item(client, user, title="A", status="inbox")
    create_item(client, user, title="B", status="inbox")
    create_item(client, user, title="C", status="active", planned_at="2026-09-10T08:00:00Z")
    create_item(client, user, title="D", status="parked")
    headers = user["headers"]

    def titles(params):
        return sorted(i["title"] for i in client.get("/api/items", params=params, headers=headers).json())

    assert titles({"status": "inbox"}) == ["A", "B"]
    assert titles({"status": "active", "planned": "true"}) == ["C"]
    assert titles({"status": "inbox,active"}) == ["A", "B", "C"]
    assert titles({"status": "active,parked", "planned": "false"}) == ["D"]
    assert titles({}) == ["A", "B", "C", "D"]


def test_list_sorted_by_importance(client, user):
    create_item(client, user, title="normale", status="active")
    create_item(client, user, title="urgente", status="active", importance="urgent")
    create_item(client, user, title="prioritaire", status="active", importance="prioritaire")
    create_item(client, user, title="importante", status="active", importance="important")
    items = client.get("/api/items", params={"status": "active"}, headers=user["headers"]).json()
    assert [i["title"] for i in items] == ["prioritaire", "importante", "urgente", "normale"]


def test_patch_fields(client, user):
    item = create_item(client, user, status="inbox")
    updated = patch_item(client, user, item["id"], title="  Nouveau titre ", importance="prioritaire", estimated_minutes=45,
                         due_at="2026-09-12", note="Une note", type="idea")
    assert updated["title"] == "Nouveau titre"
    assert updated["importance"] == "prioritaire"
    assert updated["estimated_minutes"] == 45
    assert updated["due_at"] == "2026-09-12"
    assert updated["note"] == "Une note"
    assert updated["type"] == "idea"
    # Effacer l'échéance en envoyant null
    assert patch_item(client, user, item["id"], due_at=None)["due_at"] is None


def test_planning_rules(client, user):
    item = create_item(client, user, status="inbox", estimated_minutes=45)
    # Planifier sans heure de fin : fin = début + estimation, et l'élément quitte l'inbox
    planned = patch_item(client, user, item["id"], planned_at="2026-09-10T08:00:00Z")
    assert planned["planned_at"] == "2026-09-10T08:00:00Z"
    assert planned["planned_end"] == "2026-09-10T08:45:00Z"
    assert planned["status"] == "active"
    # Une fin antérieure au début est recalculée
    planned = patch_item(client, user, item["id"], planned_at="2026-09-10T10:00:00Z", planned_end="2026-09-10T09:00:00Z")
    assert planned["planned_end"] == "2026-09-10T10:45:00Z"
    # Fuseau explicite converti en UTC
    planned = patch_item(client, user, item["id"], planned_at="2026-09-10T14:00:00+02:00", planned_end="2026-09-10T15:00:00+02:00")
    assert planned["planned_at"] == "2026-09-10T12:00:00Z"
    assert planned["planned_end"] == "2026-09-10T13:00:00Z"
    # Déplanifier
    cleared = patch_item(client, user, item["id"], clear_planned=True)
    assert cleared["planned_at"] is None and cleared["planned_end"] is None


def test_done_and_back(client, user):
    item = create_item(client, user, status="active")
    done = patch_item(client, user, item["id"], status="done")
    assert done["status"] == "done" and done["done_at"] is not None
    back = patch_item(client, user, item["id"], status="active")
    assert back["status"] == "active" and back["done_at"] is None


@pytest.mark.parametrize(
    "payload, fragment",
    [
        ({"title": "   "}, "Le titre est requis"),
        ({"title": "x", "importance": "haute"}, "importance"),
        ({"title": "x", "planned_at": "hier soir"}, "Date invalide"),
        ({"title": "x", "estimated_minutes": -5}, "estimated_minutes"),
        ({"title": "x", "status": "fini"}, "status"),
    ],
)
def test_validation(client, user, payload, fragment):
    response = client.post("/api/items", json=payload, headers=user["headers"])
    assert response.status_code == 422, response.text
    assert fragment in response.json()["detail"]


@pytest.mark.parametrize(
    "action, expected_type, expected_status",
    [
        ("tache", "task", "active"),
        ("idee", "idea", "active"),
        ("note", "note", "active"),
        ("parking", "task", "parked"),
        ("planifier", "task", "active"),
    ],
)
def test_triage_actions(client, user, action, expected_type, expected_status):
    item = create_item(client, user, status="inbox")
    response = client.post(f"/api/items/{item['id']}/triage", json={"action": action}, headers=user["headers"])
    assert response.status_code == 200, response.text
    assert response.json()["type"] == expected_type
    assert response.json()["status"] == expected_status


def test_triage_bucket_and_ignore(client, user):
    headers = user["headers"]
    bucket = client.get("/api/buckets", headers=headers).json()[0]
    item = create_item(client, user, status="inbox")

    response = client.post(f"/api/items/{item['id']}/triage", json={"action": "bucket"}, headers=headers)
    assert response.status_code == 422
    assert response.json()["detail"] == "Choisissez un bucket"

    response = client.post(f"/api/items/{item['id']}/triage", json={"action": "bucket", "bucket_id": bucket["id"]}, headers=headers)
    assert response.status_code == 200
    assert response.json()["bucket_id"] == bucket["id"]
    assert response.json()["status"] == "active"

    response = client.post(f"/api/items/{item['id']}/triage", json={"action": "bucket", "bucket_id": "inexistant"}, headers=headers)
    assert response.status_code == 404

    response = client.post(f"/api/items/{item['id']}/triage", json={"action": "ignorer"}, headers=headers)
    assert response.json() == {"deleted": True, "id": item["id"]}
    assert client.get(f"/api/items/{item['id']}", headers=headers).status_code == 404

    response = client.post(f"/api/items/{item['id']}/triage", json={"action": "danser"}, headers=headers)
    assert response.status_code == 422


def test_postpone(client, user):
    headers = user["headers"]
    item = create_item(client, user, status="active", estimated_minutes=30, planned_at="2026-09-10T08:00:00Z")
    assert item["planned_end"] == "2026-09-10T08:30:00Z"

    response = client.post(f"/api/items/{item['id']}/postpone", json={"planned_at": "2026-09-10T10:00:00Z"}, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["planned_at"] == "2026-09-10T10:00:00Z"
    assert data["planned_end"] == "2026-09-10T10:30:00Z"  # durée conservée
    assert data["postpone_count"] == 1

    response = client.post(f"/api/items/{item['id']}/postpone",
                           json={"planned_at": "2026-09-11T10:00:00Z", "planned_end": "2026-09-11T11:00:00Z"}, headers=headers)
    assert response.json()["planned_end"] == "2026-09-11T11:00:00Z"
    assert response.json()["postpone_count"] == 2

    # Un élément au parking reporté redevient actif
    client.post(f"/api/items/{item['id']}/triage", json={"action": "parking"}, headers=headers)
    response = client.post(f"/api/items/{item['id']}/postpone", json={"planned_at": "2026-09-12T10:00:00Z"}, headers=headers)
    assert response.json()["status"] == "active"
    assert response.json()["postpone_count"] == 3


def test_delete(client, user):
    item = create_item(client, user)
    assert client.delete(f"/api/items/{item['id']}", headers=user["headers"]).json()["deleted"] is True
    assert client.delete(f"/api/items/{item['id']}", headers=user["headers"]).status_code == 404


def test_users_are_isolated(client, make_user):
    alice, bob = make_user("Alice"), make_user("Bob")
    item = create_item(client, alice, title="Secret d'Alice")
    assert client.get("/api/items", headers=bob["headers"]).json() == []
    assert client.get(f"/api/items/{item['id']}", headers=bob["headers"]).status_code == 404
    assert client.patch(f"/api/items/{item['id']}", json={"title": "pirate"}, headers=bob["headers"]).status_code == 404
    assert client.delete(f"/api/items/{item['id']}", headers=bob["headers"]).status_code == 404
    bucket = client.get("/api/buckets", headers=bob["headers"]).json()[0]
    # Alice ne peut pas ranger dans un bucket de Bob
    response = client.patch(f"/api/items/{item['id']}", json={"bucket_id": bucket["id"]}, headers=alice["headers"])
    assert response.status_code == 404
