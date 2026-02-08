from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
import re
import unicodedata

# Pomocná funkce na výrobu URL (Slug)
# "Pánské střihy!" -> "panske-strihy"
def slugify(text: str) -> str:
    # 1. Odstranění diakritiky (č, ř, š -> c, r, s)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    # 2. Vše na malá písmena
    text = text.lower()
    # 3. Nahrazení mezer a divných znaků pomlčkou
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # 4. Odstranění pomlček na začátku a konci
    return text.strip('-')

async def get_all_categories(db: AsyncSession):
    # Řadíme podle pozice (position)
    result = await db.execute(select(Category).order_by(Category.position))
    return result.scalars().all()

async def get_category_by_id(db: AsyncSession, category_id: int):
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()

async def get_category_by_slug(db: AsyncSession, slug: str):
    result = await db.execute(select(Category).where(Category.slug == slug))
    return result.scalar_one_or_none()

async def create_category(db: AsyncSession, category_in: CategoryCreate):
    # Pokud slug není zadaný, vyrobíme ho z názvu
    if not category_in.slug:
        category_in.slug = slugify(category_in.name)
    else:
        # I zadaný slug raději "vyčistíme"
        category_in.slug = slugify(category_in.slug)

    # Vytvoříme objekt
    db_obj = Category(**category_in.dict())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_category(db: AsyncSession, db_obj: Category, category_in: CategoryUpdate):
    # Převedeme data na dict a odstraníme prázdné hodnoty (None)
    update_data = category_in.dict(exclude_unset=True)

    # Pokud se mění název a slug nebyl zadán, můžeme slug přegenerovat (volitelné)
    # Zde to raději necháme na uživateli - slug by se neměl měnit samoúčelně (rozbíjí SEO)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_category(db: AsyncSession, category_id: int):
    await db.execute(delete(Category).where(Category.id == category_id))
    await db.commit()