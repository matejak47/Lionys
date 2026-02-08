from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from sqlalchemy import desc
from datetime import date, datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogOut
from app.services.audit import delete_old_logs
from app.services.audit import log_activity
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[AuditLogOut])
async def read_logs(
    skip: int = 0,
    limit: int = 100,
    # --- NOVÉ FILTRY ---
    email: Optional[str] = None,       # Hledání podle emailu
    action: Optional[str] = None,      # Hledání podle akce (LOGIN, DELETE...)
    date_from: Optional[date] = None,  # Datum OD
    date_to: Optional[date] = None,    # Datum DO
    # -------------------
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Začneme základním dotazem: Chceme Logy a k nim informace o Userovi
    query = select(AuditLog).join(User).order_by(AuditLog.created_at.desc())

    # --- APLIKACE FILTRŮ ---
    
    # 1. Filtr podle emailu (obsahuje text, nezáleží na velikosti písmen)
    if email:
        query = query.where(User.email.ilike(f"%{email}%"))
    
    # 2. Filtr podle akce (přesná shoda)
    if action:
        query = query.where(AuditLog.action == action)

    # 3. Datum OD (větší nebo rovno)
    if date_from:
        query = query.where(AuditLog.created_at >= date_from)

    # 4. Datum DO (menší nebo rovno - přidáme čas 23:59:59, aby to vzalo celý den)
    if date_to:
        # Převedeme date na datetime na konci dne
        dt_to = datetime.combine(date_to, datetime.max.time())
        query = query.where(AuditLog.created_at <= dt_to)

    # Aplikujeme stránkování
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()
    return logs

@router.delete("/cleanup", response_model=dict)
async def cleanup_logs(
    # Změň defaultní hodnotu:
    days: int = settings.LOG_RETENTION_DAYS, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Smaže staré logy a vytvoří o tom záznam.
    """
    # 1. Provedeme smazání
    deleted_count = await delete_old_logs(db, days=days)
    
    # 2. ZALOGUJEME TO (Kdo to smazal a kolik toho bylo)
    # Tento nový záznam se nesmaže, protože je "teď" (není starý 365 dní)
    await log_activity(
        db,
        action="LOGS_CLEANUP",
        user_id=current_user.id,
        details=f"Manuální úklid logů. Smazáno {deleted_count} záznamů starších než {days} dní."
    )
    
    return {"message": f"Úklid hotov. Smazáno {deleted_count} starých záznamů."}