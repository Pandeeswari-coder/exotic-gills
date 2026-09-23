import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { getProducts } from '../../services/api';
import type { Product } from '../../types';
import './AdminChat.css';

type AttachMode = null | 'image' | 'video' | 'catalog';

const ADMIN_PASSWORD = 'fishowner2024';

const AdminChat: React.FC = () => {
  const navigate = useNavigate();
  const { messages, ownerUnread, sendMessage, deleteMessage, markOwnerRead, clearChat } = useChat();

  /* ── Auth gate ── */
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('egf_admin') === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('egf_admin', '1');
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  /* ── Chat state ── */
  const [input, setInput] = useState('');
  const [attachMode, setAttachMode] = useState<AttachMode>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [catalogNote, setCatalogNote] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (authed) getProducts().then(setProducts).catch(() => {});
  }, [authed]);

  useEffect(() => {
    if (authed) markOwnerRead();
  }, [messages, markOwnerRead, authed]);

  /* Scroll to bottom on new message only if already at bottom */
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* Always scroll to bottom when admin panel first loads */
  useEffect(() => {
    if (authed) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        isAtBottom.current = true;
      }, 100);
    }
  }, [authed]);

  useEffect(() => {
    document.title = ownerUnread > 0 ? `(${ownerUnread}) Admin Chat` : 'Admin Chat';
    return () => { document.title = 'Exotic Gills and Fins'; };
  }, [ownerUnread]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ── Send plain text ── */
  const sendText = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ sender: 'owner', type: 'text', text });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  /* ── Image attachment ── */
  const openImagePicker = () => {
    setAttachMode('image');
    fileRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendImage = () => {
    if (!imagePreview) return;
    sendMessage({ sender: 'owner', type: 'image', mediaUrl: imagePreview, text: imageCaption || undefined });
    setImagePreview(null);
    setImageCaption('');
    setAttachMode(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Video attachment ── */
  const openVideoPicker = () => {
    setAttachMode('video');
  };

  const onVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video must be under 50 MB.');
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const sendVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    sendMessage({ sender: 'owner', type: 'video', videoUrl: url, text: videoCaption || undefined });
    setVideoUrl('');
    setVideoCaption('');
    setAttachMode(null);
    if (videoFileRef.current) videoFileRef.current.value = '';
  };

  /* ── Catalog ── */
  const toggleProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sendCatalog = () => {
    if (selectedProductIds.length === 0) return;
    sendMessage({
      sender: 'owner',
      type: 'catalog',
      productIds: selectedProductIds,
      text: catalogNote || undefined,
    });
    setSelectedProductIds([]);
    setCatalogNote('');
    setAttachMode(null);
  };

  const getImgSrc = (p: Product) => {
    if (!p.image) return '/placeholder-fish.jpg';
    return (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : `http://localhost:8000${p.image}`;
  };

  const resolveProducts = (ids: number[]) =>
    ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];

  /* ── Password gate ── */
  if (!authed) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__card">
          <div className="admin-gate__icon">🐠</div>
          <h2>Owner Admin Panel</h2>
          <p>Enter your owner password to continue.</p>
          <form onSubmit={handleLogin} className="admin-gate__form">
            <input
              type="password"
              placeholder="Password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              autoFocus
              className={pwError ? 'admin-gate__input admin-gate__input--error' : 'admin-gate__input'}
            />
            {pwError && <p className="admin-gate__error">Incorrect password. Try again.</p>}
            <button type="submit" className="admin-gate__btn">Enter Admin Panel</button>
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
      {/* Hidden file inputs always in DOM */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        onChange={onVideoFileChange}
        style={{ display: 'none' }}
      />

      {/* Sidebar */}
      <aside className="admin-chat__sidebar">
        <div className="admin-chat__sidebar-header">
          <span>🐠</span>
          <div>
            <strong>Exotic Gills and Fins</strong>
            <p>Owner Panel</p>
          </div>
        </div>

        {/* Nav between admin sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,201,167,0.1)' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,201,167,0.1)', borderLeft: '3px solid var(--primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Customer Chat
          </Link>
          <Link to="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            Manage Fish
          </Link>
        </nav>

        <div className="admin-chat__conv-item admin-chat__conv-item--active">
          <div className="admin-chat__conv-avatar">👤</div>
          <div className="admin-chat__conv-info">
            <strong>Customer Chat</strong>
            <p>{messages.length > 0
              ? (messages[messages.length - 1].text?.slice(0, 28) ?? 'Media') + '…'
              : 'No messages yet'}
            </p>
          </div>
          {ownerUnread > 0 && (
            <span className="admin-chat__unread-badge">{ownerUnread}</span>
          )}
        </div>

        <button className="admin-chat__clear-btn" onClick={() => {
          if (window.confirm('Clear all chat messages?')) clearChat();
        }}>
          Clear Chat
        </button>

        <button
          className="admin-chat__logout-btn"
          onClick={() => {
            sessionStorage.removeItem('egf_admin');
            navigate('/');
          }}
        >
          ← Exit to Site
        </button>
      </aside>

      {/* Main chat area */}
      <div className="admin-chat__main">
        {/* Header with back button */}
        <div className="admin-chat__main-header">
          <button className="admin-chat__back-btn" onClick={() => navigate('/')} title="Back to site">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Site
          </button>
          <div className="admin-chat__main-header-info">
            <strong>Customer Chat</strong>
            <span>{messages.filter(m => m.sender === 'customer').length} customer messages</span>
          </div>
        </div>

        {/* Messages */}
        <div className="admin-chat__messages" ref={messagesRef} onScroll={handleMessagesScroll}>
          {messages.length === 0 && (
            <div className="admin-chat__empty">
              <span>💬</span>
              <p>No messages yet. Waiting for customers…</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`admin-msg admin-msg--${msg.sender}`}>
              <div className="admin-msg__avatar">
                {msg.sender === 'owner' ? '🐠' : '👤'}
              </div>
              <div className="admin-msg__wrap">
                <span className="admin-msg__label">
                  {msg.sender === 'owner' ? 'You (Owner)' : 'Customer'}
                </span>

                {msg.type === 'text' && msg.text && (
                  <div className="admin-msg__bubble">
                    <p>{msg.text}</p>
                  </div>
                )}

                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="admin-msg__bubble admin-msg__bubble--media">
                    <img src={msg.mediaUrl} alt="Sent" className="admin-msg__img" />
                    {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                    {msg.sender === 'owner' && (
                      <button
                        className="admin-msg__delete-btn"
                        onClick={() => { if (window.confirm('Remove this image from the chat?')) deleteMessage(msg.id); }}
                        title="Remove image"
                      >
                        🗑 Remove
                      </button>
                    )}
                  </div>
                )}

                {msg.type === 'video' && msg.videoUrl && (
                  <div className="admin-msg__bubble admin-msg__bubble--media">
                    <div className="admin-msg__video-chip">
                      <span>🎬</span>
                      <a href={msg.videoUrl} target="_blank" rel="noopener noreferrer">
                        {msg.videoUrl.startsWith('blob:')
                          ? 'Video File (click to watch)'
                          : msg.videoUrl.length > 40 ? msg.videoUrl.slice(0, 40) + '…' : msg.videoUrl}
                      </a>
                    </div>
                    {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                    {msg.sender === 'owner' && (
                      <button
                        className="admin-msg__delete-btn"
                        onClick={() => { if (window.confirm('Remove this video from the chat?')) deleteMessage(msg.id); }}
                        title="Remove video"
                      >
                        🗑 Remove
                      </button>
                    )}
                  </div>
                )}

                {msg.type === 'catalog' && msg.productIds && (
                  <div className="admin-msg__bubble admin-msg__bubble--catalog">
                    <p className="admin-msg__catalog-label">📦 Fish catalog shared</p>
                    {resolveProducts(msg.productIds).map(p => (
                      <span key={p.id} className="admin-msg__catalog-tag">{p.name}</span>
                    ))}
                    {msg.text && <p className="admin-msg__caption">{msg.text}</p>}
                    {msg.sender === 'owner' && (
                      <button
                        className="admin-msg__delete-btn"
                        onClick={() => { if (window.confirm('Remove this catalog from the chat?')) deleteMessage(msg.id); }}
                        title="Remove catalog"
                      >
                        🗑 Remove
                      </button>
                    )}
                  </div>
                )}

                <span className="admin-msg__time">{fmt(msg.timestamp)}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Attachment panel – image preview */}
        {attachMode === 'image' && (
          <div className="admin-attach-panel">
            <div className="admin-attach-panel__header">
              <strong>📷 Send Image</strong>
              <button onClick={() => { setAttachMode(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>✕</button>
            </div>
            {!imagePreview ? (
              <button className="admin-attach-panel__pick-btn" onClick={() => fileRef.current?.click()}>
                📁 Choose Image File
              </button>
            ) : (
              <>
                <div className="admin-attach-panel__preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={imageCaption}
                  onChange={e => setImageCaption(e.target.value)}
                  className="admin-attach-panel__caption"
                />
                <div className="admin-attach-panel__actions">
                  <button
                    className="admin-attach-panel__pick-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    Change Image
                  </button>
                  <button
                    className="admin-attach-panel__send-btn"
                    onClick={sendImage}
                  >
                    Send Image
                  </button>
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
              <button className="admin-attach-panel__pick-btn" onClick={() => videoFileRef.current?.click()}>
                📁 Choose Video File
              </button>
              <span className="admin-video-or">or paste a URL</span>
              <input
                type="url"
                placeholder="YouTube / video URL…"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="admin-attach-panel__caption"
              />
            </div>
            {videoUrl && (
              <p className="admin-attach-panel__hint">
                Selected: {videoUrl.startsWith('blob:') ? 'Video file selected ✓' : videoUrl.slice(0, 50)}
              </p>
            )}
            <input
              type="text"
              placeholder="Caption (optional)"
              value={videoCaption}
              onChange={e => setVideoCaption(e.target.value)}
              className="admin-attach-panel__caption"
            />
            <button
              className="admin-attach-panel__send-btn"
              onClick={sendVideo}
              disabled={!videoUrl.trim()}
            >
              Send Video
            </button>
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
                <label
                  key={p.id}
                  className={`admin-catalog-item ${selectedProductIds.includes(p.id) ? 'admin-catalog-item--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <img src={getImgSrc(p)} alt={p.name} onError={e => { (e.target as HTMLImageElement).src = '/placeholder-fish.jpg'; }} />
                  <div className="admin-catalog-item__info">
                    <span>{p.name}</span>
                    <span>₹{Number(p.price).toFixed(2)}</span>
                    {!p.available && <span className="admin-catalog-item__sold">Sold Out</span>}
                  </div>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="Note to customer (optional)"
              value={catalogNote}
              onChange={e => setCatalogNote(e.target.value)}
              className="admin-attach-panel__caption"
            />
            <button
              className="admin-attach-panel__send-btn"
              onClick={sendCatalog}
              disabled={selectedProductIds.length === 0}
            >
              Send {selectedProductIds.length > 0 ? `${selectedProductIds.length} Fish` : 'Selection'}
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className="admin-chat__input-bar">
          <button
            className={`admin-attach-btn ${attachMode === 'image' ? 'active' : ''}`}
            onClick={openImagePicker}
            title="Send Image"
          >
            📷
          </button>
          <button
            className={`admin-attach-btn ${attachMode === 'video' ? 'active' : ''}`}
            onClick={openVideoPicker}
            title="Send Video"
          >
            🎬
          </button>
          <button
            className={`admin-attach-btn ${attachMode === 'catalog' ? 'active' : ''}`}
            onClick={() => setAttachMode(m => m === 'catalog' ? null : 'catalog')}
            title="Send Fish Catalog"
          >
            🐠
          </button>

          <input
            type="text"
            placeholder="Type a reply to the customer…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />

          <button
            className="admin-send-btn"
            onClick={sendText}
            disabled={!input.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
