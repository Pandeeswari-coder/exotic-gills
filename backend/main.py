from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, categories, orders, products, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Dispose engine on shutdown
    await engine.dispose()


app = FastAPI(
    title="Fish E-Commerce API",
    description="Backend API for a fish e-commerce platform with Razorpay payments",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow the React dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
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
