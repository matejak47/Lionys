# app/api/v1/users.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_admin
from app.crud import crud_user
from app.schemas.user import UserCreateByAdmin, UserCreateResponse, UserResponse
from app.services.audit import log_activity
from app.models.user import User

router = APIRouter()

# ---- pomocné schéma pro změnu aktivace ----
class UserActiveUpdate(BaseModel):
    is_active: bool

# ---- pomocné schéma pro změnu role ----
class UserRoleUpdate(BaseModel):
    is_admin: bool


# --- Endpoint pro Vytvoření Uživatele (ADMIN) ---
@router.post("/", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin_endpoint(
    user_in: UserCreateByAdmin,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # 1. Kontrola existence emailu
    existing = await crud_user.get_user_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email již existuje v systému.")

    # 2. Vytvoření uživatele (s generováním hesla)
    new_user, temp_password = await crud_user.create_user_by_admin(db, user_in)

    # 3. Logování
    await log_activity(
        db,
        action="USER_ADD_BY_ADMIN",
        user_id=admin.id,
        details=f"Admin {admin.email} vytvořil uživatele: {new_user.email} s vynucenou změnou hesla."
    )

    # 4. Vrácení odpovědi (zahrnuje dočasné heslo)
    return {
        "id": new_user.id,
        "email": new_user.email,
        "is_active": new_user.is_active,
        "is_admin": new_user.is_admin,
        "created_at": new_user.created_at,
        "temp_password": temp_password,
    }


# --- ZOBRAZIT VŠECHNY UŽIVATELE (ADMIN) ---
@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    users = await crud_user.get_all_users(db)
    return users


# --- ZMĚNA AKTIVNOSTI UŽIVATELE (ADMIN) ---
@router.patch("/{user_id}/active", response_model=UserResponse)
async def set_user_active_endpoint(
    user_id: int,
    body: UserActiveUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # ❌ Nesmíš deaktivovat vlastní účet
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Nemůžete deaktivovat svůj vlastní účet."
        )

    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen.")

    updated = await crud_user.set_user_active(db, user, body.is_active)

    # Logování
    action = "USER_ACTIVATED" if body.is_active else "USER_DEACTIVATED"
    await log_activity(
        db,
        action=action,
        user_id=admin.id,
        details=f"Admin {admin.email} změnil stav uživatele {user.email} na {'aktivní' if body.is_active else 'neaktivní'}."
    )

    return updated


# --- ZMĚNA ROLE UŽIVATELE (ADMIN) ---
@router.patch("/{user_id}/role", response_model=UserResponse)
async def set_user_role_endpoint(
    user_id: int,
    body: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # zabráníme odebrání admina sám sobě
    if user_id == admin.id and body.is_admin is False:
        raise HTTPException(
            status_code=400,
            detail="Nemůžete si odebrat vlastní administrátorská oprávnění."
        )

    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen.")

    updated = await crud_user.set_user_role(db, user, body.is_admin)

    # 🔍 Logování změny role
    await log_activity(
        db,
        action="USER_ROLE_CHANGED",
        user_id=admin.id,
        details=(
            f"Admin {admin.email} změnil roli uživatele {user.email} "
            f"na {'Admin' if body.is_admin else 'Uživatel'}."
        ),
    )

    return updated