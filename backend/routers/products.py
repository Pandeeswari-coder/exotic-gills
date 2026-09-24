import base64
import math
import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from auth import get_current_admin
from models import Category, CategoryEmbedded, Product
from schemas import CategoryResponse, ProductListResponse, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


def product_to_response(p: Product) -> ProductResponse:
    return ProductResponse(
        id=str(p.id),
        name=p.name,
        slug=p.slug,
        description=p.description,
        price=p.price,
        stock=p.stock,
        image=p.image_url,
        category=CategoryResponse(
            id=p.category.id,
            name=p.category.name,
            slug=p.category.slug,
        ) if p.category else None,
        available=p.is_available,
        created_at=p.created_at,
    )


@router.get("/", response_model=ProductListResponse)
async def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    available: Optional[bool] = Query(default=None),
):
    query: dict = {}

    if available is not None:
        query["is_available"] = available
    if category:
        query["category.slug"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = await Product.find(query).count()
    offset = (page - 1) * page_size
    prods = await Product.find(query).sort("-created_at").skip(offset).limit(page_size).to_list()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ProductListResponse(
        items=[product_to_response(p) for p in prods],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_response(product)


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    category_slug: Optional[str] = Form(None),
    is_available: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    _=Depends(get_current_admin),
):
    slug = slugify(name)
    if await Product.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    image_url: Optional[str] = None
    if image and image.filename:
        content = await image.read()
        b64 = base64.b64encode(content).decode()
        mime = image.content_type or "image/jpeg"
        image_url = f"data:{mime};base64,{b64}"

    cat_embedded: Optional[CategoryEmbedded] = None
    if category_slug:
        cat = await Category.find_one({"slug": category_slug})
        if cat:
            cat_embedded = CategoryEmbedded(id=str(cat.id), name=cat.name, slug=cat.slug)

    product = Product(
        name=name,
        slug=slug,
        description=description,
        price=price,
        stock=stock,
        image_url=image_url,
        category=cat_embedded,
        is_available=is_available,
    )
    await product.insert()
    return product_to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    stock: Optional[int] = Form(None),
    category_slug: Optional[str] = Form(None),
    is_available: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    _=Depends(get_current_admin),
):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = stock
    if is_available is not None:
        product.is_available = is_available

    if image and image.filename:
        content = await image.read()
        b64 = base64.b64encode(content).decode()
        mime = image.content_type or "image/jpeg"
        product.image_url = f"data:{mime};base64,{b64}"

    if category_slug is not None:
        cat = await Category.find_one({"slug": category_slug})
        product.category = CategoryEmbedded(id=str(cat.id), name=cat.name, slug=cat.slug) if cat else None

    await product.save()
    return product_to_response(product)


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, _=Depends(get_current_admin)):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await product.delete()
