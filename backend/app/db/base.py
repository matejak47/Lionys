# Importujeme Base z session.py
from app.db.session import Base

# Importujeme všechny naše modely (aby je Alembic viděl)
from app.models.user import User
# Až budeš mít fotky, přidáš sem: from app.models.photo import Photo
from app.models.audit_log import AuditLog
# ContentItem zatím neřešíme, nebo ho smaž, pokud tam zbyl
from app.models.category import Category

from app.models.content_item import ContentItem, ContentPhoto

from app.models.message import Message