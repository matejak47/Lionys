import os

class Settings:
    # Název projektu
    PROJECT_NAME: str = "Muj CMS API"
    
    # Tajný klíč
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tajny_klic_pro_vyvoj")
    
    # Logování: Načteme z .env, pokud tam není, použijeme 365.
    # Důležité: Musíme to převést na int (číslo), protože .env vrací text.
    LOG_RETENTION_DAYS: int = int(os.getenv("LOG_RETENTION_DAYS", 365))

settings = Settings()