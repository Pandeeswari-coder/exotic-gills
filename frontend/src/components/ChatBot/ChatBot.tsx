import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';
import { getProducts } from '../../services/api';
import type { Product } from '../../types';
import './ChatBot.css';

const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const { messages, customerUnread, sendMessage, markCustomerRead } = useChat();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts({ available: true }).then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) markCustomerRead();
  }, [open, messages, markCustomerRead]);

  /* Only auto-scroll when new messages arrive if already at bottom */
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* Always scroll to bottom when panel opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        isAtBottom.current = true;
      }, 50);
    }
  }, [open]);

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage({ sender: 'customer', type: 'text', text });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getImgSrc = (p: Product) => {
    if (!p.image) return '/placeholder-fish.svg';
    return (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : `http://localhost:8000${p.image}`;
  };

  const resolveProducts = (ids: string[]) =>
    ids.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];

  return createPortal(
    <>
      {/* Floating trigger */}
      <button className="chatbot-trigger" onClick={() => setOpen(o => !o)} aria-label="Chat with us">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {customerUnread > 0 && (
              <span className="chatbot-trigger__badge">{customerUnread}</span>
            )}
          </>
        )}
        {!open && <span className="chatbot-trigger__dot" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__avatar">🐠</div>
            <div className="chatbot-header__info">
              <strong>Exotic Gills and Fins</strong>
              <span><span className="chatbot-online-dot" />We respond immediately</span>
            </div>
            <button className="chatbot-header__close" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" ref={messagesRef} onScroll={handleScroll}>
            {/* Static welcome when no messages yet */}
            {messages.length === 0 && (
              <div className="chatbot-msg chatbot-msg--owner">
                <div className="chatbot-msg__avatar">🐠</div>
                <div className="chatbot-msg__bubble-wrap">
                  <div className="chatbot-msg__bubble">
                    <p>👋 Hi! Welcome to <strong>Exotic Gills and Fins</strong>. Ask us anything about our fish, shipping, or pricing — we'll reply right here!</p>
                  </div>
                  <span className="chatbot-msg__time">Now</span>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.sender}`}>
                {msg.sender === 'owner' && (
                  <div className="chatbot-msg__avatar">🐠</div>
                )}

                <div className="chatbot-msg__bubble-wrap">
                  {/* Text */}
                  {msg.type === 'text' && msg.text && (
                    <div className="chatbot-msg__bubble">
                      <div className="chatbot-msg__text-wrap">
                        <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {msg.type === 'image' && msg.mediaUrl && (
                    <div className="chatbot-msg__bubble chatbot-msg__bubble--media">
                      <img
                        src={msg.mediaUrl}
                        alt="Sent image"
                        className="chatbot-media-img"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {msg.text && <p className="chatbot-media-caption">{msg.text}</p>}
                    </div>
                  )}

                  {/* Video */}
                  {msg.type === 'video' && msg.videoUrl && (
                    <div className="chatbot-msg__bubble chatbot-msg__bubble--media">
                      <div className="chatbot-video-placeholder">
                        <div className="chatbot-video-play">▶</div>
                        <p>Video from the owner</p>
                        <a
                          href={msg.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chatbot-video-link"
                        >
                          Watch video ↗
                        </a>
                      </div>
                      {msg.text && <p className="chatbot-media-caption">{msg.text}</p>}
                    </div>
                  )}

                  {/* Catalog */}
                  {msg.type === 'catalog' && msg.productIds && (
                    <div className="chatbot-catalog">
                      {resolveProducts(msg.productIds).length === 0 ? (
                        <p className="chatbot-catalog__empty">Loading fish…</p>
                      ) : (
                        resolveProducts(msg.productIds).map(p => (
                          <div key={p.id} className="chatbot-catalog__item">
                            <img
                              src={getImgSrc(p)}
                              alt={p.name}
                              onError={e => { (e.target as HTMLImageElement).src = '/placeholder-fish.svg'; }}
                            />
                            <div className="chatbot-catalog__info">
                              <span className="chatbot-catalog__name">{p.name}</span>
                              <span className="chatbot-catalog__price">₹{Number(p.price).toFixed(2)}</span>
                              <span className={`chatbot-catalog__badge chatbot-catalog__badge--${p.available ? 'in' : 'out'}`}>
                                {p.available ? 'In Stock' : 'Sold Out'}
                              </span>
                            </div>
                            <div className="chatbot-catalog__actions">
                              <button
                                className="chatbot-catalog__btn chatbot-catalog__btn--view"
                                onClick={() => { navigate(`/product/${p.id}`); setOpen(false); }}
                              >
                                View
                              </button>
                              {p.available && (
                                <button
                                  className="chatbot-catalog__btn chatbot-catalog__btn--add"
                                  onClick={() => {
                                    addToCart(p, 1);
                                    sendMessage({ sender: 'customer', type: 'text', text: `I added ${p.name} to my cart! 🛒` });
                                  }}
                                >
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <span className="chatbot-msg__time">{fmt(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button onClick={send} disabled={!input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  , document.body);
};

export default ChatBot;
