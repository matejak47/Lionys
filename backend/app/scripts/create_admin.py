import os
import asyncio
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


async def main():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        raise RuntimeError("ADMIN_EMAIL or ADMIN_PASSWORD is not set")

    async with SessionLocal() as session:
        # pojistka: když už existuje, nevytvářej znova
        res = await session.execute(select(User).where(User.email == email))
        if res.scalar_one_or_none():
            print(f"⚠️ Admin already exists: {email}")
            return

        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            is_admin=True,
            is_active=True,
            force_password_change=True,
        )

        session.add(user)
        await session.commit()
        print(f"✅ Admin user created: {email}")


if __name__ == "__main__":
    asyncio.run(main())
