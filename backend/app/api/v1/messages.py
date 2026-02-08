from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_admin
from app.schemas.message import MessageCreate, MessageResponse
from app.crud.crud_message import crud_message
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    body: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    return await crud_message.create(db, body.model_dump())

@router.get("/", response_model=List[MessageResponse])
async def list_messages(
    unread: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await crud_message.list(db, only_unread=unread, limit=limit, offset=offset)

@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    msg = await crud_message.get(db, message_id)
    if not msg:
        raise HTTPException(404, "Zpráva nenalezena.")
    return msg

@router.patch("/{message_id}/read", status_code=204)
async def set_read(
    message_id: int,
    is_read: bool,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    msg = await crud_message.get(db, message_id)
    if not msg:
        raise HTTPException(404, "Zpráva nenalezena.")
    await crud_message.mark_read(db, message_id, is_read)
    return
