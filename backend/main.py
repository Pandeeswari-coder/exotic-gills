import os
import sys
import types
from contextlib import asynccontextmanager

# razorpay 1.4.x uses pkg_resources which is not bundled with Python 3.11+ venvs.
# Inject a minimal shim so the import succeeds; actual version lookup still works
# via importlib.metadata.
try:
    import pkg_resources  # noqa: F401 — already available, nothing to do
except ImportError:
    import importlib.metadata as _meta
    _pkg = types.ModuleType("pkg_resources")

    class _DistributionNotFound(Exception):
        pass

    class _VersionConflict(Exception):
        pass

    def _require(name: str):
        class _Dist:
            version = _meta.version(name)
        return [_Dist()]

    _pkg.require = _require  # type: ignore[attr-defined]
    _pkg.DistributionNotFound = _DistributionNotFound  # type: ignore[attr-defined]
    _pkg.VersionConflict = _VersionConflict  # type: ignore[attr-defined]
    sys.modules["pkg_resources"] = _pkg

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from models import Category, ChatMessage, ChatSession, Order, Product, PushSubscription, User
from routers import auth, categories, chat, orders, products, users
from routers.categories import run_seed

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
    await init_db([Category, Product, User, Order, ChatMessage, ChatSession, PushSubscription])
    await run_seed()   # ensures all categories exist in DB on every startup
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
app.include_router(chat.router)


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "Fish E-Commerce API is running"}


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}
