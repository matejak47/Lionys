from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from datetime import datetime, timedelta
from sqlalchemy import delete
from app.core.config import settings

async def log_activity(db: AsyncSession, action: str, details: str = None, user_id: int = None):
    """
    Jednoduchá funkce pro zápis do audit logu.
    """
    try:
        log_entry = AuditLog(
            action=action,
            details=details,
            user_id=user_id
        )
        db.add(log_entry)
        await db.commit() # Uložíme to hned
    except Exception as e:
        print(f"Chyba při logování: {e}") 
        # Logování nesmí shodit aplikaci, proto try/except

async def delete_old_logs(db: AsyncSession, days: int = settings.LOG_RETENTION_DAYS):
    """
    Smaže logy starší než X dní.
    Vrací počet smazaných řádků.
    """
    # Spočítáme datum "před X dny"
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Sestavíme příkaz DELETE
    query = delete(AuditLog).where(AuditLog.created_at < cutoff_date)
    
    # Provedeme to
    result = await db.execute(query)
    await db.commit()
    
    return result.rowcount