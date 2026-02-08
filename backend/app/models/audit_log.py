from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, index=True)      # Např. "LOGIN", "DELETE_USER"
    details = Column(Text, nullable=True)    # Např. "Neúspěšný pokus o heslo"
    user_id = Column(Integer, ForeignKey("app_users.id"), nullable=True) # Kdo to udělal
    created_at = Column(DateTime(timezone=True), server_default=func.now())