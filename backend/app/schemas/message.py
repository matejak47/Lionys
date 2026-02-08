from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    subject: Optional[str] = None
    body: str

class MessageResponse(BaseModel):
    id: int
    name: Optional[str]
    email: str
    subject: Optional[str]
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
