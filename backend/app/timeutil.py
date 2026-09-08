"""Outils de dates : parsing ISO, conversion UTC, bornes de journée / semaine locales."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException

UTC = timezone.utc


def get_zone(name: str | None) -> ZoneInfo:
    """Fuseau horaire IANA (ex. Europe/Paris) ; UTC si absent ou inconnu."""
    if name:
        try:
            return ZoneInfo(name.strip())
        except (ZoneInfoNotFoundError, ValueError, KeyError):
            pass
    return ZoneInfo("UTC")


def parse_dt(value) -> datetime | None:
    """Chaîne ISO 8601 (avec ou sans fuseau) -> datetime UTC naïf."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        raw = str(value).strip()
        if raw.endswith("Z") or raw.endswith("z"):
            raw = raw[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(raw)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Date invalide : {value}")
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(UTC).replace(tzinfo=None)


def parse_date(value) -> date | None:
    """'AAAA-MM-JJ' (ou ISO complet) -> date."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raw = str(value).strip()[:10]
    try:
        return date.fromisoformat(raw)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Date invalide : {value}")


def to_utc_naive(local_dt: datetime) -> datetime:
    if local_dt.tzinfo is None:
        return local_dt
    return local_dt.astimezone(UTC).replace(tzinfo=None)


def local_today(tz: ZoneInfo) -> date:
    return datetime.now(tz).date()


def day_bounds_utc(tz: ZoneInfo, day: date | None = None) -> tuple[datetime, datetime]:
    """[début, fin) d'une journée locale, exprimés en UTC naïf."""
    d = day or local_today(tz)
    start = datetime(d.year, d.month, d.day, tzinfo=tz)
    return to_utc_naive(start), to_utc_naive(start + timedelta(days=1))


def week_start_utc(tz: ZoneInfo) -> datetime:
    """Lundi 00:00 (heure locale) de la semaine courante, en UTC naïf."""
    today = local_today(tz)
    monday = today - timedelta(days=today.weekday())
    return to_utc_naive(datetime(monday.year, monday.month, monday.day, tzinfo=tz))


def iso_utc(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")
