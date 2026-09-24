from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import BaseModel, Field


class CategoryEmbedded(BaseModel):
    id: str
    name: str
    slug: str


class Category(Document):
    name: str
    slug: str

    class Settings:
        name = "categories"


class Product(Document):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    image_url: Optional[str] = None
    category: Optional[CategoryEmbedded] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"


class User(Document):
    email: str
    hashed_password: str
    full_name: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class OrderItemDoc(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    image_url: Optional[str] = None


class Order(Document):
    user_id: str
    items: List[OrderItemDoc] = []
    total_amount: float
    status: str = "pending"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
