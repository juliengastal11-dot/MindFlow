"""Buckets par défaut créés à l'inscription."""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Bucket, User

DEFAULT_BUCKETS = [
    {"name": "À faire un jour", "emoji": "🏝️", "color": "#38BDF8"},
    {"name": "Idées", "emoji": "💡", "color": "#F59E0B"},
]


def create_default_buckets(db: Session, user: User) -> list[Bucket]:
    buckets = []
    for position, spec in enumerate(DEFAULT_BUCKETS):
        bucket = Bucket(user_id=user.id, is_default=True, position=position, **spec)
        db.add(bucket)
        buckets.append(bucket)
    db.flush()
    return buckets
