import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  chatKey,
  syncChannelName,
  upsertSession,
  getSessionMsgs,
  saveSessionMsgs,
} from '../services/chatStore';

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
  sendMessage: (p: SendPayload) => void;
  deleteMessage: (id: string) => void;
  editMessage: (id: string, newText: string) => void;
  markCustomerRead: () => void;
  markOwnerRead: () => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatCtx | null>(null);
const TAB_ID = Math.random().toString(36).slice(2);

export const ChatProvider: React.FC<{ children: React.ReactNode; sessionId: string; customerName?: string }> = ({ children, sessionId, customerName }) => {
  const [messages, setMessages] = useState<ChatMsg[]>(() => getSessionMsgs(sessionId));
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    bcRef.current?.close();
    try {
      const bc = new BroadcastChannel(syncChannelName(sessionId));
      bc.onmessage = (e) => {
        if (e.data?.type === 'SYNC' && e.data.tabId !== TAB_ID) {
          setMessages(e.data.msgs);
        }
      };
      bcRef.current = bc;
    } catch { /* BroadcastChannel not supported */ }
    setMessages(getSessionMsgs(sessionId));
    return () => { bcRef.current?.close(); };
  }, [sessionId]);

  const sync = useCallback((msgs: ChatMsg[]) => {
    saveSessionMsgs(sessionId, msgs);
    bcRef.current?.postMessage({ type: 'SYNC', msgs, tabId: TAB_ID });
  }, [sessionId]);

  const sendMessage = useCallback((payload: SendPayload) => {
    const msg: ChatMsg = {
      ...payload,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => {
      const n = [...prev, msg];
      sync(n);
      if (payload.sender === 'customer') {
        upsertSession(sessionId, {
          name: customerName,
          lastMessage: payload.text ?? '[media]',
          lastAt: new Date().toISOString(),
          unread: n.filter(m => m.sender === 'customer' && !m.read).length,
        });
      }
      return n;
    });
  }, [sync, sessionId]);

  const markCustomerRead = useCallback(() => {
    setMessages(prev => {
      if (!prev.some(m => m.sender === 'owner' && !m.read)) return prev;
      const n = prev.map(m => m.sender === 'owner' ? { ...m, read: true } : m);
      sync(n); return n;
    });
  }, [sync]);

  const markOwnerRead = useCallback(() => {
    setMessages(prev => {
      if (!prev.some(m => m.sender === 'customer' && !m.read)) return prev;
      const n = prev.map(m => m.sender === 'customer' ? { ...m, read: true } : m);
      sync(n); return n;
    });
  }, [sync]);

  const clearChat = useCallback(() => { setMessages([]); sync([]); }, [sync]);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => { const n = prev.filter(m => m.id !== id); sync(n); return n; });
  }, [sync]);

  const editMessage = useCallback((id: string, newText: string) => {
    setMessages(prev => {
      const n = prev.map(m => m.id === id ? { ...m, text: newText } : m);
      sync(n); return n;
    });
  }, [sync]);

  const customerUnread = messages.filter(m => m.sender === 'owner' && !m.read).length;
  const ownerUnread    = messages.filter(m => m.sender === 'customer' && !m.read).length;

  return (
    <ChatContext.Provider value={{ messages, customerUnread, ownerUnread, sendMessage, deleteMessage, editMessage, markCustomerRead, markOwnerRead, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be inside ChatProvider');
  return ctx;
};

// Kept for localStorage key access compatibility (e.g. old data migration)
export const LEGACY_STORE_KEY = 'egf_chat';
