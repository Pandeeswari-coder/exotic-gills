import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from models import Category, Order, Product, User
from routers import auth, categories, orders, products, users

load_dotenv()

# Base origins always allowed
_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Add any extra origins from env (comma-separated)
_extra = os.getenv("FRONTEND_URL", "")
for _url in _extra.split(","):
    _url = _url.strip()
    if _url:
        _origins.append(_url)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db([Category, Product, User, Order])
    yield


app = FastAPI(
    title="Fish E-Commerce API",
    description="Backend API for Exotic Gills and Fins — powered by MongoDB",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "Fish E-Commerce API is running"}


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}
