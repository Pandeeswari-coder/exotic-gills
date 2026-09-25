import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProducts } from '../../services/api';
import type { Product } from '../../types';
import type { ChatMsg, SendPayload } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import './AdminChat.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

type AttachMode = null | 'image' | 'video' | 'catalog';

interface SessionMeta {
  id: string;
  name?: string;
  last_message: string;
  last_at: string;
  unread: number;
  started_at: string;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fmtSessionTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 172_800_000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function fromServer(raw: Record<string, unknown>): ChatMsg {
  return {
    id: raw.id as string,
    sender: raw.sender as 'owner' | 'customer',
    type: raw.type as ChatMsg['type'],
    text: raw.text as string | undefined,
    mediaUrl: raw.media_url as string | undefined,
    videoUrl: raw.video_url as string | undefined,
    productIds: raw.product_ids as string[] | undefined,
    timestamp: raw.timestamp as string,
    read: raw.read as boolean,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

const AdminChat: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  /* ── Auth gate (uses real admin login) ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    try {
      const loggedIn = await login(loginEmail, loginPw);
      if (!loggedIn.is_admin) {
        setLoginErr('This account does not have admin privileges.');
      }
    } catch {
      setLoginErr('Incorrect email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const authed = !!(user?.is_admin && token);

  /* ── Sessions ── */
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [selectedSid, setSelectedSid] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setSessions(await r.json());
    } catch { /* network */ }
  }, [token]);

  /* ── Messages for selected session ── */
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const loadHistory = useCallback(async (sid: string) => {
    try {
      const r = await fetch(`${API_BASE}/chat/history/${sid}`);
      if (r.ok) {
        const raw: Record<string, unknown>[] = await r.json();
        setMessages(raw.map(fromServer));
      }
    } catch { /* network */ }
  }, []);

  /* ── Admin WebSocket ── */
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionsRef = useRef<SessionMeta[]>([]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  const selectedSidRef = useRef<string | null>(null);
  useEffect(() => { selectedSidRef.current = selectedSid; }, [selectedSid]);

  const connectAdminWs = useCallback(() => {
    if (!token) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    const ws = new WebSocket(`${WS_BASE}/chat/ws/admin?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const raw = JSON.parse(e.data);

      // Handle edits
      if (raw.action === 'edit') {
        const updated = fromServer(raw);
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, text: updated.text } : m));
        return;
      }

      const msg = fromServer(raw);
      const incomingSid = raw.session_id as string;

      // Only add to visible messages if it belongs to the selected session
      if (incomingSid === selectedSidRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Refresh session list to update unread counts / last message
      loadSessions();

      // Browser notification for incoming customer messages
      if (msg.sender === 'customer' && 'Notification' in window && Notification.permission === 'granted') {
        const sid = (raw.session_id as string) ?? '';
        const senderName = sessionsRef.current.find(s => s.id === sid)?.name ?? `Customer #${sid.slice(-4)}`;
        const body = msg.type === 'text' && msg.text
          ? msg.text
          : msg.type === 'image' ? '📷 Sent an image'
          : msg.type === 'video' ? '🎬 Sent a video'
          : '💬 New message';
        const n = new Notification(`${senderName}`, {
          body,
          icon: '/fish-icon.png',
          tag: sid,         // collapses multiple messages from same session
        });
        n.onclick = () => {
          window.focus();
          setSelectedSid(sid);
          loadHistory(sid);
        };
      }
    };

    ws.onopen = () => {
      // Reload history for selected session to catch missed messages
      if (selectedSidRef.current) loadHistory(selectedSidRef.current);
      // Heartbeat: keep connection alive every 25s (prevents Render idle timeout)
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    ws.onclose = () => {
      if (heartbeatTimer.current) { clearInterval(heartbeatTimer.current); heartbeatTimer.current = null; }
      reconnectTimer.current = setTimeout(connectAdminWs, 3000);
    };
    ws.onerror = () => ws.close();
  }, [token, loadSessions, loadHistory]);

  // Register service worker + subscribe to Web Push once admin is authenticated
  useEffect(() => {
    if (!authed || !token) return;

    const setupPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      // Fetch VAPID public key
      const keyRes = await fetch(`${API_BASE}/chat/vapid-public-key`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) return; // VAPID not configured on server

      // Register SW
      const reg = await navigator.serviceWorker.register('/sw.js');

      // Request permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as Uint8Array<ArrayBuffer>,
      });

      const json = sub.toJSON();
      await fetch(`${API_BASE}/chat/push-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: (json.keys as Record<string, string>).p256dh,
          auth: (json.keys as Record<string, string>).auth,
        }),
      });
    };

    setupPush().catch(() => {});
  }, [authed, token]);

  useEffect(() => {
    if (!authed) return;
    loadSessions();
    connectAdminWs();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [authed, loadSessions, connectAdminWs]);

  /* ── Session selection ── */
  const selectSession = useCallback(async (sid: string) => {
    setSelectedSid(sid);
    setEditingId(null);
    await loadHistory(sid);
    // Mark as read on server
    if (token) {
      fetch(`${API_BASE}/chat/read/${sid}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => loadSessions()).catch(() => {});
    }
  }, [loadHistory, token, loadSessions]);

  /* ── Clear messages in session ── */
  const clearChat = useCallback(async () => {
    if (!selectedSid || !token) return;
    if (!window.confirm('Clear all messages in this conversation?')) return;
    await fetch(`${API_BASE}/chat/messages/${selectedSid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages([]);
    loadSessions();
  }, [selectedSid, token, loadSessions]);

  /* ── Delete whole session ── */
  const deleteSession = useCallback(async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm('Delete this conversation and all its messages?')) return;
    await fetch(`${API_BASE}/chat/session/${sid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSessions(prev => prev.filter(s => s.id !== sid));
    if (selectedSid === sid) { setSelectedSid(null); setMessages([]); }
  }, [token, selectedSid]);

  /* ── Edit ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  /* ── Input / attach ── */
  const [input, setInput] = useState('');
  const [attachMode, setAttachMode] = useState<AttachMode>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [catalogNote, setCatalogNote] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  useEffect(() => {
    if (authed) getProducts().then(setProducts).catch(() => {});
  }, [authed]);

  /* ── Scroll ── */
  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (isAtBottom.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedSid) return;
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      isAtBottom.current = true;
    }, 100);
  }, [selectedSid]);

  /* ── Title badge ── */
  const totalUnread = sessions.reduce((sum, s) => sum + s.unread, 0);
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) Admin Chat` : 'Admin Chat';
    return () => { document.title = 'Exotic Gills and Fins'; };
  }, [totalUnread]);

  const sessionLabel = (sid: string) => {
    const s = sessions.find(x => x.id === sid);
    return s?.name ?? `Customer #${sid.slice(-4)}`;
  };

  /* ── Send via WebSocket ── */
  const doSend = useCallback((payload: SendPayload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !selectedSid) return;
    ws.send(JSON.stringify({
      session_id: selectedSid,
      type: payload.type,
      text: payload.text,
      media_url: payload.mediaUrl,
      video_url: payload.videoUrl,
      product_ids: payload.productIds,
    }));
  }, [selectedSid]);

  /* ── Text send ── */
  const sendText = () => {
    const text = input.trim();
    if (!text || !selectedSid) return;
    doSend({ sender: 'owner', type: 'text', text });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  /* ── Image attach ── */
  const openImagePicker = () => { setAttachMode('image'); fileRef.current?.click(); };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendImage = () => {
    if (!imagePreview) return;
    doSend({ sender: 'owner', type: 'image', mediaUrl: imagePreview, text: imageCaption || undefined });
    setImagePreview(null); setImageCaption(''); setAttachMode(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Video attach ── */
  const onVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('Video must be under 50 MB.'); e.target.value = ''; return; }
    setVideoUrl(URL.createObjectURL(file));
  };

  const sendVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    doSend({ sender: 'owner', type: 'video', videoUrl: url, text: videoCaption || undefined });
    setVideoUrl(''); setVideoCaption(''); setAttachMode(null);
    if (videoFileRef.current) videoFileRef.current.value = '';
  };

  /* ── Catalog ── */
  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const sendCatalog = () => {
    if (selectedProductIds.length === 0) return;
    doSend({ sender: 'owner', type: 'catalog', productIds: selectedProductIds, text: catalogNote || undefined });
    setSelectedProductIds([]); setCatalogNote(''); setAttachMode(null);
  };

  const getImgSrc = (p: Product) => {
    if (!p.image) return '/placeholder-fish.svg';
    return (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : `${API_BASE}${p.image}`;
  };

  const resolveProducts = (ids: string[]) =>
    ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];

  /* ── Password / auth gate ── */
  if (!authed) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <div className="admin-gate__icon">🐠</div>
          <h2>Owner Admin Panel</h2>
          <p>Sign in with your admin account to continue.</p>
          <form onSubmit={handleLogin} className="admin-gate__form">
            <input
              type="email"
              placeholder="Admin Email"
              value={loginEmail}
              onChange={e => { setLoginEmail(e.target.value); setLoginErr(''); }}
              autoFocus
              className="admin-gate__input"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPw}
              onChange={e => { setLoginPw(e.target.value); setLoginErr(''); }}
              className={loginErr ? 'admin-gate__input admin-gate__input--error' : 'admin-gate__input'}
            />
            {loginErr && <p className="admin-gate__error">{loginErr}</p>}
            <button type="submit" className="admin-gate__btn" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : 'Enter Admin Panel'}
            </button>
          </form>
          <button className="admin-gate__back" onClick={() => navigate(-1)}>
            ← Back to Site
          </button>
        </div>
      </div>
    );
  }

  /* ── Main admin UI ── */
  return (
    <div className="admin-chat">
      <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
      <input ref={videoFileRef} type="file" accept="video/*" onChange={onVideoFileChange} style={{ display: 'none' }} />

      {/* Mobile top nav */}
      <div className="ap-mobile-nav">
        <Link to="/admin" className="ap-mobile-nav__link ap-mobile-nav__link--active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat
          {totalUnread > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50px', fontSize: '0.65rem', padding: '0 5px', fontWeight: 700 }}>{totalUnread}</span>}
        </Link>
        <Link to="/admin/products" className="ap-mobile-nav__link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Fish
        </Link>
        <button className="ap-mobile-nav__exit" onClick={() => navigate('/')}>← Exit</button>
      </div>

      {/* ── Sidebar ── */}
      <aside className="admin-chat__sidebar">
        <div className="admin-chat__sidebar-header">
          <span>🐠</span>
          <div>
            <strong>Exotic Gills and Fins</strong>
            <p>Owner Panel</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,201,167,0.1)' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,201,167,0.1)', borderLeft: '3px solid var(--primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Customer Chat
          </Link>
          <Link to="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            Manage Items
          </Link>
        </nav>

        <div className="admin-chat__sessions-label">
          Conversations
          {totalUnread > 0 && <span className="admin-chat__total-badge">{totalUnread}</span>}
        </div>

        <div className="admin-chat__sessions-list">
          {sessions.length === 0 ? (
            <div className="admin-chat__no-sessions">
              <span>💬</span>
              <p>No conversations yet.<br />Waiting for customers…</p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className={`admin-chat__conv-item${selectedSid === s.id ? ' admin-chat__conv-item--active' : ''}`}
                onClick={() => selectSession(s.id)}
              >
                <div className="admin-chat__conv-avatar">👤</div>
                <div className="admin-chat__conv-info">
                  <strong>{sessionLabel(s.id)}</strong>
                  <p>{s.last_message || 'Started a chat'}</p>
                </div>
                <div className="admin-chat__conv-meta">
                  <span className="admin-chat__conv-time">{fmtSessionTime(s.last_at)}</span>
                  {s.unread > 0 && <span className="admin-chat__unread-badge">{s.unread}</span>}
                  <button
                    className="admin-chat__conv-delete"
                    onClick={e => deleteSession(s.id, e)}
                    title="Delete conversation"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          className="admin-chat__logout-btn"
          onClick={() => navigate('/')}
        >
          ← Exit to Site
        </button>
      </aside>

      {/* ── Main chat area ── */}
      <div className="admin-chat__main">
        {!selectedSid ? (
          <div className="admin-chat__no-selection">
            <span>💬</span>
            <p>{sessions.length === 0 ? 'Waiting for customers to start a chat…' : 'Select a conversation from the left'}</p>
          </div>
        ) : (
          <>
            <div className="admin-chat__main-header">
              <button className="admin-chat__back-btn" onClick={() => navigate('/')} title="Back to site">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Site
              </button>
              <div className="admin-chat__main-header-info">
                <strong>{sessionLabel(selectedSid)}</strong>
                <span>{messages.filter(m => m.sender === 'customer').length} customer messages</span>
              </div>
              <button className="admin-chat__clear-btn" onClick={clearChat} title="Clear all messages">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
                Clear Chat
              </button>
            </div>

            <div className="admin-chat__messages" ref={messagesRef} onScroll={handleMessagesScroll}>
              {messages.length === 0 && (
                <div className="admin-chat__empty">
                  <span>💬</span>
                  <p>No messages yet. Waiting for customer…</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`admin-msg admin-msg--${msg.sender}`}>
                  <div className="admin-msg__avatar">{msg.sender === 'owner' ? '🐠' : '👤'}</div>
                  <div className="admin-msg__wrap">
                    <span className="admin-msg__label">
                      {msg.sender === 'owner' ? 'You (Owner)' : sessionLabel(selectedSid)}
                    </span>

                    {msg.type === 'text' && msg.text && (
                      <div className="admin-msg__bubble">
                        {editingId === msg.id ? (
                          <div className="admin-msg__edit-wrap">
                            <input
                              className="admin-msg__edit-input"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && editText.trim()) {
                                  const ws = wsRef.current;
                                  if (ws && ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'edit', message_id: editingId, text: editText.trim(), session_id: selectedSid }));
                                  }
                                  setEditingId(null);
                                }
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                            />
                            <div className="admin-msg__edit-actions">
                              <button onClick={() => {
                                if (editText.trim()) {
                                  const ws = wsRef.current;
                                  if (ws && ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'edit', message_id: editingId, text: editText.trim(), session_id: selectedSid }));
                                  }
                                }
                                setEditingId(null);
                              }}>Save</button>
                              <button onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="admin-msg__text-wrap">
                            <p>{msg.text}</p>
                            {msg.sender === 'owner' && (
                              <button
                                className="admin-msg__edit-trigger"
                                onClick={() => { setEditingId(msg.id); setEditText(msg.text || ''); }}
                                title="Edit"
                              >✏️</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="admin-msg__bubble admin-msg__bubble--media">
                        <img src={msg.mediaUrl} alt="Sent" className="admin-msg__img" />
                        {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                      </div>
                    )}

                    {msg.type === 'video' && msg.videoUrl && (
                      <div className="admin-msg__bubble admin-msg__bubble--media">
                        <div className="admin-msg__video-chip">
                          <span>🎬</span>
                          <a href={msg.videoUrl} target="_blank" rel="noopener noreferrer">
                            {msg.videoUrl.startsWith('blob:') ? 'Video File (click to watch)' : msg.videoUrl.length > 40 ? msg.videoUrl.slice(0, 40) + '…' : msg.videoUrl}
                          </a>
                        </div>
                        {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                      </div>
                    )}

                    {msg.type === 'catalog' && msg.productIds && (
                      <div className="admin-msg__bubble admin-msg__bubble--catalog">
                        <p className="admin-msg__catalog-label">📦 Fish catalog shared</p>
                        {resolveProducts(msg.productIds).map(p => (
                          <span key={p.id} className="admin-msg__catalog-tag">{p.name}</span>
                        ))}
                        {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                      </div>
                    )}

                    <span className="admin-msg__time">{fmtTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Attachment panel – image */}
            {attachMode === 'image' && (
              <div className="admin-attach-panel">
                <div className="admin-attach-panel__header">
                  <strong>📷 Send Image</strong>
                  <button onClick={() => { setAttachMode(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>✕</button>
                </div>
                {!imagePreview ? (
                  <button className="admin-attach-panel__pick-btn" onClick={() => fileRef.current?.click()}>📁 Choose Image File</button>
                ) : (
                  <>
                    <div className="admin-attach-panel__preview"><img src={imagePreview} alt="Preview" /></div>
                    <input type="text" placeholder="Caption (optional)" value={imageCaption} onChange={e => setImageCaption(e.target.value)} className="admin-attach-panel__caption" />
                    <div className="admin-attach-panel__actions">
                      <button className="admin-attach-panel__pick-btn" onClick={() => fileRef.current?.click()}>Change Image</button>
                      <button className="admin-attach-panel__send-btn" onClick={sendImage}>Send Image</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Attachment panel – video */}
            {attachMode === 'video' && (
              <div className="admin-attach-panel">
                <div className="admin-attach-panel__header">
                  <strong>🎬 Send Video</strong>
                  <button onClick={() => { setAttachMode(null); setVideoUrl(''); if (videoFileRef.current) videoFileRef.current.value = ''; }}>✕</button>
                </div>
                <div className="admin-video-options">
                  <button className="admin-attach-panel__pick-btn" onClick={() => videoFileRef.current?.click()}>📁 Choose Video File</button>
                  <span className="admin-video-or">or paste a URL</span>
                  <input type="url" placeholder="YouTube / video URL…" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="admin-attach-panel__caption" />
                </div>
                {videoUrl && <p className="admin-attach-panel__hint">Selected: {videoUrl.startsWith('blob:') ? 'Video file selected ✓' : videoUrl.slice(0, 50)}</p>}
                <input type="text" placeholder="Caption (optional)" value={videoCaption} onChange={e => setVideoCaption(e.target.value)} className="admin-attach-panel__caption" />
                <button className="admin-attach-panel__send-btn" onClick={sendVideo} disabled={!videoUrl.trim()}>Send Video</button>
              </div>
            )}

            {/* Attachment panel – catalog */}
            {attachMode === 'catalog' && (
              <div className="admin-attach-panel admin-attach-panel--catalog">
                <div className="admin-attach-panel__header">
                  <strong>🐠 Send Fish Catalog</strong>
                  <button onClick={() => { setAttachMode(null); setSelectedProductIds([]); }}>✕</button>
                </div>
                <p className="admin-attach-panel__hint">Select fish to show the customer:</p>
                <div className="admin-catalog-grid">
                  {products.length === 0 && <p className="admin-attach-panel__hint">Loading products…</p>}
                  {products.map(p => (
                    <label key={p.id} className={`admin-catalog-item ${selectedProductIds.includes(p.id) ? 'admin-catalog-item--selected' : ''}`}>
                      <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      <img src={getImgSrc(p)} alt={p.name} onError={e => { (e.target as HTMLImageElement).src = '/placeholder-fish.svg'; }} />
                      <div className="admin-catalog-item__info">
                        <span>{p.name}</span>
                        <span>₹{Number(p.price).toFixed(2)}</span>
                        {!p.available && <span className="admin-catalog-item__sold">Sold Out</span>}
                      </div>
                    </label>
                  ))}
                </div>
                <input type="text" placeholder="Note to customer (optional)" value={catalogNote} onChange={e => setCatalogNote(e.target.value)} className="admin-attach-panel__caption" />
                <button className="admin-attach-panel__send-btn" onClick={sendCatalog} disabled={selectedProductIds.length === 0}>
                  Send {selectedProductIds.length > 0 ? `${selectedProductIds.length} Fish` : 'Selection'}
                </button>
              </div>
            )}

            {/* Input bar */}
            <div className="admin-chat__input-bar">
              <button className={`admin-attach-btn ${attachMode === 'image' ? 'active' : ''}`} onClick={openImagePicker} title="Send Image">📷</button>
              <button className={`admin-attach-btn ${attachMode === 'video' ? 'active' : ''}`} onClick={() => setAttachMode(m => m === 'video' ? null : 'video')} title="Send Video">🎬</button>
              <button className={`admin-attach-btn ${attachMode === 'catalog' ? 'active' : ''}`} onClick={() => setAttachMode(m => m === 'catalog' ? null : 'catalog')} title="Send Fish Catalog">🐠</button>
              <input
                type="text"
                placeholder="Type a reply to the customer…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="admin-send-btn" onClick={sendText} disabled={!input.trim()} aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
