"""Conversion des modèles en dictionnaires JSON (format attendu par le front)."""
from __future__ import annotations

from .config import settings
from .models import Bucket, Item, User
from .timeutil import iso_utc


def item_dict(item: Item) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "note": item.note or "",
        "type": item.type,
        "importance": item.importance or "aucune",
        "estimated_minutes": item.estimated_minutes or 0,
        "status": item.status,
        "bucket_id": item.bucket_id,
        "due_at": item.due_at.isoformat() if item.due_at else None,
        "planned_at": iso_utc(item.planned_at),
        "planned_end": iso_utc(item.planned_end),
        "postpone_count": item.postpone_count or 0,
        "done_at": iso_utc(item.done_at),
        "google_event_id": item.google_event_id,
        "created_at": iso_utc(item.created_at),
        "updated_at": iso_utc(item.updated_at),
    }


def bucket_dict(bucket: Bucket) -> dict:
    return {
        "id": bucket.id,
        "name": bucket.name,
        "emoji": bucket.emoji,
        "color": bucket.color,
        "is_default": bool(bucket.is_default),
        "position": bucket.position,
        "created_at": iso_utc(bucket.created_at),
    }


def user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "onboarded": bool(user.onboarded),
        "interests": list(user.interests or []),
        "reminder_delay_minutes": user.reminder_delay_minutes if user.reminder_delay_minutes is not None else 15,
        "ai_provider": user.ai_provider or "openai",
        "ai_key_set": bool(user.ai_key_encrypted),
        "google_calendar_available": settings.google_available,
        "google_calendar_connected": bool(user.google_tokens_encrypted),
        "created_at": iso_utc(user.created_at),
    }
