from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from pydantic import BaseModel, Field

# Základní model – jen email, nic víc
class UserBase(BaseModel):
    email: EmailStr


# Model pro registraci – email + password
class UserCreate(UserBase):
    password: str


# Model pro odpověď – email + id + is_active
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool 
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
class PasswordChange(BaseModel):
    """Schema pro příjem starého a nového hesla."""
    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=1)

class UserCreateByAdmin(BaseModel):
    """Data pro vytvoření uživatele adminem."""
    email: EmailStr
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False
    # Heslo se generuje automaticky na backendu.

class UserCreateResponse(UserResponse):
    """Odpověď po vytvoření adminem, obsahuje dočasné heslo."""
    temp_password: str # Zobrazíme adminovi, aby ho mohl předat dál