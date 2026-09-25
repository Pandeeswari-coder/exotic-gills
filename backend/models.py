from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import BaseModel, Field


class CategoryEmbedded(BaseModel):
    id: str
    name: str
    slug: str
    parent_id: Optional[str] = None
    parent_slug: Optional[str] = None
    parent_name: Optional[str] = None


class Category(Document):
    name: str
    slug: str
    parent_id: Optional[str] = None  # None = main category

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


class ChatMessage(Document):
    session_id: str
    sender: str          # 'customer' | 'owner'
    type: str            # 'text' | 'image' | 'video' | 'catalog'
    text: Optional[str] = None
    media_url: Optional[str] = None
    video_url: Optional[str] = None
    product_ids: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

    class Settings:
        name = "chat_messages"


class ChatSession(Document):
    session_id: str
    customer_name: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_message: str = ""
    last_at: datetime = Field(default_factory=datetime.utcnow)
    unread: int = 0

    class Settings:
        name = "chat_sessions"


class PushSubscription(Document):
    """Stores Web Push subscriptions for admin devices."""
    endpoint: str
    p256dh: str
    auth: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "push_subscriptions"


class Wishlist(Document):
    user_id: str
    product_ids: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "wishlists"
