from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func  # <-- TOTO JE DŮLEŽITÉ (funkce pro čas)
from app.db.session import Base

class User(Base):
    __tablename__ = "app_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    force_password_change = Column(Boolean, default=False)
    
    # --- NOVÝ SLOUPEC ---
    # server_default=func.now() zajistí, že se tam čas zapíše sám při uložení
    created_at = Column(DateTime(timezone=True), server_default=func.now())