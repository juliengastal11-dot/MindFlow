"""Réglages du compte : profil, centres d'intérêt, rappels, clé IA."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import VALID_INTERESTS, AiKeyIn, SettingsIn
from ..security import encrypt
from ..serializers import user_dict

router = APIRouter(prefix="/settings", tags=["settings"])


@router.patch("")
def update_settings(body: SettingsIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)

    if data.get("name") is not None:
        user.name = data["name"].strip()[:120]

    if data.get("interests") is not None:
        interests = []
        for key in data["interests"]:
            if key in VALID_INTERESTS and key not in interests:
                interests.append(key)
        if len(interests) > 3:
            raise HTTPException(status_code=422, detail="3 centres d'intérêt maximum")
        user.interests = interests

    if data.get("reminder_delay_minutes") is not None:
        user.reminder_delay_minutes = int(data["reminder_delay_minutes"])

    if data.get("onboarded") is not None:
        user.onboarded = bool(data["onboarded"])

    if data.get("ai_provider"):
        user.ai_provider = data["ai_provider"]

    db.commit()
    return user_dict(user)


@router.post("/ai-key")
def set_ai_key(body: AiKeyIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.ai_provider = body.provider
    user.ai_key_encrypted = encrypt(body.api_key.strip())
    db.commit()
    return user_dict(user)


@router.delete("/ai-key")
def delete_ai_key(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.ai_key_encrypted = None
    db.commit()
    return user_dict(user)
