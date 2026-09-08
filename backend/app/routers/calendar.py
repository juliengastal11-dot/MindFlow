"""Connexion / déconnexion Google Calendar (OAuth 2.0)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import update
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..models import Item, User
from ..security import decode_token
from ..services import gcal

log = logging.getLogger("mindflow.calendar")
router = APIRouter(prefix="/oauth/calendar", tags=["calendar"])


def _settings_redirect(status: str) -> RedirectResponse:
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/app/parametres?calendar={status}", status_code=302)


@router.get("/connect")
def connect(user: User = Depends(get_current_user)):
    if not gcal.available():
        raise HTTPException(
            status_code=400,
            detail="Google Calendar n'est pas configuré sur le serveur (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
        )
    return {"authorization_url": gcal.build_authorization_url(user.id)}


@router.get("/callback")
def callback(
    background: BackgroundTasks,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error or not code or not state:
        return _settings_redirect("error")
    user_id = decode_token(state, purpose="gcal")
    user = db.get(User, user_id) if user_id else None
    if user is None:
        return _settings_redirect("error")
    try:
        tokens = gcal.exchange_code(code)
    except Exception:  # noqa: BLE001
        log.exception("Échange du code OAuth Google impossible")
        return _settings_redirect("error")
    gcal.save_tokens(user, tokens)
    db.commit()
    background.add_task(gcal.sync_all_task, user.id)
    return _settings_redirect("connected")


@router.post("/disconnect")
def disconnect(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    gcal.revoke(user)
    user.google_tokens_encrypted = None
    db.execute(update(Item).where(Item.user_id == user.id).values(google_event_id=None))
    db.commit()
    return {"ok": True}
