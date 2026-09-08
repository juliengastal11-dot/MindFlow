"""Buckets : espaces personnels (projets, idées, envies, listes)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Bucket, Item, User
from ..schemas import BucketCreate, BucketUpdate
from ..serializers import bucket_dict

router = APIRouter(prefix="/buckets", tags=["buckets"])


def get_bucket_or_404(db: Session, user: User, bucket_id: str) -> Bucket:
    bucket = db.get(Bucket, bucket_id)
    if bucket is None or bucket.user_id != user.id:
        raise HTTPException(status_code=404, detail="Bucket introuvable")
    return bucket


@router.get("")
def list_buckets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    buckets = db.scalars(
        select(Bucket).where(Bucket.user_id == user.id).order_by(Bucket.position, Bucket.created_at)
    ).all()
    return [bucket_dict(b) for b in buckets]


@router.post("", status_code=201)
def create_bucket(body: BucketCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    max_position = db.scalar(select(func.max(Bucket.position)).where(Bucket.user_id == user.id))
    bucket = Bucket(
        user_id=user.id,
        name=body.name,
        emoji=body.emoji or "📁",
        color=body.color or "#6366F1",
        position=(max_position if max_position is not None else -1) + 1,
    )
    db.add(bucket)
    db.commit()
    db.refresh(bucket)
    return bucket_dict(bucket)


@router.patch("/{bucket_id}")
def update_bucket(bucket_id: str, body: BucketUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bucket = get_bucket_or_404(db, user, bucket_id)
    data = body.model_dump(exclude_unset=True)
    if data.get("name") is not None:
        bucket.name = data["name"].strip() or bucket.name
    if data.get("emoji") is not None:
        bucket.emoji = data["emoji"] or bucket.emoji
    if data.get("color") is not None:
        bucket.color = data["color"] or bucket.color
    if data.get("position") is not None:
        bucket.position = int(data["position"])
    db.commit()
    db.refresh(bucket)
    return bucket_dict(bucket)


@router.delete("/{bucket_id}")
def delete_bucket(bucket_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bucket = get_bucket_or_404(db, user, bucket_id)
    if bucket.is_default:
        raise HTTPException(status_code=400, detail="Ce bucket par défaut ne peut pas être supprimé")
    # Les éléments sont conservés, simplement détachés du bucket
    db.execute(update(Item).where(Item.bucket_id == bucket.id).values(bucket_id=None))
    db.delete(bucket)
    db.commit()
    return {"deleted": True, "id": bucket_id}
