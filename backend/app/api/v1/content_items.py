from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.content_item import ContentItemCreate, ContentItemUpdate, ContentItemResponse
from app.crud import crud_content_item, crud_category # <-- DŮLEŽITÉ: IMPORT crud_category pro kontrolu FK
from app.services.audit import log_activity 
from app.services.image_service import delete_file_by_url 

router = APIRouter()

# GET (Seznam položek, volitelně filtrovaný podle kategorie)
@router.get("/", response_model=List[ContentItemResponse])
async def read_content_items(
    db: AsyncSession = Depends(get_db),
    # Umožní filtrace: /content?category_id=5
    category_id: Optional[int] = Query(None, description="Filtrovat podle ID kategorie")
):
    items = await crud_content_item.get_all_content_items(db, category_id=category_id)
    return items

# GET (Detail položky)
@router.get("/{item_id}", response_model=ContentItemResponse)
async def read_content_item_detail(
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    item = await crud_content_item.get_content_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Obsahová položka nenalezena")
    return item

# POST (Vytvoření položky)
@router.post("/", response_model=ContentItemResponse)
async def create_content_item(
    item_in: ContentItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_id = current_user.id
    admin_email = current_user.email

    # --- KONTROLA 1: CIZÍ KLÍČ (Foreign Key) ---
    category = await crud_category.get_category_by_id(db, category_id=item_in.category_id)
    if not category:
        raise HTTPException(
            status_code=400,
            detail=f"Kategorie s ID {item_in.category_id} nebyla nalezena. Položku nelze uložit."
        )

    # Kontrola unikátnosti slugu
    slug_to_check = item_in.slug or crud_content_item.slugify(item_in.title)
    existing = await crud_content_item.get_content_item_by_slug(db, slug=slug_to_check)
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Položka s tímto URL (slugem) už existuje."
        )

    new_item = await crud_content_item.create_content_item(db, item_in)

    await log_activity(
        db,
        action="CONTENT_CREATE",
        user_id=admin_id, 
        details=f"Uživatel {admin_email} vytvořil položku: {new_item.title} (CatID: {new_item.category_id})"
    )
    
    # --- OPRAVA CHYBY MissingGreenlet ---
    # Znovu načteme model, aby byl v aktivní relaci pro serializaci Pydanticem
    await db.refresh(new_item) 

    return new_item

# PATCH (Úprava položky)
@router.patch("/{item_id}", response_model=ContentItemResponse)
async def update_content_item(
    item_id: int,
    item_in: ContentItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_id = current_user.id
    admin_email = current_user.email
    
    item = await crud_content_item.get_content_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Obsahová položka nenalezena")
    
    old_title = item.title 
    
    # --- KONTROLA A MAZÁNÍ STARÉHO OBRÁZKU ---
    update_data = item_in.dict(exclude_unset=True)

    # Řešíme hlavní obrázek (image_url)
    if "image_url" in update_data:
        new_image = update_data["image_url"]
        old_image = item.image_url
        
        # Pokud se obrázek mění (nebo maže) a starý existoval -> SMAZAT STARÝ
        if old_image and new_image != old_image:
            delete_file_by_url(old_image) 
    # ---------------------------------------------
    
    updated_item = await crud_content_item.update_content_item(db, db_obj=item, item_in=item_in)

    await log_activity(
        db,
        action="CONTENT_UPDATE",
        user_id=admin_id,
        details=f"Uživatel {admin_email} upravil položku ID {item_id}. Změna z '{old_title}' na '{updated_item.title}'."
    )
    
    # --- OPRAVA CHYBY MissingGreenlet ---
    await db.refresh(updated_item)
    
    return updated_item

# DELETE (Smazání položky)
@router.delete("/{item_id}")
async def delete_content_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_id = current_user.id
    admin_email = current_user.email

    item = await crud_content_item.get_content_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Obsahová položka nenalezena")
    
    deleted_title = item.title 
    
    # --- MAZÁNÍ SOUBORŮ A GALERIE ---
    
    # 1. Smazání primárního obrázku (image_url)
    delete_file_by_url(item.image_url)
    
    # 2. Smazání všech fotek z galerie ContentPhoto (z disku a DB záznamů)
    deleted_photos_count = await crud_content_item.delete_associated_photos_and_files(db, item_id)

    # 3. Smazání hlavní položky z DB
    await crud_content_item.delete_content_item(db, item_id) 

    # Logování
    log_detail = (
        f"Uživatel {admin_email} smazal položku: {deleted_title} (ID: {item_id}). "
        f"Smazáno {deleted_photos_count} fotek z galerie."
    )
    await log_activity(
        db,
        action="CONTENT_DELETE",
        user_id=admin_id, 
        details=log_detail
    )

    return {"message": "Obsahová položka smazána"}