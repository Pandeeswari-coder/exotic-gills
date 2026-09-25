from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from models import Product, User, Wishlist
from schemas import CategoryResponse, ProductResponse

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def _product_response(p: Product) -> ProductResponse:
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


async def _get_or_create(user_id: str) -> Wishlist:
    wl = await Wishlist.find_one({"user_id": user_id})
    if not wl:
        wl = Wishlist(user_id=user_id)
        await wl.insert()
    return wl


@router.get("/", response_model=List[ProductResponse])
async def get_wishlist(user: User = Depends(get_current_user)):
    wl = await _get_or_create(str(user.id))
    products = []
    for pid in wl.product_ids:
        try:
            p = await Product.get(pid)
            if p:
                products.append(_product_response(p))
        except Exception:
            pass
    return products


@router.get("/ids")
async def get_wishlist_ids(user: User = Depends(get_current_user)):
    wl = await _get_or_create(str(user.id))
    return {"product_ids": wl.product_ids}


@router.post("/{product_id}")
async def add_to_wishlist(product_id: str, user: User = Depends(get_current_user)):
    p = await Product.get(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    wl = await _get_or_create(str(user.id))
    if product_id not in wl.product_ids:
        wl.product_ids.append(product_id)
        wl.updated_at = datetime.utcnow()
        await wl.save()
    return {"product_ids": wl.product_ids}


@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user: User = Depends(get_current_user)):
    wl = await _get_or_create(str(user.id))
    wl.product_ids = [pid for pid in wl.product_ids if pid != product_id]
    wl.updated_at = datetime.utcnow()
    await wl.save()
    return {"product_ids": wl.product_ids}
