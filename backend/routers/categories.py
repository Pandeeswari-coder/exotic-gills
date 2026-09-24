from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_admin
from models import Category
from schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def cat_to_response(c: Category, subcategories: list[CategoryResponse] | None = None) -> CategoryResponse:
    return CategoryResponse(
        id=str(c.id),
        name=c.name,
        slug=c.slug,
        parent_id=c.parent_id,
        subcategories=subcategories or [],
    )


@router.get("/", response_model=List[CategoryResponse])
async def list_categories():
    all_cats = await Category.find().sort("+name").to_list()

    # Build id → doc map
    by_id: dict[str, Category] = {str(c.id): c for c in all_cats}

    # Separate main and sub
    mains = [c for c in all_cats if not c.parent_id]
    subs: dict[str, list[Category]] = {}
    for c in all_cats:
        if c.parent_id:
            subs.setdefault(c.parent_id, []).append(c)

    result = []
    for m in mains:
        mid = str(m.id)
        sub_responses = [cat_to_response(s) for s in subs.get(mid, [])]
        result.append(cat_to_response(m, sub_responses))
    return result


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    cat = await Category.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat_to_response(cat)


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(data: CategoryCreate, _=Depends(get_current_admin)):
    if await Category.find_one({"slug": data.slug}):
        raise HTTPException(status_code=400, detail="Category slug already exists")

    # Validate parent exists if given
    if data.parent_id:
        parent = await Category.get(data.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent category not found")

    cat = Category(name=data.name, slug=data.slug, parent_id=data.parent_id)
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


SEED_TREE: list[tuple[str, str, list[tuple[str, str]]]] = [
    ("Fish", "fish", [
        ("Cichlids", "cichlids"),
        ("Stingray", "stingray"),
        ("Arowana", "arowana"),
        ("Plecos", "plecos"),
    ]),
    ("Plants", "plants", [
        ("Ferns", "ferns"),
        ("Anubias", "anubias"),
    ]),
    ("Driftwoods", "driftwoods", [
        ("Japonica Woods", "japonica-woods"),
        ("Spiral Woods", "spiral-woods"),
    ]),
    ("Rocks", "rocks", [
        ("Seiyur Rock", "seiyur-rock"),
        ("Dragon Stone", "dragon-stone"),
    ]),
    ("Aquarium Filters", "aquarium-filters", [
        ("Sponge Filter", "sponge-filter"),
        ("Canister Filter", "canister-filter"),
        ("Top Filter", "top-filter"),
        ("Hang On Filter", "hang-on-filter"),
    ]),
]


async def run_seed() -> list[str]:
    """Idempotent — inserts only missing categories. Safe to call on every startup."""
    created: list[str] = []
    for main_name, main_slug, subs in SEED_TREE:
        existing = await Category.find_one({"slug": main_slug})
        if not existing:
            existing = Category(name=main_name, slug=main_slug)
            await existing.insert()
            created.append(main_slug)
        parent_id = str(existing.id)
        for sub_name, sub_slug in subs:
            if not await Category.find_one({"slug": sub_slug}):
                sub = Category(name=sub_name, slug=sub_slug, parent_id=parent_id)
                await sub.insert()
                created.append(sub_slug)
    return created


@router.post("/seed", status_code=201)
async def seed_categories(_=Depends(get_current_admin)):
    created = await run_seed()
    return {"created": created}
