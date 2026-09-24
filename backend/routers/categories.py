from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_admin
from models import Category
from schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def cat_to_response(c: Category) -> CategoryResponse:
    return CategoryResponse(id=str(c.id), name=c.name, slug=c.slug)


@router.get("/", response_model=List[CategoryResponse])
async def list_categories():
    cats = await Category.find().sort("+name").to_list()
    return [cat_to_response(c) for c in cats]


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    cat = await Category.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat_to_response(cat)


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, _=Depends(get_current_admin)):
    if await Category.find_one({"name": data.name}):
        raise HTTPException(status_code=400, detail="Category name already exists")
    if await Category.find_one({"slug": data.slug}):
        raise HTTPException(status_code=400, detail="Category slug already exists")

    cat = Category(name=data.name, slug=data.slug)
    await cat.insert()
    return cat_to_response(cat)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, data: CategoryUpdate, _=Depends(get_current_admin)):
    cat = await Category.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    update = data.model_dump(exclude_unset=True)
    for k, v in update.items():
        setattr(cat, k, v)
    await cat.save()
    return cat_to_response(cat)


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: str, _=Depends(get_current_admin)):
    cat = await Category.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await cat.delete()
