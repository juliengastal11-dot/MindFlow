"""Inscription, connexion, déconnexion, profil courant."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..deps import COOKIE_NAME, get_current_user
from ..models import User
from ..schemas import LoginIn, RegisterIn
from ..security import create_token, hash_password, verify_password
from ..serializers import user_dict
from ..services.buckets import create_default_buckets

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_response(user: User, response: Response) -> dict:
    token = create_token(user.id)
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.TOKEN_DAYS * 86400,
        path="/",
    )
    return {**user_dict(user), "access_token": token, "token_type": "bearer"}


@router.post("/register")
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if len(body.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Mot de passe trop long (72 caractères maximum)")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")
    user = User(
        email=email,
        name=(body.name or "").strip() or email.split("@")[0],
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.flush()
    create_default_buckets(db, user)
    db.commit()
    return _auth_response(user, response)


@router.post("/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    return _auth_response(user, response)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_dict(user)
