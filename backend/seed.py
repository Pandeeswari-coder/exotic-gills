"""
Run once to seed categories into MongoDB Atlas.
Usage: python seed.py
"""
import asyncio
from database import init_db
from models import Category, User
from auth import hash_password


CATEGORIES = [
    {"name": "Pterophyllum scalare",     "slug": "pterophyllum-scalare"},
    {"name": "Poecilia sp",              "slug": "poecilia-sp"},
    {"name": "Puntigrus tetrazona",      "slug": "puntigrus-tetrazona"},
    {"name": "Astronotus ocellatus",     "slug": "astronotus-ocellatus"},
    {"name": "Amatitlania nigrofasciata","slug": "amatitlania-nigrofasciata"},
    {"name": "Various genus and species","slug": "various"},
    {"name": "Carassias auratus",        "slug": "carassias-auratus"},
    {"name": "Betta splendens",          "slug": "betta-splendens"},
]


async def seed():
    await init_db([Category, User])

    # Seed categories
    for cat_data in CATEGORIES:
        existing = await Category.find_one({"slug": cat_data["slug"]})
        if not existing:
            cat = Category(name=cat_data["name"], slug=cat_data["slug"])
            await cat.insert()
            print(f"  + Added category: {cat_data['name']}")
        else:
            print(f"  - Skipped (exists): {cat_data['name']}")

    # Seed admin user (change email/password before going live!)
    admin_email = "admin@exoticgills.in"
    existing_admin = await User.find_one({"email": admin_email})
    if not existing_admin:
        admin = User(
            email=admin_email,
            hashed_password=hash_password("Admin@123"),
            full_name="Admin",
            is_admin=True,
        )
        await admin.insert()
        print(f"\n  + Admin user created: {admin_email} / Admin@123")
    else:
        print(f"\n  - Admin user already exists: {admin_email}")

    print("\nSeeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
