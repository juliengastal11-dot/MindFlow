"""Vues agrégées : « Aujourd'hui », « Vue d'ensemble » et bilan hebdomadaire."""
from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user, get_timezone
from ..models import Item, ItemEvent, User, utcnow
from ..schemas import IMPORTANCE_ORDER
from ..serializers import item_dict
from ..timeutil import UTC, day_bounds_utc, iso_utc, local_today, week_start_utc

router = APIRouter(tags=["views"])


def _importance_rank(item: Item) -> int:
    return IMPORTANCE_ORDER.index(item.importance) if item.importance in IMPORTANCE_ORDER else 3


def _count_events(db: Session, user: User, kind: str, start: datetime, end: datetime) -> int:
    return db.scalar(
        select(func.count(ItemEvent.id)).where(
            ItemEvent.user_id == user.id,
            ItemEvent.kind == kind,
            ItemEvent.created_at >= start,
            ItemEvent.created_at < end,
        )
    ) or 0


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
        "postponed_week": _count_events(db, user, "postponed", week_start, week_start + timedelta(days=7)),
        "overdue": [item_dict(i) for i in overdue[:20]],
        "often_postponed": [item_dict(i) for i in often_postponed],
        "inbox_count": sum(1 for i in items if i.status == "inbox"),
        "parking_count": sum(1 for i in items if i.status == "parked"),
        "active_count": len(active),
    }


@router.get("/overview/week")
def week_recap(
    offset: int = Query(default=0, ge=-52, le=0, description="0 = semaine en cours, -1 = semaine dernière…"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    tz: ZoneInfo = Depends(get_timezone),
):
    """Bilan d'une semaine (lundi → dimanche, heure locale) : totaux, détail par jour, reports."""
    week_start = week_start_utc(tz) + timedelta(weeks=offset)
    week_end = week_start + timedelta(days=7)
    start_local = week_start.replace(tzinfo=UTC).astimezone(tz).date()
    items = db.scalars(select(Item).where(Item.user_id == user.id)).all()

    def in_week(moment: datetime | None) -> bool:
        return moment is not None and week_start <= moment < week_end

    def day_index(moment: datetime) -> int:
        return (moment.replace(tzinfo=UTC).astimezone(tz).date() - start_local).days

    done = [i for i in items if i.status == "done" and in_week(i.done_at)]
    captured = [i for i in items if in_week(i.created_at)]
    planned = [i for i in items if in_week(i.planned_at)]
    planned_done = [i for i in planned if i.status == "done"]

    days = [{"date": (start_local + timedelta(days=k)).isoformat(), "done": 0, "minutes": 0} for k in range(7)]
    for item in done:
        k = day_index(item.done_at)
        if 0 <= k < 7:
            days[k]["done"] += 1
            days[k]["minutes"] += item.estimated_minutes or 0
    best_day = max(days, key=lambda d: d["done"]) if any(d["done"] for d in days) else None

    often_postponed = sorted(
        [i for i in items if i.status != "done" and (i.postpone_count or 0) >= 2],
        key=lambda i: -(i.postpone_count or 0),
    )[:3]

    return {
        "offset": offset,
        "week_start": start_local.isoformat(),
        "week_end": (start_local + timedelta(days=6)).isoformat(),
        "done_count": len(done),
        "prio_done_count": sum(1 for i in done if i.importance == "prioritaire"),
        "minutes_done": sum(i.estimated_minutes or 0 for i in done),
        "captured_count": len(captured),
        "postponed_count": _count_events(db, user, "postponed", week_start, week_end),
        "planned_count": len(planned),
        "planned_done_count": len(planned_done),
        "days": days,
        "best_day": best_day["date"] if best_day else None,
        "often_postponed": [item_dict(i) for i in often_postponed],
        "inbox_count": sum(1 for i in items if i.status == "inbox"),
        "parking_count": sum(1 for i in items if i.status == "parked"),
    }
