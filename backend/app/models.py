"""Modèles de données : utilisateurs, buckets et éléments (tâches / idées / notes)."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Heure courante UTC, naïve : toutes les dates sont stockées en UTC."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    interests: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    reminder_delay_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    ai_provider: Mapped[str] = mapped_column(String(32), default="openai", nullable=False)
    ai_key_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_tokens_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    buckets: Mapped[list["Bucket"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    items: Mapped[list["Item"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Bucket(Base):
    __tablename__ = "buckets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    emoji: Mapped[str] = mapped_column(String(16), default="📁", nullable=False)
    color: Mapped[str] = mapped_column(String(16), default="#6366F1", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="buckets")
    items: Mapped[list["Item"]] = relationship(back_populates="bucket", passive_deletes=True)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    type: Mapped[str] = mapped_column(String(16), default="task", nullable=False)  # task | idea | note
    importance: Mapped[str] = mapped_column(String(16), default="aucune", nullable=False)  # prioritaire | important | urgent | aucune
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="inbox", index=True, nullable=False)  # inbox | active | parked | done
    bucket_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("buckets.id", ondelete="SET NULL"), index=True, nullable=True)
    due_at: Mapped[date | None] = mapped_column(Date, nullable=True)  # échéance (jour)
    planned_at: Mapped[datetime | None] = mapped_column(DateTime, index=True, nullable=True)  # créneau planifié (UTC)
    planned_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    postpone_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    done_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    google_event_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="items")
    bucket: Mapped["Bucket | None"] = relationship(back_populates="items")


class ItemEvent(Base):
    """Journal des actions marquantes (reports, tâches terminées) pour les bilans hebdomadaires."""

    __tablename__ = "item_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    item_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("items.id", ondelete="SET NULL"), index=True, nullable=True)
    kind: Mapped[str] = mapped_column(String(16), index=True, nullable=False)  # postponed | done
    title: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    importance: Mapped[str] = mapped_column(String(16), default="aucune", nullable=False)
    minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True, nullable=False)
