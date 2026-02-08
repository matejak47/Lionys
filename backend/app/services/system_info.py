# backend/app/services/system_info.py

import os
import shutil
from typing import Tuple


# Předpokládáme, že kořenový adresář backendu je o dvě úrovně výše 
# (ze složky app/services)
BACKEND_ROOT = os.path.join(os.path.dirname(__file__), '..', '..')

def get_folder_size(folder_path: str) -> int:
    """Vrátí rekurzivní velikost složky v bajtech."""
    total_size = 0
    # Sestavíme plnou cestu z kořene backendu
    full_path = os.path.join(BACKEND_ROOT, folder_path)
    
    if not os.path.exists(full_path):
        return 0
    
    for dirpath, _, filenames in os.walk(full_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    
    return total_size

def get_disk_usage(path: str) -> Tuple[int, int, int]:
    """
    Vrátí celkovou, použitou a volnou kapacitu disku (filesystemu) v bajtech.
    Vrací: (total, used, free)
    """
    try:
        # Používá shutil.disk_usage pro získání informací o filesystemu
        return shutil.disk_usage(path)
    except Exception:
        # Vrátí nulu, pokud dojde k chybě
        return (0, 0, 0)