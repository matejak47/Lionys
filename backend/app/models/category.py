from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    
    # Hlavní údaje
    name = Column(String, nullable=False, index=True) # Např. "Kadeřnictví"
    slug = Column(String, unique=True, index=True, nullable=False) # Např. "kadernictvi"
    
    # Média (ukládáme jen cestu k souboru, ne obrázek samotný)
    image_path = Column(String, nullable=True) # Velká fotka
    icon_path = Column(String, nullable=True)  # Malá ikonka/SVG
    
    # Detaily
    description = Column(Text, nullable=True)
    position = Column(Integer, default=0) # Pro vlastní řazení (0, 1, 2...)
    
    # Časová razítka
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())