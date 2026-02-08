from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import os
from app.core.config import settings
from fastapi.staticfiles import StaticFiles

# Importy našich funkcí
from app.api.v1 import auth, logs, stats, categories, upload, content_items, users, messages
from app.db.session import SessionLocal
from app.services.audit import delete_old_logs, log_activity


# --- FUNKCE PRO CRON (To, co se děje v noci) ---
async def run_cleanup():
    """Tato funkce se spustí automaticky podle plánu"""
    async with SessionLocal() as db:
        try:
            print("🕒 CRON: Spouštím automatický úklid logů...")
            
            # 1. Smažeme logy starší než 365 dní
            count = await delete_old_logs(db, days=settings.LOG_RETENTION_DAYS)
            
            # 2. Pokud se něco smazalo, zapíšeme to do auditu jako "SYSTEM_CLEANUP"
            if count > 0:
                await log_activity(
                    db,
                    action="SYSTEM_CLEANUP",
                    details=f"Automatický úklid: Smazáno {count} starých záznamů.",
                    user_id=None # None = Udělal to Systém, ne uživatel
                )
                print(f"✅ CRON: Hotovo. Smazáno {count} záznamů.")
            else:
                print("💤 CRON: Žádné staré logy k mazání.")
                
        except Exception as e:
            print(f"❌ CRON CHYBA: {e}")

# --- LIFESPAN (Start a Stop aplikace) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. CO SE STANE PŘI ZAPNUTÍ (START)
    scheduler = AsyncIOScheduler()
    
    # Nastavíme budík: Spouštěj se každých 24 hodin
    # (Pro testování si to můžeš změnit na 'minutes=1')
    scheduler.add_job(run_cleanup, 'interval', hours=24)
    
    scheduler.start()
    print("⏰ Plánovač úloh (Cron) byl úspěšně spuštěn.")
    
    yield # ---> TADY BĚŽÍ TVOJE APLIKACE <---
    
    # 2. CO SE STANE PŘI VYPNUTÍ (STOP)
    scheduler.shutdown()
    print("🔕 Plánovač vypnut.")

# --- Vytvoření aplikace s naším Lifespanem ---
app = FastAPI(title="Muj CMS API", version="1.0.0", lifespan=lifespan)

# --- CORS Nastavení ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Zbytek aplikace ---
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(logs.router, prefix="/logs", tags=["Logs"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(content_items.router, prefix="/content", tags=["Content"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])



# Umožníme přístup k nahraným souborům
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Backend běží i s Cronem! 🚀"}