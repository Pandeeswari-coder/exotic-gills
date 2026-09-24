import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export type MsgSender = 'owner' | 'customer';
export type MsgType = 'text' | 'image' | 'video' | 'catalog';

export interface ChatMsg {
  id: string;
  sender: MsgSender;
  type: MsgType;
  text?: string;
  mediaUrl?: string;
  videoUrl?: string;
  productIds?: string[];
  timestamp: string;
  read: boolean;
}

export type SendPayload = Omit<ChatMsg, 'id' | 'timestamp' | 'read'>;

interface ChatCtx {
  messages: ChatMsg[];
  customerUnread: number;
  ownerUnread: number;
  connected: boolean;
  sendMessage: (p: SendPayload) => void;
  editMessage: (messageId: string, text: string) => void;
  markCustomerRead: () => void;
  markOwnerRead: () => void;
}

const ChatContext = createContext<ChatCtx | null>(null);

function fromServer(raw: Record<string, unknown>): ChatMsg {
  return {
    id: raw.id as string,
    sender: raw.sender as MsgSender,
    type: raw.type as MsgType,
    text: raw.text as string | undefined,
    mediaUrl: raw.media_url as string | undefined,
    videoUrl: raw.video_url as string | undefined,
    productIds: raw.product_ids as string[] | undefined,
    timestamp: raw.timestamp as string,
    read: raw.read as boolean,
  };
}

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  sessionId: string;
  customerName?: string;
}> = ({ children, sessionId, customerName }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep customerName in a ref so changing it doesn't re-trigger the connect effect
  const customerNameRef = useRef(customerName);
  useEffect(() => { customerNameRef.current = customerName; }, [customerName]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const name = customerNameRef.current;
    const params = name ? `?customer_name=${encodeURIComponent(name)}` : '';
    const ws = new WebSocket(`${WS_BASE}/chat/ws/customer/${sessionId}${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Reload history to catch any messages missed during disconnection
      fetch(`${API_BASE}/chat/history/${sessionId}`)
        .then(r => r.json())
        .then((raw: Record<string, unknown>[]) => setMessages(raw.map(fromServer)))
        .catch(() => {});
      // Heartbeat: keep connection alive every 25s (prevents Render idle timeout)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    ws.onmessage = (e) => {
      const raw = JSON.parse(e.data);
      if (raw.action === 'edit') {
        const updated = fromServer(raw);
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, text: updated.text } : m));
        return;
      }
      const msg = fromServer(raw);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    ws.onclose = () => {
      setConnected(false);
      if (heartbeatTimer.current) { clearInterval(heartbeatTimer.current); heartbeatTimer.current = null; }
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [sessionId]);

  // Load history then connect WS
  useEffect(() => {
    setMessages([]);
    fetch(`${API_BASE}/chat/history/${sessionId}`)
      .then(r => r.json())
      .then((raw: Record<string, unknown>[]) => setMessages(raw.map(fromServer)))
      .catch(() => {});

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [sessionId, connect]);

  const sendMessage = useCallback((payload: SendPayload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: payload.type,
      text: payload.text,
      media_url: payload.mediaUrl,
      video_url: payload.videoUrl,
      product_ids: payload.productIds,
    }));
  }, []);

  const editMessage = useCallback((messageId: string, text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'edit', message_id: messageId, text }));
  }, []);

  const markCustomerRead = useCallback(() => {
    setMessages(prev => prev.map(m => m.sender === 'owner' ? { ...m, read: true } : m));
  }, []);

  const markOwnerRead = useCallback(() => {
    setMessages(prev => prev.map(m => m.sender === 'customer' ? { ...m, read: true } : m));
  }, []);

  const customerUnread = messages.filter(m => m.sender === 'owner' && !m.read).length;
  const ownerUnread    = messages.filter(m => m.sender === 'customer' && !m.read).length;

  return (
    <ChatContext.Provider value={{ messages, customerUnread, ownerUnread, connected, sendMessage, editMessage, markCustomerRead, markOwnerRead }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
};
