"""Dépendances FastAPI : utilisateur courant, fuseau horaire du client."""
from __future__ import annotations

from zoneinfo import ZoneInfo

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .security import decode_token
from .timeutil import get_zone

COOKIE_NAME = "mindflow_token"


def _extract_token(request: Request) -> str | None:
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        if token:
            return token
    return request.cookies.get(COOKIE_NAME)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée, reconnectez-vous")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Compte introuvable")
    return user


def get_timezone(request: Request) -> ZoneInfo:
    """Fuseau horaire envoyé par le front dans l'en-tête X-Timezone (UTC sinon)."""
    return get_zone(request.headers.get("x-timezone") or request.query_params.get("tz"))
