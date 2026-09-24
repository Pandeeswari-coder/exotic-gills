import json
import os
from datetime import datetime
from typing import Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Body, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from auth import get_current_admin
from models import ChatMessage, ChatSession, PushSubscription, User

router = APIRouter(prefix="/chat", tags=["chat"])

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY  = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_EMAIL       = os.getenv("VAPID_EMAIL", "mailto:admin@exoticgills.com")


async def _send_push(title: str, body: str, url: str = "/admin") -> None:
    """Fire-and-forget push to all stored admin subscriptions."""
    if not VAPID_PRIVATE_KEY:
        return
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return
    subs = await PushSubscription.find().to_list()
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps({"title": title, "body": body, "url": url}),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_EMAIL},
            )
        except Exception:
            pass  # stale subscription — ignore


# ── WebSocket connection manager ──────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.customers: Dict[str, List[WebSocket]] = {}  # session_id -> [ws]
        self.admins: List[WebSocket] = []

    async def connect_customer(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self.customers.setdefault(session_id, []).append(ws)

    def disconnect_customer(self, session_id: str, ws: WebSocket):
        conns = self.customers.get(session_id, [])
        if ws in conns:
            conns.remove(ws)

    async def connect_admin(self, ws: WebSocket):
        await ws.accept()
        self.admins.append(ws)

    def disconnect_admin(self, ws: WebSocket):
        if ws in self.admins:
            self.admins.remove(ws)

    async def broadcast(self, session_id: str, data: dict):
        for ws in list(self.customers.get(session_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_customer(session_id, ws)
        for ws in list(self.admins):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_admin(ws)


manager = ConnectionManager()


def _msg_out(msg: ChatMessage) -> dict:
    return {
        "id": str(msg.id),
        "session_id": msg.session_id,
        "sender": msg.sender,
        "type": msg.type,
        "text": msg.text,
        "media_url": msg.media_url,
        "video_url": msg.video_url,
        "product_ids": msg.product_ids,
        "timestamp": msg.timestamp.isoformat(),
        "read": msg.read,
    }


# ── Customer WebSocket ────────────────────────────────────────────────────────

@router.websocket("/ws/customer/{session_id}")
async def customer_ws(
    ws: WebSocket,
    session_id: str,
    customer_name: Optional[str] = Query(None),
):
    await manager.connect_customer(session_id, ws)
    # Upsert session record
    session = await ChatSession.find_one(ChatSession.session_id == session_id)
    if not session:
        session = ChatSession(
            session_id=session_id,
            customer_name=customer_name,
        )
        await session.insert()
    elif customer_name and not session.customer_name:
        session.customer_name = customer_name
        await session.save()

    try:
        while True:
            data = await ws.receive_json()
            msg = ChatMessage(
                session_id=session_id,
                sender="customer",
                type=data.get("type", "text"),
                text=data.get("text"),
                media_url=data.get("media_url"),
                video_url=data.get("video_url"),
                product_ids=data.get("product_ids"),
            )
            await msg.insert()

            # Update session meta
            session.last_message = msg.text or "[media]"
            session.last_at = datetime.utcnow()
            session.unread += 1
            await session.save()

            await manager.broadcast(session_id, _msg_out(msg))

            # Push notification to admin mobile/desktop devices
            sender_label = session.customer_name or f"Customer #{session_id[-4:]}"
            push_body = msg.text or ("📷 Sent an image" if msg.type == "image" else "🎬 Sent a video" if msg.type == "video" else "💬 New message")
            await _send_push(title=sender_label, body=push_body)
    except WebSocketDisconnect:
        manager.disconnect_customer(session_id, ws)


# ── Admin WebSocket ───────────────────────────────────────────────────────────

@router.websocket("/ws/admin")
async def admin_ws(ws: WebSocket, token: str = Query(...)):
    from jose import jwt, JWTError
    import os
    SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await ws.accept()
            await ws.close(code=4001)
            return
        user = await User.get(PydanticObjectId(user_id))
        if not user or not user.is_admin:
            await ws.accept()
            await ws.close(code=4003)
            return
    except (JWTError, Exception):
        await ws.accept()
        await ws.close(code=4001)
        return

    await manager.connect_admin(ws)
    try:
        while True:
            data = await ws.receive_json()
            session_id = data.get("session_id")
            if not session_id:
                continue
            msg = ChatMessage(
                session_id=session_id,
                sender="owner",
                type=data.get("type", "text"),
                text=data.get("text"),
                media_url=data.get("media_url"),
                video_url=data.get("video_url"),
                product_ids=data.get("product_ids"),
            )
            await msg.insert()

            # Mark customer messages read in this session
            await ChatMessage.find(
                ChatMessage.session_id == session_id,
                ChatMessage.sender == "customer",
                ChatMessage.read == False,
            ).update({"$set": {"read": True}})

            session = await ChatSession.find_one(ChatSession.session_id == session_id)
            if session:
                session.unread = 0
                await session.save()

            await manager.broadcast(session_id, _msg_out(msg))
    except WebSocketDisconnect:
        manager.disconnect_admin(ws)


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/sessions")
async def list_sessions(_: User = Depends(get_current_admin)):
    sessions = await ChatSession.find().sort("-last_at").to_list()
    return [
        {
            "id": s.session_id,
            "name": s.customer_name,
            "last_message": s.last_message,
            "last_at": s.last_at.isoformat(),
            "unread": s.unread,
            "started_at": s.started_at.isoformat(),
        }
        for s in sessions
    ]


@router.get("/history/{session_id}")
async def get_history(session_id: str, limit: int = 100):
    msgs = await ChatMessage.find(
        ChatMessage.session_id == session_id
    ).sort("+timestamp").limit(limit).to_list()
    return [_msg_out(m) for m in msgs]


@router.patch("/read/{session_id}")
async def mark_read(session_id: str, _: User = Depends(get_current_admin)):
    await ChatMessage.find(
        ChatMessage.session_id == session_id,
        ChatMessage.sender == "customer",
        ChatMessage.read == False,
    ).update({"$set": {"read": True}})
    session = await ChatSession.find_one(ChatSession.session_id == session_id)
    if session:
        session.unread = 0
        await session.save()
    return {"ok": True}


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}


class PushSubBody(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.post("/push-subscribe", status_code=201)
async def push_subscribe(body: PushSubBody, _: User = Depends(get_current_admin)):
    existing = await PushSubscription.find_one({"endpoint": body.endpoint})
    if not existing:
        await PushSubscription(endpoint=body.endpoint, p256dh=body.p256dh, auth=body.auth).insert()
    return {"ok": True}


@router.delete("/push-unsubscribe", status_code=200)
async def push_unsubscribe(body: PushSubBody, _: User = Depends(get_current_admin)):
    sub = await PushSubscription.find_one({"endpoint": body.endpoint})
    if sub:
        await sub.delete()
    return {"ok": True}


@router.delete("/messages/{session_id}", status_code=200)
async def clear_messages(session_id: str, _: User = Depends(get_current_admin)):
    """Delete all messages in a session but keep the session record."""
    await ChatMessage.find(ChatMessage.session_id == session_id).delete()
    session = await ChatSession.find_one(ChatSession.session_id == session_id)
    if session:
        session.last_message = ""
        session.unread = 0
        await session.save()
    return {"ok": True}


@router.delete("/session/{session_id}", status_code=200)
async def delete_session(session_id: str, _: User = Depends(get_current_admin)):
    """Delete a session and all its messages."""
    await ChatMessage.find(ChatMessage.session_id == session_id).delete()
    session = await ChatSession.find_one(ChatSession.session_id == session_id)
    if session:
        await session.delete()
    return {"ok": True}
