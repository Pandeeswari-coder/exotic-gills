import hashlib
import hmac
import os
from typing import List

import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from models import Order, OrderItemDoc, Product
from schemas import (
    OrderCreate,
    OrderItemResponse,
    OrderResponse,
    PaymentVerify,
    RazorpayOrderResponse,
)

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

router = APIRouter(prefix="/orders", tags=["orders"])


def order_to_response(o: Order) -> OrderResponse:
    return OrderResponse(
        id=str(o.id),
        user_id=o.user_id,
        total_amount=o.total_amount,
        status=o.status,
        razorpay_order_id=o.razorpay_order_id,
        razorpay_payment_id=o.razorpay_payment_id,
        created_at=o.created_at,
        items=[
            OrderItemResponse(
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                price=item.price,
                image_url=item.image_url,
            )
            for item in o.items
        ],
    )


@router.post("/create", response_model=RazorpayOrderResponse, status_code=201)
async def create_order(data: OrderCreate, current_user=Depends(get_current_user)):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    total_amount = 0.0
    order_items: List[OrderItemDoc] = []

    for item in data.items:
        product = await Product.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if not product.is_available:
            raise HTTPException(status_code=400, detail=f"'{product.name}' is not available")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}",
            )
        total_amount += product.price * item.quantity
        order_items.append(OrderItemDoc(
            product_id=str(product.id),
            product_name=product.name,
            quantity=item.quantity,
            price=product.price,
            image_url=product.image_url,
        ))

    rz_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    amount_paise = int(round(total_amount * 100))
    try:
        rz_order = rz_client.order.create({"amount": amount_paise, "currency": "INR", "payment_capture": 1})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {e}")

    # Deduct stock
    for item in data.items:
        product = await Product.get(item.product_id)
        if product:
            product.stock -= item.quantity
            await product.save()

    order = Order(
        user_id=str(current_user.id),
        items=order_items,
        total_amount=total_amount,
        status="pending",
        razorpay_order_id=rz_order["id"],
    )
    await order.insert()

    return RazorpayOrderResponse(
        razorpay_order_id=rz_order["id"],
        amount=amount_paise,
        currency="INR",
        order_id=str(order.id),
        key_id=RAZORPAY_KEY_ID,
    )


@router.post("/verify", response_model=OrderResponse)
async def verify_payment(data: PaymentVerify, current_user=Depends(get_current_user)):
    order = await Order.find_one({
        "razorpay_order_id": data.razorpay_order_id,
        "user_id": str(current_user.id),
    })
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    order.status = "paid"
    order.razorpay_payment_id = data.razorpay_payment_id
    await order.save()
    return order_to_response(order)


@router.get("/my-orders", response_model=List[OrderResponse])
async def my_orders(current_user=Depends(get_current_user)):
    orders = await Order.find({"user_id": str(current_user.id)}).sort("-created_at").to_list()
    return [order_to_response(o) for o in orders]
