"""Routes IA : suggestion pour un titre, organisation d'un lot d'éléments de l'inbox."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Item, User
from ..schemas import OrganizeIn, SuggestIn
from ..services import ai

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/suggest")
def suggest(body: SuggestIn, user: User = Depends(get_current_user)):
    try:
        suggestion, source = ai.suggest_one(user, body.text)
    except ai.AiError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message)
    return {**suggestion.as_dict(), "source": source}


@router.post("/organize")
def organize(body: OrganizeIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.scalars(select(Item).where(Item.user_id == user.id, Item.id.in_(body.item_ids))).all()
    by_id = {item.id: item for item in items}
    entries = [ai.Entry(id=item_id, title=by_id[item_id].title, note=by_id[item_id].note or "") for item_id in body.item_ids if item_id in by_id]
    if not entries:
        raise HTTPException(status_code=404, detail="Aucun élément trouvé")
    try:
        suggestions, source = ai.organize(user, entries)
    except ai.AiError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message)
    return {"suggestions": [s.as_dict() for s in suggestions], "source": source}
