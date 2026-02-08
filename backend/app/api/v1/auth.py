from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

# Importujeme naši novou funkci pro logování
from app.services.audit import log_activity

from app.api.deps import get_db, get_current_user
from app.crud import crud_user
from app.core import security
from app.schemas.user import UserCreate, UserResponse, PasswordChange
from app.schemas.token import Token
from app.models.user import User


router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Kontrola existence
    user = await crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Vytvoření uživatele
    user = await crud_user.create_user(db, user_in)

    # Uložíme si ID a Email hned do proměnných (bezpečné)
    new_user_id = user.id
    new_user_email = user.email

    # --- LOGOVÁNÍ: NOVÝ UŽIVATEL ---
    await log_activity(
        db, 
        action="USER_REGISTER", 
        user_id=new_user_id, 
        details=f"Nový uživatel registrován: {new_user_email}"
    )

    return user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Ověření uživatele
    user = await crud_user.authenticate(db, email=form_data.username, password=form_data.password)
    
    if not user:
        # --- LOGOVÁNÍ: CHYBA PŘIHLÁŠENÍ ---
        await log_activity(
            db, 
            action="LOGIN_FAILED", 
            details=f"Neúspěšný pokus o přihlášení pro email: {form_data.username}"
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Špatný email nebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Uložíme si data do proměnných PŘED logováním.
    user_id = user.id
    user_email = user.email
    
    # ----------------------------------------------------
    # --- NOVÁ KLÍČOVÁ LOGIKA: KONTROLA STAVU UŽIVATELE ---
    
    # 1. Vlajka pro vynucenou změnu hesla
    needs_change = user.force_password_change
    
    # 2. Vlajka pro admina (pro frontend UI)
    is_admin = user.is_admin
    
    # ----------------------------------------------------

    # --- LOGOVÁNÍ: ÚSPĚŠNÉ PŘIHLÁŠENÍ ---
    await log_activity(
        db, 
        action="LOGIN_SUCCESS", 
        user_id=user_id, 
        details=f"Uživatel {user_email} se úspěšně přihlásil"
    )
    
    # 2. Vyrobíme token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user_email}, expires_delta=access_token_expires
    )
    
    # 3. Vrátíme odpověď s oběma důležitými vlajkami
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "force_password_change": needs_change, # Frontend kontroluje, jestli přesměrovat
        "is_admin": is_admin # Frontend kontroluje, jestli zobrazit Admin menu
    }

@router.post("/logout")
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tento endpoint nic nedělá s tokenem (ten maže frontend),
    ale slouží k tomu, aby se akce zapsala do logů.
    """
    await log_activity(
        db,
        action="LOGOUT",
        user_id=current_user.id,
        details=f"Uživatel {current_user.email} se odhlásil"
    )
    return {"message": "Logout logged successfully"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Vrátí informace o mně.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def update_my_password(
    password_data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Vyžaduje platný token
):
    # 1. Změna hesla přes CRUD funkci
    success = await crud_user.change_password(
        db,
        user=current_user,
        old_password=password_data.old_password,
        new_password=password_data.new_password
    )
    
    if not success:
        # --- LOGOVÁNÍ CHYBY ---
        await log_activity(
            db,
            action="PASSWORD_CHANGE_FAILED",
            user_id=current_user.id,
            details=f"Uživatel {current_user.email} se pokusil změnit heslo, ale staré heslo bylo špatné."
        )
        raise HTTPException(
            status_code=400,
            detail="Původní heslo není správné."
        )

    # 2. Logování úspěchu
    await log_activity(
        db,
        action="PASSWORD_CHANGED",
        user_id=current_user.id,
        details=f"Uživatel {current_user.email} úspěšně změnil heslo."
    )
    
    return {"message": "Heslo bylo úspěšně změněno. Vynucení změny bylo vypnuto."}