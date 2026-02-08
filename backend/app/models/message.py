from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.session import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=True)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)

    is_read = Column(Boolean, nullable=False, server_default="false", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
