import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/fish_ecom")


async def init_db(document_models: list) -> None:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=document_models)
