from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.image_service import process_and_save_image
from app.services.audit import log_activity 

router = APIRouter()

def format_size(size_in_bytes):
    # Pomocná funkce: 1024 B -> 1 KB, 1024*1024 B -> 1 MB
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    else:
        return f"{size_in_bytes / (1024 * 1024):.1f} MB"

@router.post("/", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Vyžadujeme přihlášení pro logy
):
    # 1. Validace
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Soubor není obrázek.")

    # Uložíme si ID pro log (aby nevypršelo po commitu)
    user_id = current_user.id
    user_email = current_user.email

    try:
        # 2. Voláme službu (magie se děje tam)
        result = await process_and_save_image(file)

        # 3. ZAPÍŠEME AUDIT LOG 📝
        orig_readable = format_size(result['original_size'])
        final_readable = format_size(result['final_size'])
        
        # Kolik jsme ušetřili? (např. "Ušetřeno 90%")
        saving_pct = 100 - (result['final_size'] / result['original_size'] * 100)
        
        log_detail = (
            f"Uživatel {user_email} nahrál soubor: {result['filename']}. "
            f"Velikost: {orig_readable} -> {final_readable} (Komprese {saving_pct:.0f}%)."
        )

        await log_activity(
            db,
            action="UPLOAD_FILE",
            user_id=user_id,
            details=log_detail
        )

        return {"url": result["url"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chyba nahrávání: {str(e)}")