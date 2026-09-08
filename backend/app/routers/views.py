"""Vues agrégées : « Aujourd'hui » et « Vue d'ensemble »."""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, get_timezone
from ..models import Item, User, utcnow
from ..schemas import IMPORTANCE_ORDER
from ..serializers import item_dict
from ..timeutil import day_bounds_utc, iso_utc, local_today, week_start_utc

router = APIRouter(tags=["views"])


def _importance_rank(item: Item) -> int:
    return IMPORTANCE_ORDER.index(item.importance) if item.importance in IMPORTANCE_ORDER else 3


@router.get("/today")
def today_view(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    tz: ZoneInfo = Depends(get_timezone),
):
    """Éléments planifiés aujourd'hui (heure locale) + tâches actives arrivant à échéance aujourd'hui."""
    day = local_today(tz)
    start, end = day_bounds_utc(tz, day)
    query = select(Item).where(
        Item.user_id == user.id,
        Item.status.in_(["active", "done"]),
        or_(
            and_(Item.planned_at.is_not(None), Item.planned_at >= start, Item.planned_at < end),
            and_(Item.status == "active", Item.due_at == day),
        ),
    )
    items = db.scalars(query).all()
    items.sort(key=lambda i: (i.status == "done", _importance_rank(i), i.planned_at or datetime.max))
    remaining = [i for i in items if i.status != "done"]
    return {
        "date": day.isoformat(),
        "timezone": str(tz),
        "items": [item_dict(i) for i in items],
        "total_minutes": sum(i.estimated_minutes or 0 for i in remaining),
        "remaining_count": len(remaining),
        "done_count": len(items) - len(remaining),
    }


@router.get("/overview")
def overview_view(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    tz: ZoneInfo = Depends(get_timezone),
):
    """Statistiques de la semaine, retards, éléments souvent reportés, compteurs."""
    now = utcnow()
    day = local_today(tz)
    week_start = week_start_utc(tz)
    items = db.scalars(select(Item).where(Item.user_id == user.id)).all()

    done_week = [i for i in items if i.status == "done" and i.done_at and i.done_at >= week_start]
    captured_week = [i for i in items if i.created_at and i.created_at >= week_start]
    active = [i for i in items if i.status == "active"]

    overdue = [
        i for i in active
        if (i.due_at and i.due_at < day) or (i.planned_end and i.planned_end < now)
    ]
    overdue.sort(key=lambda i: (_importance_rank(i), i.due_at or (i.planned_end.date() if i.planned_end else day)))

    often_postponed = sorted(
        [i for i in items if i.status != "done" and (i.postpone_count or 0) >= 2],
        key=lambda i: -(i.postpone_count or 0),
    )[:5]

    return {
        "week_start": iso_utc(week_start),
        "done_count": len(done_week),
        "prio_done_count": sum(1 for i in done_week if i.importance == "prioritaire"),
        "minutes_done": sum(i.estimated_minutes or 0 for i in done_week),
        "captured_count": len(captured_week),
        "postponed_week": sum(1 for i in items if (i.postpone_count or 0) > 0 and i.updated_at and i.updated_at >= week_start),
        "overdue": [item_dict(i) for i in overdue[:20]],
        "often_postponed": [item_dict(i) for i in often_postponed],
        "inbox_count": sum(1 for i in items if i.status == "inbox"),
        "parking_count": sum(1 for i in items if i.status == "parked"),
        "active_count": len(active),
    }
