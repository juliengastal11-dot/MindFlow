"""Configuration du backend (variables d'environnement + valeurs par défaut).

En production, la plupart des valeurs se déduisent toutes seules : sur Railway, le domaine public
(`RAILWAY_PUBLIC_DOMAIN`) donne FRONTEND_URL ; derrière HTTPS les cookies passent en « secure »,
le compte démo n'est pas créé et l'URL de retour Google Calendar est calculée depuis FRONTEND_URL.
"""
from __future__ import annotations

import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(BASE_DIR / ".env")

log = logging.getLogger("mindflow.config")


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else default


def _env_bool(name: str, default: bool) -> bool:
    value = _env(name)
    if not value:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: str) -> list[str]:
    return [part.strip() for part in _env(name, default).split(",") if part.strip()]


def _secret_key() -> str:
    value = _env("SECRET_KEY")
    if value:
        return value
    key_file = DATA_DIR / ".secret_key"
    if key_file.exists():
        stored = key_file.read_text(encoding="utf-8").strip()
        if stored:
            return stored
    generated = secrets.token_urlsafe(48)
    key_file.write_text(generated, encoding="utf-8")
    log.warning("SECRET_KEY absent du .env : une clé a été générée dans %s", key_file)
    return generated


def _frontend_url() -> str:
    explicit = _env("FRONTEND_URL").rstrip("/")
    if explicit:
        return explicit
    railway_domain = _env("RAILWAY_PUBLIC_DOMAIN")  # injecté automatiquement par Railway
    if railway_domain:
        return f"https://{railway_domain}"
    return "http://localhost:3000"


_FRONTEND_URL = _frontend_url()
_IS_LOCAL = _FRONTEND_URL.startswith(("http://localhost", "http://127.0.0.1"))


class Settings:
    SECRET_KEY: str = _secret_key()
    DATABASE_URL: str = _env("DATABASE_URL") or f"sqlite:///{(DATA_DIR / 'mindflow.db').as_posix()}"
    CORS_ORIGINS: list[str] = _env_list("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    FRONTEND_URL: str = _FRONTEND_URL
    IS_LOCAL: bool = _IS_LOCAL
    COOKIE_SECURE: bool = _env_bool("COOKIE_SECURE", _FRONTEND_URL.startswith("https://"))
    TOKEN_DAYS: int = int(_env("TOKEN_DAYS", "30"))

    GOOGLE_CLIENT_ID: str = _env("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = _env("GOOGLE_CLIENT_SECRET")
    # En local le backend (port 8000) reçoit le retour OAuth ; en production front et API partagent l'origine
    GOOGLE_REDIRECT_URI: str = _env("GOOGLE_REDIRECT_URI") or (
        "http://localhost:8000/api/oauth/calendar/callback" if _IS_LOCAL else f"{_FRONTEND_URL}/api/oauth/calendar/callback"
    )

    ANTHROPIC_API_KEY: str = _env("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = _env("ANTHROPIC_MODEL", "claude-opus-5")
    OPENAI_MODEL: str = _env("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_MODEL: str = _env("GEMINI_MODEL", "gemini-2.5-flash")

    SEED_DEMO: bool = _env_bool("SEED_DEMO", _IS_LOCAL)  # compte démo seulement en local par défaut
    FRONTEND_DIST: Path = Path(_env("FRONTEND_DIST") or (BASE_DIR.parent / "frontend" / "dist"))

    @property
    def google_available(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)


settings = Settings()
