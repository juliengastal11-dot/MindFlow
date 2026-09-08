"""Mots de passe (bcrypt), jetons JWT et chiffrement symétrique (Fernet)."""
from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from cryptography.fernet import Fernet, InvalidToken

from .config import settings


# ---- Mots de passe -------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, TypeError):
        return False


# ---- Jetons --------------------------------------------------------------

def create_token(subject: str, purpose: str = "auth", minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    lifetime = timedelta(minutes=minutes) if minutes else timedelta(days=settings.TOKEN_DAYS)
    payload = {
        "sub": subject,
        "purpose": purpose,
        "iat": int(now.timestamp()),
        "exp": int((now + lifetime).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str, purpose: str = "auth") -> str | None:
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    if data.get("purpose", "auth") != purpose:
        return None
    subject = data.get("sub")
    return str(subject) if subject else None


# ---- Chiffrement (clés IA, jetons Google) ---------------------------------

_fernet = Fernet(base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()))


def encrypt(text: str) -> str:
    return _fernet.encrypt(text.encode("utf-8")).decode("ascii")


def decrypt(token: str | None) -> str | None:
    if not token:
        return None
    try:
        return _fernet.decrypt(token.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None
