"""Tests unitaires : dates et fuseaux, sécurité."""
from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest
from fastapi import HTTPException

from app.security import create_token, decode_token, decrypt, encrypt, hash_password, verify_password
from app.timeutil import UTC, day_bounds_utc, get_zone, iso_utc, parse_date, parse_dt, week_start_utc

PARIS = ZoneInfo("Europe/Paris")


def test_parse_dt():
    assert parse_dt("2026-09-08T12:00:00Z") == datetime(2026, 9, 8, 12)
    assert parse_dt("2026-09-08T12:00:00.000Z") == datetime(2026, 9, 8, 12)
    assert parse_dt("2026-09-08T12:00:00+02:00") == datetime(2026, 9, 8, 10)
    assert parse_dt("2026-09-08T12:00:00") == datetime(2026, 9, 8, 12)  # sans fuseau = UTC
    assert parse_dt(None) is None and parse_dt("") is None
    with pytest.raises(HTTPException):
        parse_dt("n'importe quoi")


def test_parse_date():
    assert parse_date("2026-09-12") == date(2026, 9, 12)
    assert parse_date("2026-09-12T10:00:00Z") == date(2026, 9, 12)
    assert parse_date(None) is None
    with pytest.raises(HTTPException):
        parse_date("12/09/2026")


def test_day_bounds_in_paris():
    start, end = day_bounds_utc(PARIS, date(2026, 9, 8))
    assert start == datetime(2026, 9, 7, 22) and end == datetime(2026, 9, 8, 22)
    start, end = day_bounds_utc(PARIS, date(2026, 1, 8))  # heure d'hiver
    assert start == datetime(2026, 1, 7, 23) and end == datetime(2026, 1, 8, 23)


def test_week_start_is_local_monday_midnight():
    local = week_start_utc(PARIS).replace(tzinfo=UTC).astimezone(PARIS)
    assert local.weekday() == 0 and (local.hour, local.minute) == (0, 0)


def test_iso_and_zone():
    assert iso_utc(datetime(2026, 9, 8, 12, 30)) == "2026-09-08T12:30:00Z"
    assert iso_utc(None) is None
    assert get_zone("Europe/Paris").key == "Europe/Paris"
    assert get_zone("Nulle/Part").key == "UTC"
    assert get_zone(None).key == "UTC"


def test_passwords():
    hashed = hash_password("secret123")
    assert hashed != "secret123"
    assert verify_password("secret123", hashed)
    assert not verify_password("autre", hashed)
    assert not verify_password("secret123", "pas-un-hash")


def test_tokens():
    token = create_token("user-1")
    assert decode_token(token) == "user-1"
    assert decode_token(token, purpose="gcal") is None  # usage différent refusé
    assert decode_token("n.importe.quoi") is None
    state = create_token("user-1", purpose="gcal", minutes=15)
    assert decode_token(state, purpose="gcal") == "user-1"


def test_encryption_roundtrip():
    assert decrypt(encrypt("sk-secret")) == "sk-secret"
    assert decrypt("pas-un-jeton") is None
    assert decrypt(None) is None
