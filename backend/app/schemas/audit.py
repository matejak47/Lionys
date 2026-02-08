from pydantic import BaseModel
from datetime import datetime

class AuditLogOut(BaseModel):
    id: int
    action: str
    details: str | None
    user_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True