"""Synchronisation Google Calendar (OAuth 2.0 + API Events), sans dépendance Google."""
from __future__ import annotations

import json
import logging
import time
from urllib.parse import urlencode

import httpx

from ..config import settings
from ..db import SessionLocal
from ..models import Item, User
from ..security import create_token, decrypt, encrypt
from ..timeutil import iso_utc

log = logging.getLogger("mindflow.gcal")

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
REVOKE_URL = "https://oauth2.googleapis.com/revoke"
EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
SCOPE = "https://www.googleapis.com/auth/calendar.events"
TIMEOUT = 20.0

TYPE_EMOJI = {"task": "✅", "idea": "💡", "note": "📝"}
IMPORTANCE_EMOJI = {"prioritaire": "🔴", "important": "🟠", "urgent": "🟡"}


def available() -> bool:
    return settings.google_available


# ---- OAuth ---------------------------------------------------------------

def build_authorization_url(user_id: str) -> str:
    state = create_token(user_id, purpose="gcal", minutes=15)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    response = httpx.post(
        TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return {
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token"),
        "expires_at": time.time() + float(data.get("expires_in", 3600)) - 60,
    }


def load_tokens(user: User) -> dict | None:
    raw = decrypt(user.google_tokens_encrypted)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except ValueError:
        return None


def save_tokens(user: User, tokens: dict) -> None:
    user.google_tokens_encrypted = encrypt(json.dumps(tokens))


def revoke(user: User) -> None:
    """Révocation « best effort » côté Google ; n'échoue jamais."""
    tokens = load_tokens(user)
    if not tokens:
        return
    for key in ("refresh_token", "access_token"):
        token = tokens.get(key)
        if not token:
            continue
        try:
            httpx.post(REVOKE_URL, params={"token": token}, timeout=TIMEOUT)
            break
        except httpx.HTTPError:
            continue


def _access_token(db, user: User) -> str | None:
    tokens = load_tokens(user)
    if not tokens:
        return None
    if tokens.get("access_token") and time.time() < float(tokens.get("expires_at", 0)):
        return tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        return None
    response = httpx.post(
        TOKEN_URL,
        data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=TIMEOUT,
    )
    if response.status_code != 200:
        log.warning("Rafraîchissement du jeton Google impossible (%s) : %s", response.status_code, response.text[:200])
        return None
    data = response.json()
    tokens["access_token"] = data["access_token"]
    tokens["expires_at"] = time.time() + float(data.get("expires_in", 3600)) - 60
    save_tokens(user, tokens)
    db.commit()
    return tokens["access_token"]


# ---- Événements ----------------------------------------------------------

def _event_body(item: Item) -> dict:
    prefix = "✅ " if item.status == "done" else ""
    marker = IMPORTANCE_EMOJI.get(item.importance or "", "")
    type_emoji = TYPE_EMOJI.get(item.type or "task", "✅")
    summary = f"{prefix}{marker + ' ' if marker else ''}{type_emoji} {item.title}".strip()
    description = (item.note or "").strip()
    description = f"{description}\n\n— Créé avec MindFlow Business" if description else "— Créé avec MindFlow Business"
    return {
        "summary": summary,
        "description": description,
        "start": {"dateTime": iso_utc(item.planned_at)},
        "end": {"dateTime": iso_utc(item.planned_end)},
        "extendedProperties": {"private": {"mindflow_item_id": item.id}},
    }


def _delete_event(headers: dict, event_id: str) -> None:
    response = httpx.delete(f"{EVENTS_URL}/{event_id}", headers=headers, timeout=TIMEOUT)
    if response.status_code >= 400 and response.status_code not in (404, 410):
        log.warning("Suppression de l'événement Google %s impossible (%s)", event_id, response.status_code)


def sync_item_task(user_id: str, item_id: str) -> None:
    """Tâche de fond : crée, met à jour ou supprime l'événement Google d'un élément."""
    if not available():
        return
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user is None or not user.google_tokens_encrypted:
            return
        item = db.get(Item, item_id)
        token = _access_token(db, user)
        if not token:
            return
        headers = {"Authorization": f"Bearer {token}"}

        # Élément supprimé ou déplanifié : on retire l'événement
        if item is None or item.planned_at is None or item.planned_end is None:
            if item is not None and item.google_event_id:
                _delete_event(headers, item.google_event_id)
                item.google_event_id = None
                db.commit()
            return

        body = _event_body(item)
        if item.google_event_id:
            response = httpx.patch(f"{EVENTS_URL}/{item.google_event_id}", json=body, headers=headers, timeout=TIMEOUT)
            if response.status_code < 400:
                return
            if response.status_code not in (404, 410):
                log.warning("Mise à jour de l'événement Google impossible (%s) : %s", response.status_code, response.text[:200])
                return
            item.google_event_id = None  # l'événement a été supprimé côté Google : on le recrée

        response = httpx.post(EVENTS_URL, json=body, headers=headers, timeout=TIMEOUT)
        if response.status_code < 400:
            item.google_event_id = response.json().get("id")
            db.commit()
        else:
            log.warning("Création de l'événement Google impossible (%s) : %s", response.status_code, response.text[:200])
    except Exception:  # noqa: BLE001 - une tâche de fond ne doit jamais faire échouer la requête
        log.exception("Synchronisation Google Calendar échouée")
    finally:
        db.close()


def delete_event_task(user_id: str, event_id: str) -> None:
    if not available() or not event_id:
        return
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        if user is None or not user.google_tokens_encrypted:
            return
        token = _access_token(db, user)
        if token:
            _delete_event({"Authorization": f"Bearer {token}"}, event_id)
    except Exception:  # noqa: BLE001
        log.exception("Suppression d'un événement Google Calendar échouée")
    finally:
        db.close()


def sync_all_task(user_id: str) -> None:
    """Après connexion : pousse tous les éléments planifiés non terminés."""
    db = SessionLocal()
    try:
        from sqlalchemy import select

        item_ids = db.scalars(
            select(Item.id).where(Item.user_id == user_id, Item.planned_at.is_not(None), Item.status != "done")
        ).all()
    finally:
        db.close()
    for item_id in item_ids:
        sync_item_task(user_id, item_id)
