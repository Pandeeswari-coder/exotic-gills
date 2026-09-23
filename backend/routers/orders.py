import hashlib
import hmac
import os
from typing import List

import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import Order, OrderItem, Product, User
from schemas import (
    OrderCreate,
    OrderResponse,
    PaymentVerify,
    RazorpayOrderResponse,
)

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

router = APIRouter(prefix="/orders", tags=["orders"])


def get_razorpay_client() -> razorpay.Client:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured",
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@router.post("/create", response_model=RazorpayOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate products and compute total
    total_amount = 0.0
    resolved_items = []

    for item in data.items:
        result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found",
            )
        if not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is not available",
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}",
            )
        line_total = product.price * item.quantity
        total_amount += line_total
        resolved_items.append({"product": product, "quantity": item.quantity, "price": product.price})

    # Create Razorpay order (amount in paise)
    rz_client = get_razorpay_client()
    amount_in_paise = int(round(total_amount * 100))
    try:
        rz_order = rz_client.order.create(
            {
                "amount": amount_in_paise,
                "currency": "INR",
                "payment_capture": 1,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay order creation failed: {str(exc)}",
        )

    # Persist order record
    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending",
        razorpay_order_id=rz_order["id"],
    )
    db.add(order)
    await db.flush()  # get order.id without committing

    for ri in resolved_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=ri["product"].id,
            quantity=ri["quantity"],
            price=ri["price"],
        )
        db.add(order_item)
        # Deduct stock
        ri["product"].stock -= ri["quantity"]

    await db.commit()
    await db.refresh(order)

    return RazorpayOrderResponse(
        razorpay_order_id=rz_order["id"],
        amount=amount_in_paise,
        currency="INR",
        order_id=order.id,
        key_id=RAZORPAY_KEY_ID,
    )


@router.post("/verify", response_model=OrderResponse)
async def verify_payment(
    data: PaymentVerify,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch order
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category))
        .where(
            Order.razorpay_order_id == data.razorpay_order_id,
            Order.user_id == current_user.id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already paid")

    # Verify HMAC signature
    message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_signature = hmac.new(
        key=RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, data.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature",
        )

    order.status = "paid"
    order.razorpay_payment_id = data.razorpay_payment_id
    await db.commit()
    await db.refresh(order)

    return order


@router.get("/my-orders", response_model=List[OrderResponse])
async def my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.category))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()
