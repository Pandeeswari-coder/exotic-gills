from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Token ────────────────────────────────────────────────────────────────────

class TokenData(BaseModel):
    user_id: Optional[str] = None


# ─── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    password: Optional[str] = Field(default=None, min_length=6)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_admin: bool
    created_at: datetime


# ─── Auth ─────────────────────────────────────────────────────────────────────

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Category ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)
    parent_id: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def slug_lowercase(cls, v: str) -> str:
        return v.lower().strip()


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=1, max_length=100)
    parent_id: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def slug_lowercase(cls, v: Optional[str]) -> Optional[str]:
        return v.lower().strip() if v else v


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    parent_id: Optional[str] = None
    subcategories: List["CategoryResponse"] = []

CategoryResponse.model_rebuild()


# ─── Product ──────────────────────────────────────────────────────────────────

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    price: float
    stock: int
    image: Optional[str]
    category: Optional[CategoryResponse]
    available: bool
    created_at: datetime


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Order ────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1)


class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int
    currency: str
    order_id: str
    key_id: str


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    image_url: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    user_id: str
    total_amount: float
    status: str
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse]
