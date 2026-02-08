from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, func # Přidán func pro případné použití
from app.models.content_item import ContentItem 
from app.schemas.content_item import ContentItemCreate, ContentItemUpdate
from typing import Optional
import re
import unicodedata
from sqlalchemy import select, func

# --- NOVÉ IMPORTY PRO MAZÁNÍ GALERIE ---
from app.models.content_item import ContentPhoto # Model pro ContentPhoto
from app.services.image_service import delete_file_by_url # Služba pro mazání souborů
# ---------------------------------------

# Pomocná funkce na výrobu URL (Slug) - Použijeme stejnou logiku jako u Category
def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

async def get_all_content_items(db: AsyncSession, category_id: Optional[int] = None):
    # Řadíme podle pozice (position) a volitelně filtrujeme podle kategorie
    query = select(ContentItem)
    
    if category_id is not None:
        query = query.where(ContentItem.category_id == category_id)
        
    # Řazení podle pozice
    result = await db.execute(query.order_by(ContentItem.position))
    return result.scalars().all()

async def get_content_item_by_id(db: AsyncSession, item_id: int):
    result = await db.execute(select(ContentItem).where(ContentItem.id == item_id))
    return result.scalar_one_or_none()

async def get_content_item_by_slug(db: AsyncSession, slug: str):
    result = await db.execute(select(ContentItem).where(ContentItem.slug == slug))
    return result.scalar_one_or_none()

async def create_content_item(db: AsyncSession, item_in: ContentItemCreate):
    # 1. Slugify (vyrobíme ho z názvu, pokud není zadaný)
    if not item_in.slug:
        item_in.slug = slugify(item_in.title)
    else:
        item_in.slug = slugify(item_in.slug)

    # 2. Vytvoření objektu
    db_obj = ContentItem(**item_in.dict())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_content_item(db: AsyncSession, db_obj: ContentItem, item_in: ContentItemUpdate):
    update_data = item_in.dict(exclude_unset=True)

    # Pokud je upraven slug, vyčistíme ho
    if "slug" in update_data and update_data["slug"]:
        update_data["slug"] = slugify(update_data["slug"])
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

# --- NOVÁ FUNKCE PRO MAZÁNÍ GALERIE A SOUBORŮ ---
async def delete_associated_photos_and_files(db: AsyncSession, content_item_id: int) -> int:
    """
    Smaže všechny navázané ContentPhoto záznamy a jejich fyzické soubory z disku.
    Vrací počet smazaných fotek.
    """
    
    # 1. Najít všechny fotky patřící k položce
    photos_result = await db.execute(
        select(ContentPhoto).where(ContentPhoto.content_item_id == content_item_id)
    )
    photos = photos_result.scalars().all()
    
    # 2. Smazat fyzické soubory pro každou fotku
    for photo in photos:
        delete_file_by_url(photo.image_url) 
        
    # 3. Smazat záznamy ContentPhoto z databáze
    if photos:
        await db.execute(
            delete(ContentPhoto).where(ContentPhoto.content_item_id == content_item_id)
        )
    
    return len(photos)
# --------------------------------------------------

async def delete_content_item(db: AsyncSession, item_id: int):
    await db.execute(delete(ContentItem).where(ContentItem.id == item_id))
    await db.commit()

async def get_published_content_count(db: AsyncSession) -> int:
    """Vrátí celkový počet položek obsahu, které jsou publikované (is_published=True)."""
    
    # Počítáme záznamy s is_published = True
    query = select(func.count(ContentItem.id)).where(ContentItem.is_published == True)
    
    count = await db.scalar(query)
    return count if count is not None else 0