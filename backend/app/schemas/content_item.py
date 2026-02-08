from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ContentPhotoResponse(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str] = None
    position: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ContentItemBase(BaseModel):
    category_id: Optional[int] = None   # <--- FIX!!!
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[Decimal] = None
    is_published: Optional[bool] = False
    position: Optional[float] = 0.0

class ContentItemCreate(ContentItemBase):
    pass

class ContentItemUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[Decimal] = None
    is_published: Optional[bool] = None
    position: Optional[float] = None

class ContentItemResponse(ContentItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = { Decimal: float }
