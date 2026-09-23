import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type MsgSender = 'owner' | 'customer';
export type MsgType = 'text' | 'image' | 'video' | 'catalog';

export interface ChatMsg {
  id: string;
  sender: MsgSender;
  type: MsgType;
  text?: string;
  mediaUrl?: string;    // base64 data URL for images
  videoUrl?: string;    // YouTube / video URL
  productIds?: number[]; // for catalog messages
  timestamp: string;
  read: boolean;
}

export type SendPayload = Omit<ChatMsg, 'id' | 'timestamp' | 'read'>;

interface ChatCtx {
  messages: ChatMsg[];
  customerUnread: number; // owner→customer unread (badge on chat widget)
  ownerUnread: number;    // customer→owner unread (badge on admin)
  sendMessage: (p: SendPayload) => void;
  deleteMessage: (id: string) => void;
  markCustomerRead: () => void;
  markOwnerRead: () => void;
  clearChat: () => void;
}

const STORE_KEY = 'egf_chat';
const ChatContext = createContext<ChatCtx | null>(null);

let bc: BroadcastChannel | null = null;
try { bc = new BroadcastChannel('egf_chat_sync'); } catch { /* not supported */ }

const load = (): ChatMsg[] => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
};

const save = (msgs: ChatMsg[]) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(msgs)); } catch { /* full */ }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMsg[]>(load);

  useEffect(() => {
    if (!bc) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'SYNC') setMessages(e.data.msgs);
    };
    bc.addEventListener('message', onMsg);
    return () => bc?.removeEventListener('message', onMsg);
  }, []);

  const sync = (msgs: ChatMsg[]) => {
    save(msgs);
    bc?.postMessage({ type: 'SYNC', msgs });
  };

  const sendMessage = useCallback((payload: SendPayload) => {
    const msg: ChatMsg = {
      ...payload,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => { const n = [...prev, msg]; sync(n); return n; });
  }, []);

  const markCustomerRead = useCallback(() => {
    setMessages(prev => {
      const n = prev.map(m => m.sender === 'owner' ? { ...m, read: true } : m);
      sync(n); return n;
    });
  }, []);

  const markOwnerRead = useCallback(() => {
    setMessages(prev => {
      const n = prev.map(m => m.sender === 'customer' ? { ...m, read: true } : m);
      sync(n); return n;
    });
  }, []);

  const clearChat = useCallback(() => { setMessages([]); sync([]); }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => { const n = prev.filter(m => m.id !== id); sync(n); return n; });
  }, []);

  const customerUnread = messages.filter(m => m.sender === 'owner' && !m.read).length;
  const ownerUnread    = messages.filter(m => m.sender === 'customer' && !m.read).length;

  return (
    <ChatContext.Provider value={{ messages, customerUnread, ownerUnread, sendMessage, deleteMessage, markCustomerRead, markOwnerRead, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
};
