from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_password_hash
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserCreateByAdmin # Předpokládáme nové schéma
import secrets # Pro bezpečnou generaci hesla
import string
# --- HELPER FUNKCE ---
def generate_random_password(length: int = 12) -> str:
    """Generuje bezpečné náhodné heslo."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# --- ZÁKLADNÍ CRUD FUNKCE ---

async def get_user_by_email(db: AsyncSession, email: str):
    """Zjistí, jestli už email existuje"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: UserCreate):
    """Vytvoří nového uživatele (pro self-registraci)"""
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        # Standardní registrace by neměla vyžadovat změnu hesla
        force_password_change=False 
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user

# --- NOVÁ CRUD FUNKCE PRO ADMINA ---

async def create_user_by_admin(db: AsyncSession, user_in: UserCreateByAdmin):
    """
    Vytvoří nového uživatele administrátorem.
    Vynucuje změnu hesla a generuje náhodné heslo.
    Vrací objekt uživatele A VYGENEROVANÉ HESLO (clear-text).
    """
    # 1. Generujeme náhodné heslo
    temp_password = generate_random_password()
    hashed_password = get_password_hash(temp_password)

    # 2. Vytvoříme instanci modelu (předpokládáme, že UserCreateByAdmin obsahuje is_active/is_admin)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=user_in.is_active if hasattr(user_in, 'is_active') else True,
        is_admin=user_in.is_admin if hasattr(user_in, 'is_admin') else False,
        # KLÍČOVÝ DETAIL: Vynutíme změnu hesla
        force_password_change=True 
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Vracíme uživatele a dočasné heslo (admin ho musí sdělit uživateli)
    return db_user, temp_password


async def authenticate(db: AsyncSession, email: str, password: str):
    """Zkontroluje, jestli sedí email i heslo a jestli je uživatel aktivní."""
    user = await get_user_by_email(db, email)
    
    if not user:
        return None
        
    # Kontrola, jestli je účet aktivní (logický vypínač)
    if not user.is_active: 
        return None # Můžeš vrátit i vlastní výjimku pro lepší chybovou zprávu

    if not verify_password(password, user.hashed_password):
        return None
        
    return user

async def change_password(db: AsyncSession, user: User, old_password: str, new_password: str) -> bool:
    """
    Změní heslo uživatele a vypne vynucenou změnu.
    Vrací True při úspěchu, False při špatném starém hesle.
    """
    
    # 1. Ověření starého hesla
    if not verify_password(old_password, user.hashed_password):
        return False
        
    # 2. Zahashování nového hesla
    hashed_new_password = get_password_hash(new_password)
    
    # 3. Aktualizace v DB
    user.hashed_password = hashed_new_password
    user.force_password_change = False # KLÍČOVÝ DETAIL: Vypnutí vynucené změny
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return True

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Najde uživatele podle ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_all_users(db: AsyncSession):
    """Vrátí všechny uživatele (např. pro admin přehled)."""
    result = await db.execute(
        select(User).order_by(User.id)  # můžeš změnit na created_at desc
    )
    return result.scalars().all()


async def set_user_active(db: AsyncSession, user: User, is_active: bool) -> User:
    """Nastaví (de)aktivaci uživatele."""
    user.is_active = is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    """Smaže uživatele z databáze."""
    await db.delete(user)
    await db.commit()

async def set_user_role(db: AsyncSession, user: User, is_admin: bool) -> User:
    """Nastaví / odebere admin práva uživatele."""
    user.is_admin = is_admin
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
