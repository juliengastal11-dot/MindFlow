"""Schémas Pydantic des requêtes."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

Importance = Literal["prioritaire", "important", "urgent", "aucune"]
ItemType = Literal["task", "idea", "note"]
Status = Literal["inbox", "active", "parked", "done"]
Provider = Literal["openai", "gemini", "anthropic"]
TriageAction = Literal["planifier", "tache", "idee", "bucket", "note", "parking", "ignorer"]

IMPORTANCE_ORDER = ["prioritaire", "important", "urgent", "aucune"]
VALID_INTERESTS = {"entrepreneuriat", "marketing", "tech", "design", "ventes", "finance", "immobilier", "contenu", "bienetre"}


# ---- Auth ----------------------------------------------------------------

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(default="", max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


# ---- Items ---------------------------------------------------------------

class ItemBase(BaseModel):
    note: Optional[str] = Field(default=None, max_length=5000)
    type: Optional[ItemType] = None
    importance: Optional[Importance] = None
    estimated_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    status: Optional[Status] = None
    bucket_id: Optional[str] = None
    due_at: Optional[str] = None       # "AAAA-MM-JJ"
    planned_at: Optional[str] = None   # ISO 8601
    planned_end: Optional[str] = None  # ISO 8601
    clear_bucket: bool = False
    clear_planned: bool = False


class ItemCreate(ItemBase):
    title: str = Field(min_length=1, max_length=300)

    @field_validator("title")
    @classmethod
    def _title_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le titre est requis")
        return value


class ItemUpdate(ItemBase):
    title: Optional[str] = Field(default=None, max_length=300)

    @field_validator("title")
    @classmethod
    def _title_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Le titre est requis")
        return value


class TriageIn(BaseModel):
    action: TriageAction
    bucket_id: Optional[str] = None


class PostponeIn(BaseModel):
    planned_at: str
    planned_end: Optional[str] = None


# ---- Buckets -------------------------------------------------------------

class BucketCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    emoji: str = Field(default="📁", max_length=16)
    color: str = Field(default="#6366F1", max_length=16)

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le nom est requis")
        return value


class BucketUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    emoji: Optional[str] = Field(default=None, max_length=16)
    color: Optional[str] = Field(default=None, max_length=16)
    position: Optional[int] = Field(default=None, ge=0)


# ---- Réglages ------------------------------------------------------------

class SettingsIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    interests: Optional[list[str]] = None
    reminder_delay_minutes: Optional[int] = Field(default=None, ge=-1, le=1440)
    onboarded: Optional[bool] = None
    ai_provider: Optional[Provider] = None


class AiKeyIn(BaseModel):
    provider: Provider
    api_key: str = Field(min_length=8, max_length=512)


# ---- IA ------------------------------------------------------------------

class SuggestIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class OrganizeIn(BaseModel):
    item_ids: list[str] = Field(min_length=1, max_length=50)
