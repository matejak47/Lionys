from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.crud import crud_category
from app.services.audit import log_activity 
# import os # <-- Již není potřeba
# IMPORTUJEME CENTRALIZOVANOU FUNKCI PRO MAZÁNÍ SOUBORŮ
from app.services.image_service import delete_file_by_url 

router = APIRouter()

# PŮVODNÍ LOKÁLNÍ FUNKCE delete_file_from_disk BYLA ODSTRANĚNA A PŘESUNUTA DO image_service.py

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(db: AsyncSession = Depends(get_db)):
    categories = await crud_category.get_all_categories(db)
    return categories

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Uložíme si data o uživateli HNED TEĎ (aby nevypršela po commitu)
    admin_id = current_user.id
    admin_email = current_user.email

    slug_to_check = category_in.slug or crud_category.slugify(category_in.name)
    existing = await crud_category.get_category_by_slug(db, slug=slug_to_check)
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Kategorie s tímto URL (slugem) už existuje."
        )

    # 2. Vytvoření (proběhne commit)
    new_category = await crud_category.create_category(db, category_in)

    # 3. Logování s emailem v textu
    await log_activity(
        db,
        action="CATEGORY_CREATE",
        user_id=admin_id, 
        details=f"Uživatel {admin_email} vytvořil kategorii: {new_category.name} (Slug: {new_category.slug})"
    )

    # 4. Refresh objektu před vrácením
    await db.refresh(new_category) 

    return new_category

@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_id = current_user.id
    admin_email = current_user.email
    
    category = await crud_category.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nenalezena")
    
    old_name = category.name 
    
    # --- KONTROLA A MAZÁNÍ STARÝCH FOTEK ---
    update_data = category_in.dict(exclude_unset=True)

    # 1. Řešíme hlavní obrázek (image_path)
    if "image_path" in update_data:
        new_image = update_data["image_path"]
        old_image = category.image_path
        
        # Pokud se obrázek mění (nebo maže) a starý existoval -> SMAZAT STARÝ
        if old_image and new_image != old_image:
            delete_file_by_url(old_image) # <--- POUŽITÍ NOVÉ SLUŽBY

    # 2. Řešíme ikonku (icon_path)
    if "icon_path" in update_data:
        new_icon = update_data["icon_path"]
        old_icon = category.icon_path
        
        if old_icon and new_icon != old_icon:
            delete_file_by_url(old_icon) # <--- POUŽITÍ NOVÉ SLUŽBY
    # ---------------------------------------------
    
    updated_category = await crud_category.update_category(db, db_obj=category, category_in=category_in)

    await log_activity(
        db,
        action="CATEGORY_UPDATE",
        user_id=admin_id,
        details=f"Uživatel {admin_email} upravil kategorii ID {category_id}. Změna z '{old_name}' na '{updated_category.name}'."
    )
    
    await db.refresh(updated_category)
    
    return updated_category

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admin_id = current_user.id
    admin_email = current_user.email

    category = await crud_category.get_category_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nenalezena")
    
    deleted_name = category.name 
    
    # --- SMAZÁNÍ SOUBORŮ Z DISKU ---
    delete_file_by_url(category.image_path) # <--- POUŽITÍ NOVÉ SLUŽBY
    delete_file_by_url(category.icon_path) # <--- POUŽITÍ NOVÉ SLUŽBY
    # -------------------------------------

    await crud_category.delete_category(db, category_id)

    await log_activity(
        db,
        action="CATEGORY_DELETE",
        user_id=admin_id, 
        details=f"Uživatel {admin_email} smazal kategorii: {deleted_name} (ID: {category_id})"
    )

    return {"message": "Kategorie smazána"}