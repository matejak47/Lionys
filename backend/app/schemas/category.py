from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 1. Společný základ (to mají všichni)
class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None # Slug je volitelný, když ho nezadáš, vygenerujeme ho z názvu
    image_path: Optional[str] = None
    icon_path: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = 0

# 2. Co posíláš při VYTVOŘENÍ (POST)
class CategoryCreate(CategoryBase):
    pass 
    # Tady je 'name' povinné (dědí se z Base)

# 3. Co posíláš při ÚPRAVĚ (PATCH) - Všechno je volitelné
class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    image_path: Optional[str] = None
    icon_path: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None

# 4. Co vrací API zpátky (RESPONSE)
class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Důležité pro načtení z DB modelu