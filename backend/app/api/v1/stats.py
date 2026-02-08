import os
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.message import Message
from app.schemas.stats import StatsResponse
from app.services.system_info import get_folder_size, get_disk_usage
from app.crud.crud_content_item import get_published_content_count

router = APIRouter()

UPLOAD_DIR = "uploads"
APP_PATH_FOR_SIZE = "."

@router.get("/", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users_count = await db.scalar(select(func.count(User.id)))

    content_count = await get_published_content_count(db)

    messages_count = await db.scalar(
        select(func.count(Message.id)).where(Message.is_read == False)  # noqa: E712
    )

    total_disk, used_disk, free_disk = get_disk_usage(UPLOAD_DIR)
    uploads_size = get_folder_size(UPLOAD_DIR)
    app_size = get_folder_size(APP_PATH_FOR_SIZE)

    return {
        "system_version": "1.0.0",
        "database_status": "online",
        "counts": {
            "users": users_count,
            "content_items": content_count,
            "messages": messages_count
        },
        "storage": {
            "total_disk_size": total_disk,
            "used_disk_size": used_disk,
            "free_disk_size": free_disk,
            "app_folder_size": app_size,
            "uploads_folder_size": uploads_size
        }
    }
