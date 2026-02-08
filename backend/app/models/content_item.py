from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    # --- ID a vazby ---
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)

    # --- Pozice (desetinné číslo) ---
    position = Column(Numeric(precision=10, scale=3), default=0.0)

    # --- Obsah ---
    title = Column(String(255), nullable=False)
    slug = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    image_url = Column(String(512), nullable=True)  # Primární náhled
    price = Column(Numeric(precision=10, scale=2), nullable=True)

    # --- Metadata ---
    is_published = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Galerie fotek – 1:N
    photos = relationship(
        "ContentPhoto",
        back_populates="content_item",
        cascade="all, delete-orphan",
        # DŮLEŽITÉ: musí být *ContentPhoto.position*, ne jen "position"
        order_by="ContentPhoto.position",
    )


class ContentPhoto(Base):
    __tablename__ = "content_photos"

    id = Column(Integer, primary_key=True, index=True)
    content_item_id = Column(
        Integer,
        ForeignKey("content_items.id"),
        nullable=False,
        index=True,
    )

    image_url = Column(String(512), nullable=False)
    alt_text = Column(String(255), nullable=True)
    position = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # zpětná vazba na ContentItem
    content_item = relationship("ContentItem", back_populates="photos")
