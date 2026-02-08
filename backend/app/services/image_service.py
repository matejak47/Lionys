import os
import uuid
from fastapi import UploadFile
from PIL import Image, ImageOps
import pillow_heif

# Aktivace HEIC podpory
pillow_heif.register_heif_opener()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_WIDTH = 1600
QUALITY = 80

def delete_file_by_url(file_url: str):
    if not file_url:
        return

    filename = file_url.split("/")[-1]  # vezme poslední část (abc.webp)

    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Smazán soubor: {file_path}")
    except Exception as e:
        print(f"Chyba při mazání: {e}")

async def process_and_save_image(file: UploadFile) -> dict:
    """
    Načte obrázek, zkonvertuje (HEIC->WebP), zmenší, zkomprimuje a uloží.
    Vrací dict s URL a informacemi o velikosti.
    """
    
    # 1. Zjistíme původní velikost (pro logy) - musíme přečíst a pak vrátit kurzor
    file.file.seek(0, 2)
    original_size_bytes = file.file.tell()
    file.file.seek(0)
    
    try:
        # 2. Načtení a zpracování
        image = Image.open(file.file)
        image = ImageOps.exif_transpose(image) # Otočení podle EXIF

        if image.mode in ("RGBA", "P", "CMYK"):
            image = image.convert("RGB")

        # 3. Resize
        if image.width > MAX_WIDTH:
            aspect_ratio = image.height / image.width
            new_height = int(MAX_WIDTH * aspect_ratio)
            image = image.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

        # 4. Uložení
        filename = f"{uuid.uuid4()}.webp"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Uložíme a zjistíme novou velikost
        image.save(file_path, format="WEBP", quality=QUALITY, optimize=True)
        final_size_bytes = os.path.getsize(file_path)

        return {
            "url": f"/static/{filename}",
            "filename": filename,
            "original_size": original_size_bytes,
            "final_size": final_size_bytes
        }

    except Exception as e:
        print(f"Chyba v image_service: {e}")
        raise e