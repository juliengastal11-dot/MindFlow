"""Compte de démonstration (demo@mindflow.app / demo1234) avec des données d'exemple."""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select

from .db import SessionLocal
from .models import Item, User, utcnow
from .security import hash_password
from .services.buckets import create_default_buckets
from .timeutil import to_utc_naive

log = logging.getLogger("mindflow.seed")

DEMO_EMAIL = "demo@mindflow.app"
DEMO_PASSWORD = "demo1234"
DEMO_TZ = ZoneInfo("Europe/Paris")


def seed_demo() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.email == DEMO_EMAIL)):
            return

        user = User(
            email=DEMO_EMAIL,
            name="Démo",
            password_hash=hash_password(DEMO_PASSWORD),
            onboarded=True,
            interests=["entrepreneuriat", "marketing", "tech"],
            reminder_delay_minutes=15,
        )
        db.add(user)
        db.flush()
        buckets = create_default_buckets(db, user)
        someday = next(b for b in buckets if b.name == "À faire un jour")
        ideas = next(b for b in buckets if b.name == "Idées")

        today: date = datetime.now(DEMO_TZ).date()

        def at(hour: int, minute: int = 0, day: date = today) -> datetime:
            return to_utc_naive(datetime(day.year, day.month, day.day, hour, minute, tzinfo=DEMO_TZ))

        now = utcnow()
        items = [
            # Aujourd'hui
            Item(title="Envoyer le devis à Paul", importance="prioritaire", estimated_minutes=15, status="active",
                 planned_at=at(10), planned_end=at(10, 15), due_at=today),
            Item(title="Appeler le client Dupont", importance="prioritaire", estimated_minutes=15, status="active",
                 planned_at=at(11), planned_end=at(11, 15)),
            Item(title="Travailler sur l'app", importance="important", estimated_minutes=45, status="active",
                 planned_at=at(14), planned_end=at(14, 45), note="Avancer sur l'écran Planning."),
            Item(title="Répondre à Paul", importance="urgent", estimated_minutes=5, status="active",
                 planned_at=at(16), planned_end=at(16, 5)),
            Item(title="Valider le document", importance="urgent", estimated_minutes=15, status="active",
                 planned_at=at(16, 30), planned_end=at(16, 45)),
            # Plus tard dans la semaine
            Item(title="Préparer la présentation", importance="important", estimated_minutes=60, status="active",
                 planned_at=at(14, day=today + timedelta(days=2)), planned_end=at(15, day=today + timedelta(days=2)),
                 due_at=today + timedelta(days=4)),
            # Inbox à trier
            Item(title="Appeler le comptable", status="inbox"),
            Item(title="Idée pour l'app : dictée vocale", status="inbox"),
            Item(title="Acheter une imprimante", status="inbox"),
            # Parking et buckets
            Item(title="Créer une version mobile du site", type="idea", status="parked"),
            Item(title="Aller à Lisbonne", type="idea", status="active", bucket_id=someday.id),
            Item(title="Application de recettes", type="idea", status="active", bucket_id=ideas.id),
            # En retard / souvent reportés
            Item(title="Mettre à jour le site", importance="important", estimated_minutes=120, status="active",
                 postpone_count=4, planned_at=at(9, day=today - timedelta(days=1)), planned_end=at(11, day=today - timedelta(days=1))),
            Item(title="Faire les comptes", importance="important", estimated_minutes=60, status="active",
                 postpone_count=3, due_at=today - timedelta(days=2)),
            # Terminés cette semaine
            Item(title="Publier le post LinkedIn", importance="urgent", estimated_minutes=15, status="done",
                 done_at=now - timedelta(hours=26), planned_at=at(9, day=today - timedelta(days=1)),
                 planned_end=at(9, 15, day=today - timedelta(days=1))),
            Item(title="Relancer les factures impayées", importance="prioritaire", estimated_minutes=30, status="done",
                 done_at=now - timedelta(hours=2)),
        ]
        for item in items:
            item.user_id = user.id
            db.add(item)
        db.commit()
        log.info("Compte démo créé : %s / %s", DEMO_EMAIL, DEMO_PASSWORD)
    except Exception:  # noqa: BLE001
        db.rollback()
        log.exception("Création du compte démo impossible")
    finally:
        db.close()
