from pydantic import BaseModel

# 1. Část pro počty (ta tři čísla)
class StatsCounts(BaseModel):
    users: int
    content_items: int  # Zatím bude 0 (Aktivní služby)
    messages: int       # Zatím bude 0 (Nové zprávy)

# NOVÁ STRUKTURA PRO DETAILY DISKU
class StatsStorage(BaseModel):
    # Využití celého filesystemu (zjištěno z cesty k UPLOAD_DIR)
    total_disk_size: int
    used_disk_size: int
    free_disk_size: int

    # Velikost konkrétních složek
    app_folder_size: int 
    uploads_folder_size: int 

# 2. Hlavní odpověď
class StatsResponse(BaseModel):
    system_version: str
    database_status: str
    counts: StatsCounts
    storage: StatsStorage # Změna z storage_size na detailní strukturu