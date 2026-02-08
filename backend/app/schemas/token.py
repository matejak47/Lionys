from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    force_password_change: Optional[bool] = False
    is_admin: Optional[bool] = False

class TokenData(BaseModel):
    email: str | None = None