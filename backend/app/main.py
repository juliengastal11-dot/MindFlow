"""Point d'entrée FastAPI : API sous /api, et front (build Vite) servi en production."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import models  # noqa: F401 - enregistre les tables
from .config import settings
from .db import Base, engine
from .routers import ai, auth, buckets, calendar, items, user_settings, views
from .seed import seed_demo

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("mindflow")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.SEED_DEMO:
        seed_demo()
    log.info("MindFlow Business API prête (base : %s)", settings.DATABASE_URL)
    yield


app = FastAPI(
    title="MindFlow Business API",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Messages de validation en français ------------------------------------

FIELD_LABELS = {
    "password": "mot de passe",
    "email": "email",
    "title": "titre",
    "name": "nom",
    "text": "texte",
    "api_key": "clé API",
    "item_ids": "éléments",
}


def _french_error(error: dict) -> str:
    loc = [str(part) for part in error.get("loc", []) if part not in ("body", "query", "path")]
    field = loc[-1] if loc else ""
    label = FIELD_LABELS.get(field, field or "champ")
    kind = error.get("type", "")
    ctx = error.get("ctx") or {}
    if field == "email" or "email" in kind:
        return "Adresse email invalide"
    if kind == "missing":
        return f"Le champ « {label} » est requis"
    if kind == "string_too_short":
        minimum = ctx.get("min_length")
        if field == "password":
            return f"Le mot de passe doit contenir au moins {minimum} caractères"
        return f"Le champ « {label} » est trop court" + (f" ({minimum} caractères minimum)" if minimum else "")
    if kind == "string_too_long":
        maximum = ctx.get("max_length")
        return f"Le champ « {label} » est trop long" + (f" ({maximum} caractères maximum)" if maximum else "")
    if kind in ("literal_error", "enum"):
        return f"Valeur invalide pour « {label} »"
    if kind.startswith("int_") or kind.startswith("greater_than") or kind.startswith("less_than"):
        return f"Valeur numérique invalide pour « {label} »"
    if kind == "value_error":
        return str(error.get("msg", "")).replace("Value error, ", "")
    return f"{label} : {error.get('msg', 'valeur invalide')}"


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    messages = []
    for error in exc.errors():
        message = _french_error(error)
        if message not in messages:
            messages.append(message)
    return JSONResponse(status_code=422, content={"detail": " · ".join(messages) or "Données invalides"})


# ---- API -------------------------------------------------------------------

api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(items.router)
api.include_router(buckets.router)
api.include_router(views.router)
api.include_router(user_settings.router)
api.include_router(calendar.router)
api.include_router(ai.router)


@api.get("")
def api_root():
    return {"message": "MindFlow Business API"}


@api.get("/health")
def health():
    return {"status": "ok", "google_calendar": settings.google_available}


app.include_router(api)


# ---- Front (build Vite) servi par le backend en production -----------------

dist: Path = settings.FRONTEND_DIST
if dist.is_dir() and (dist / "index.html").is_file():
    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        dist_root = dist.resolve()
        candidate = (dist_root / full_path).resolve() if full_path else None
        if candidate and candidate.is_file() and str(candidate).startswith(str(dist_root)):
            return FileResponse(candidate)
        return FileResponse(dist_root / "index.html")

    log.info("Front servi depuis %s", dist)
