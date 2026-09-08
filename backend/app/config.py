"""Configuration du backend (variables d'environnement + valeurs par défaut)."""
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


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: str) -> list[str]:
    raw = os.getenv(name) or default
    return [part.strip() for part in raw.split(",") if part.strip()]


def _secret_key() -> str:
    value = os.getenv("SECRET_KEY", "").strip()
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


class Settings:
    SECRET_KEY: str = _secret_key()
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip() or f"sqlite:///{(DATA_DIR / 'mindflow.db').as_posix()}"
    CORS_ORIGINS: list[str] = _env_list("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    COOKIE_SECURE: bool = _env_bool("COOKIE_SECURE", False)
    TOKEN_DAYS: int = int(os.getenv("TOKEN_DAYS") or 30)

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/oauth/calendar/callback").strip()

    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "").strip() or "claude-opus-5"
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "").strip() or "gpt-4o-mini"
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "").strip() or "gemini-2.5-flash"

    SEED_DEMO: bool = _env_bool("SEED_DEMO", True)
    FRONTEND_DIST: Path = Path(os.getenv("FRONTEND_DIST", "").strip() or (BASE_DIR.parent / "frontend" / "dist"))

    @property
    def google_available(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)


settings = Settings()
