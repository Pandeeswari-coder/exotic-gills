from datetime import timedelta

from fastapi import APIRouter, HTTPException, status

from auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, hash_password, verify_password
from models import User
from schemas import AuthResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.full_name,
        is_admin=user.is_admin,
        created_at=user.created_at,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    if await User.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    await user.insert()

    token = create_access_token(
        {"sub": str(user.id)},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(access_token=token, user=user_to_response(user))


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await User.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(
        {"sub": str(user.id)},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(access_token=token, user=user_to_response(user))
