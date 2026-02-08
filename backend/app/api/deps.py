# app/api/deps.py

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.db.session import SessionLocal
from app.crud import crud_user
from app.models.user import User

# --- 1. DATABÁZE ---
async def get_db():
    """
    Vytvoří a uvolní AsyncSession pro každý request.
    """
    async with SessionLocal() as session:
        yield session


# --- 2. SWAGGER / SECURITY ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- 3. AKTUÁLNÍ UŽIVATEL Z TOKENU ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Načte aktuálně přihlášeného uživatele z JWT tokenu.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nemáš platné přihlášení (neplatný token)",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            security.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await crud_user.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception

    # pokud chceš, můžeš tady nechat refresh pro jistotu:
    # await db.refresh(user)

    return user


# --- 4. AKTUÁLNÍ ADMIN ---
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Zkontroluje, jestli je přihlášený uživatel administrátor.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemáte oprávnění administrátora k provedení této akce.",
        )
    return current_user
