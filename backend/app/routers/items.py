"""Éléments (tâches, idées, notes) : CRUD, triage depuis l'inbox, report."""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Bucket, Item, User, utcnow
from ..schemas import IMPORTANCE_ORDER, ItemCreate, ItemUpdate, PostponeIn, TriageIn
from ..serializers import item_dict
from ..services import gcal
from ..timeutil import parse_date, parse_dt

router = APIRouter(prefix="/items", tags=["items"])


# ---- Helpers -------------------------------------------------------------

def get_item_or_404(db: Session, user: User, item_id: str) -> Item:
    item = db.get(Item, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Élément introuvable")
    return item


def get_bucket_or_404(db: Session, user: User, bucket_id: str) -> Bucket:
    bucket = db.get(Bucket, bucket_id)
    if bucket is None or bucket.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bucket introuvable")
    return bucket


def sort_key(item: Item):
    importance = item.importance if item.importance in IMPORTANCE_ORDER else "aucune"
    return (
        IMPORTANCE_ORDER.index(importance),
        item.planned_at or datetime.max,
        -(item.created_at.timestamp() if item.created_at else 0),
    )


def set_status(item: Item, new_status: str) -> None:
    if new_status == "done":
        if item.status != "done":
            item.done_at = utcnow()
    else:
        item.done_at = None
    item.status = new_status


def apply_fields(item: Item, data: dict, db: Session, user: User) -> None:
    """Applique les champs d'un ItemCreate / ItemUpdate (dict exclude_unset)."""
    if data.get("title") is not None:
        item.title = data["title"].strip()
    if data.get("note") is not None:
        item.note = data["note"]
    if data.get("type") is not None:
        item.type = data["type"]
    if data.get("importance") is not None:
        item.importance = data["importance"]
    if data.get("estimated_minutes") is not None:
        item.estimated_minutes = int(data["estimated_minutes"])

    if data.get("bucket_id"):
        item.bucket_id = get_bucket_or_404(db, user, data["bucket_id"]).id
    if data.get("clear_bucket"):
        item.bucket_id = None

    if "due_at" in data:
        item.due_at = parse_date(data["due_at"])

    if data.get("clear_planned"):
        item.planned_at = None
        item.planned_end = None
    elif data.get("planned_at"):
        start = parse_dt(data["planned_at"])
        end = parse_dt(data["planned_end"]) if data.get("planned_end") else None
        if end is None or end <= start:
            end = start + timedelta(minutes=item.estimated_minutes or 30)
        item.planned_at = start
        item.planned_end = end
        if item.status == "inbox":
            item.status = "active"

    if data.get("status") is not None:
        set_status(item, data["status"])


def schedule_sync(background: BackgroundTasks, user: User, item: Item) -> None:
    if user.google_tokens_encrypted:
        background.add_task(gcal.sync_item_task, user.id, item.id)


# ---- Routes --------------------------------------------------------------

@router.get("")
def list_items(
    status: str | None = Query(default=None, description="Statuts séparés par des virgules : inbox,active,parked,done"),
    planned: bool | None = Query(default=None),
    bucket_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Item).where(Item.user_id == user.id)
    if status:
        statuses = [s.strip() for s in status.split(",") if s.strip()]
        query = query.where(Item.status.in_(statuses))
    if planned is True:
        query = query.where(Item.planned_at.is_not(None))
    elif planned is False:
        query = query.where(Item.planned_at.is_(None))
    if bucket_id:
        query = query.where(Item.bucket_id == bucket_id)
    items = sorted(db.scalars(query).all(), key=sort_key)
    return [item_dict(i) for i in items]


@router.post("", status_code=201)
def create_item(
    body: ItemCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = Item(user_id=user.id, title=body.title)
    apply_fields(item, body.model_dump(exclude_unset=True), db, user)
    db.add(item)
    db.commit()
    db.refresh(item)
    schedule_sync(background, user, item)
    return item_dict(item)


@router.get("/{item_id}")
def get_item(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return item_dict(get_item_or_404(db, user, item_id))


@router.patch("/{item_id}")
def update_item(
    item_id: str,
    body: ItemUpdate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_item_or_404(db, user, item_id)
    apply_fields(item, body.model_dump(exclude_unset=True), db, user)
    db.commit()
    db.refresh(item)
    schedule_sync(background, user, item)
    return item_dict(item)


@router.delete("/{item_id}")
def delete_item(
    item_id: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_item_or_404(db, user, item_id)
    event_id = item.google_event_id
    db.delete(item)
    db.commit()
    if event_id and user.google_tokens_encrypted:
        background.add_task(gcal.delete_event_task, user.id, event_id)
    return {"deleted": True, "id": item_id}


@router.post("/{item_id}/triage")
def triage_item(
    item_id: str,
    body: TriageIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Décide quoi faire d'un élément capturé : tâche, idée, note, bucket, parking, ignorer."""
    item = get_item_or_404(db, user, item_id)
    action = body.action

    if action == "ignorer":
        event_id = item.google_event_id
        db.delete(item)
        db.commit()
        if event_id and user.google_tokens_encrypted:
            background.add_task(gcal.delete_event_task, user.id, event_id)
        return {"deleted": True, "id": item_id}

    if action == "tache":
        item.type = "task"
        set_status(item, "active")
    elif action == "idee":
        item.type = "idea"
        set_status(item, "active")
    elif action == "note":
        item.type = "note"
        set_status(item, "active")
    elif action == "bucket":
        if not body.bucket_id:
            raise HTTPException(status_code=422, detail="Choisissez un bucket")
        item.bucket_id = get_bucket_or_404(db, user, body.bucket_id).id
        set_status(item, "active")
    elif action == "parking":
        set_status(item, "parked")
    elif action == "planifier":
        # Le créneau est envoyé ensuite via PATCH (planned_at / planned_end)
        set_status(item, "active")

    db.commit()
    db.refresh(item)
    return item_dict(item)


@router.post("/{item_id}/postpone")
def postpone_item(
    item_id: str,
    body: PostponeIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Reporte un créneau planifié et compte le report (« ce que tu repousses souvent »)."""
    item = get_item_or_404(db, user, item_id)
    start = parse_dt(body.planned_at)
    end = parse_dt(body.planned_end) if body.planned_end else None
    if end is None or end <= start:
        if item.planned_at and item.planned_end and item.planned_end > item.planned_at:
            duration = item.planned_end - item.planned_at
        else:
            duration = timedelta(minutes=item.estimated_minutes or 30)
        end = start + duration
    item.planned_at = start
    item.planned_end = end
    item.postpone_count = (item.postpone_count or 0) + 1
    if item.status != "active":
        set_status(item, "active")
    db.commit()
    db.refresh(item)
    schedule_sync(background, user, item)
    return item_dict(item)
