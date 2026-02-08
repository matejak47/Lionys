from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from app.models.message import Message

class CRUDMessage:
    async def create(self, db: AsyncSession, data: dict) -> Message:
        msg = Message(**data)
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    async def list(self, db: AsyncSession, only_unread: bool | None = None, limit: int = 50, offset: int = 0):
        q = select(Message).order_by(desc(Message.created_at)).limit(limit).offset(offset)
        if only_unread is True:
            q = q.where(Message.is_read == False)  # noqa: E712
        res = await db.execute(q)
        return res.scalars().all()

    async def get(self, db: AsyncSession, message_id: int):
        res = await db.execute(select(Message).where(Message.id == message_id))
        return res.scalar_one_or_none()

    async def mark_read(self, db: AsyncSession, message_id: int, is_read: bool):
        await db.execute(
            update(Message).where(Message.id == message_id).values(is_read=is_read)
        )
        await db.commit()

crud_message = CRUDMessage()
