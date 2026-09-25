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
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
):
    query: dict = {}

    if available is not None:
        query["is_available"] = available

    # Price range filter
    if min_price is not None or max_price is not None:
        price_cond: dict = {}
        if min_price is not None:
            price_cond["$gte"] = min_price
        if max_price is not None:
            price_cond["$lte"] = max_price
        query["price"] = price_cond
    if category:
        # category may be comma-separated (e.g. "fish,plants,rocks")
        requested_slugs = [s.strip() for s in category.split(",") if s.strip()]
        # Expand each slug: if it's a parent, also collect its children
        all_slugs: set[str] = set()
        all_parent_slugs: set[str] = set()
        for slug in requested_slugs:
            parent_cat = await Category.find_one({"slug": slug, "parent_id": None})
            if parent_cat:
                all_parent_slugs.add(slug)
                child_slugs = [
                    c.slug for c in await Category.find({"parent_id": str(parent_cat.id)}).to_list()
                ]
                all_slugs.update(child_slugs)
                all_slugs.add(slug)
            else:
                all_slugs.add(slug)
        cat_conditions = [
            {"category.slug": {"$in": list(all_slugs)}},
        ]
        if all_parent_slugs:
            cat_conditions.append({"category.parent_slug": {"$in": list(all_parent_slugs)}})
        query["$or"] = cat_conditions
    if search:
        search_cond = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]}
        if "$or" in query:
            # Combine category $or and search $or using $and
            query = {"$and": [{"$or": query.pop("$or")}, search_cond], **query}
        else:
            query.update(search_cond)

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
            parent_slug = None
            parent_name = None
            if cat.parent_id:
                parent = await Category.get(cat.parent_id)
                if parent:
                    parent_slug = parent.slug
                    parent_name = parent.name
            cat_embedded = CategoryEmbedded(
                id=str(cat.id), name=cat.name, slug=cat.slug,
                parent_id=cat.parent_id, parent_slug=parent_slug, parent_name=parent_name,
            )

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
        if cat:
            parent_slug = None
            parent_name = None
            if cat.parent_id:
                parent = await Category.get(cat.parent_id)
                if parent:
                    parent_slug = parent.slug
                    parent_name = parent.name
            product.category = CategoryEmbedded(
                id=str(cat.id), name=cat.name, slug=cat.slug,
                parent_id=cat.parent_id, parent_slug=parent_slug, parent_name=parent_name,
            )
        else:
            product.category = None

    await product.save()
    return product_to_response(product)


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, _=Depends(get_current_admin)):
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await product.delete()
