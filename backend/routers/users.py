from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user, hash_password
from models import User
from schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.full_name,
        is_admin=user.is_admin,
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, current_user: User = Depends(get_current_user)):
    update = data.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="No fields provided")

    if "password" in update:
        current_user.hashed_password = hash_password(update.pop("password"))
    for k, v in update.items():
        setattr(current_user, k, v)

    await current_user.save()
    return user_to_response(current_user)
