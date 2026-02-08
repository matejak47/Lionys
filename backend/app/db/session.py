from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
from pathlib import Path

# --- OPRAVA PRO NAČTENÍ .ENV ---
# Pythonu řekneme: "Jdi od tohoto souboru o 4 patra nahoru, tam najdeš .env"
# Cesta: backend/app/db/session.py -> db -> app -> backend -> ROOT
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
# -------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

# Pojistka: Kdyby se .env nenačetl, vyhodíme čitelnou chybu
if not DATABASE_URL:
    raise ValueError("CHYBA: Nenalezeno DATABASE_URL. Zkontroluj, jestli existuje soubor .env v kořenu projektu!")

# Oprava pro Async ovladač (pokud tam chybí +asyncpg)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine, 
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()