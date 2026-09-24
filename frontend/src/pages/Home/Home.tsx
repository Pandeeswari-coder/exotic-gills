import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { getProducts } from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.css';

const SEAWEED = [
  { left: '3%',   h: 150, dur: '3.4s', delay: '0s',   from: '-8deg',  to: '7deg',  color: '#1a7a3c', w: 22 },
  { left: '7%',   h: 100, dur: '2.8s', delay: '0.6s', from: '-11deg', to: '5deg',  color: '#25964a', w: 16 },
  { left: '11%',  h: 175, dur: '4.1s', delay: '1.1s', from: '-7deg',  to: '10deg', color: '#14622e', w: 20 },
  { left: '15%',  h: 115, dur: '3.0s', delay: '0.3s', from: '-9deg',  to: '6deg',  color: '#1e7a40', w: 18 },
  { left: '20%',  h: 85,  dur: '2.6s', delay: '1.6s', from: '-12deg', to: '8deg',  color: '#2a8a4e', w: 14 },
  { left: '72%',  h: 130, dur: '3.8s', delay: '0.8s', from: '-6deg',  to: '10deg', color: '#1a7a3c', w: 20 },
  { left: '77%',  h: 165, dur: '3.1s', delay: '0s',   from: '-9deg',  to: '7deg',  color: '#25964a', w: 22 },
  { left: '82%',  h: 95,  dur: '4.3s', delay: '1.3s', from: '-8deg',  to: '9deg',  color: '#14622e', w: 16 },
  { left: '87%',  h: 145, dur: '3.5s', delay: '0.4s', from: '-5deg',  to: '11deg', color: '#1e7a40', w: 20 },
  { left: '92%',  h: 80,  dur: '2.7s', delay: '1.9s', from: '-10deg', to: '7deg',  color: '#2a8a4e', w: 14 },
];

const BUBBLES = [
  { left: '4%',  size: '7px',  dur: '7s',  delay: '0s',   drift: '12px'  },
  { left: '9%',  size: '13px', dur: '10s', delay: '3s',   drift: '-8px'  },
  { left: '16%', size: '5px',  dur: '8s',  delay: '1s',   drift: '18px'  },
  { left: '22%', size: '10px', dur: '12s', delay: '6s',   drift: '-15px' },
  { left: '30%', size: '6px',  dur: '9s',  delay: '0.5s', drift: '10px'  },
  { left: '38%', size: '16px', dur: '11s', delay: '4s',   drift: '-20px' },
  { left: '45%', size: '8px',  dur: '7.5s',delay: '2s',   drift: '14px'  },
  { left: '52%', size: '12px', dur: '13s', delay: '7s',   drift: '-12px' },
  { left: '59%', size: '5px',  dur: '8.5s',delay: '1.5s', drift: '20px'  },
  { left: '66%', size: '18px', dur: '10s', delay: '5s',   drift: '-10px' },
  { left: '73%', size: '7px',  dur: '9s',  delay: '3.5s', drift: '8px'   },
  { left: '80%', size: '11px', dur: '11s', delay: '0s',   drift: '-18px' },
  { left: '86%', size: '9px',  dur: '7s',  delay: '8s',   drift: '16px'  },
  { left: '92%', size: '14px', dur: '12s', delay: '2.5s', drift: '-14px' },
  { left: '97%', size: '6px',  dur: '9.5s',delay: '6s',   drift: '10px'  },
];

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await getProducts({ available: true });
        setFeaturedProducts(data.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch featured products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero" onMouseMove={handleMouseMove} onMouseLeave={() => setMouse({ x: 0, y: 0 })}>
        {/* God rays — shift slightly with mouse */}
        <div
          className="hero__rays"
          aria-hidden
          style={{ transform: `translate(${mouse.x * -12}px, ${mouse.y * 6}px)`, transition: 'transform 0.6s ease-out' }}
        />

        {/* Rising bubbles */}
        <div className="hero__bubbles" aria-hidden>
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="bubble"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                '--dur': b.dur,
                '--delay': b.delay,
                '--drift': b.drift,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Background fish – rendered first so they sit behind everything */}
        <div className="hero__fish-scene" aria-hidden>
          <span className="hero-fish hero-fish--1">
            <svg viewBox="0 0 100 58" width="70" height="41" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.55">
                <polygon points="16,29 1,6 1,52" fill="#E8500A"/>
                <ellipse cx="58" cy="29" rx="40" ry="22" fill="#F4641E"/>
                <path d="M30,8 Q50,-3 73,8" fill="#D94010"/>
                <ellipse cx="44" cy="29" rx="5" ry="20" fill="white" opacity="0.95"/>
                <ellipse cx="67" cy="29" rx="4" ry="17" fill="white" opacity="0.95"/>
                <ellipse cx="90" cy="29" rx="10" ry="17" fill="#D94010"/>
                <circle cx="93" cy="22" r="6" fill="white"/>
                <circle cx="94" cy="22" r="4" fill="#111"/>
                <circle cx="95.5" cy="20.5" r="1.5" fill="white"/>
              </g>
            </svg>
          </span>
          <span className="hero-fish hero-fish--2">
            <svg viewBox="0 0 75 35" width="52" height="24" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.5">
                <polygon points="10,17 0,5 0,29" fill="#1565C0"/>
                <ellipse cx="42" cy="17" rx="32" ry="12" fill="#1565C0"/>
                <ellipse cx="42" cy="22" rx="24" ry="8" fill="#E53935" opacity="0.75"/>
                <path d="M13,13 Q42,8 72,13" stroke="#00E5FF" strokeWidth="3.5" fill="none" opacity="0.9"/>
                <circle cx="70" cy="13" r="5" fill="white"/>
                <circle cx="71" cy="13" r="3" fill="#0D1A26"/>
                <circle cx="72" cy="12" r="1" fill="white"/>
              </g>
            </svg>
          </span>
          <span className="hero-fish hero-fish--3">
            <svg viewBox="0 0 100 58" width="60" height="35" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.45">
                <polygon points="16,29 1,6 1,52" fill="#E8500A"/>
                <ellipse cx="58" cy="29" rx="40" ry="22" fill="#F4641E"/>
                <path d="M30,8 Q50,-3 73,8" fill="#D94010"/>
                <ellipse cx="44" cy="29" rx="5" ry="20" fill="white" opacity="0.95"/>
                <ellipse cx="67" cy="29" rx="4" ry="17" fill="white" opacity="0.95"/>
                <ellipse cx="90" cy="29" rx="10" ry="17" fill="#D94010"/>
                <circle cx="93" cy="22" r="6" fill="white"/>
                <circle cx="94" cy="22" r="4" fill="#111"/>
                <circle cx="95.5" cy="20.5" r="1.5" fill="white"/>
              </g>
            </svg>
          </span>
          {/* Arowana-style elongated fish */}
          <span className="hero-fish hero-fish--4">
            <svg viewBox="0 0 130 38" width="90" height="26" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.48">
                <polygon points="14,19 0,6 0,32" fill="#4CAF50"/>
                <ellipse cx="72" cy="19" rx="58" ry="13" fill="#388E3C"/>
                <path d="M20,10 Q72,2 124,10" stroke="#A5D6A7" strokeWidth="2.5" fill="none" opacity="0.8"/>
                <path d="M20,28 Q72,36 124,28" stroke="#A5D6A7" strokeWidth="1.5" fill="none" opacity="0.5"/>
                <circle cx="121" cy="15" r="5" fill="white"/>
                <circle cx="122" cy="15" r="3.5" fill="#1A2E1A"/>
                <circle cx="123" cy="14" r="1.2" fill="white"/>
              </g>
            </svg>
          </span>
          {/* Small bright tropical fish */}
          <span className="hero-fish hero-fish--5">
            <svg viewBox="0 0 68 42" width="48" height="30" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.52">
                <polygon points="12,21 0,7 0,35" fill="#FF6F00"/>
                <ellipse cx="38" cy="21" rx="28" ry="16" fill="#FF8F00"/>
                <rect x="22" y="7" width="5" height="28" rx="2" fill="white" opacity="0.9"/>
                <rect x="38" y="8" width="4" height="26" rx="2" fill="white" opacity="0.85"/>
                <ellipse cx="57" cy="21" rx="10" ry="14" fill="#E65100"/>
                <circle cx="61" cy="16" r="5" fill="white"/>
                <circle cx="62" cy="16" r="3" fill="#111"/>
                <circle cx="63" cy="15" r="1" fill="white"/>
              </g>
            </svg>
          </span>
        </div>

        <div className="hero__overlay" />

        {/* Two-column body: text left, large fish right */}
        <div className="hero__body">
          <div className="hero__content">
            <p className="hero__eyebrow">Premium Quality Fish</p>
            <h1 className="hero__title">Premium<br/>Discus Fish</h1>
            <p className="hero__subtitle">Servicing the Hobby for Over 10 Years</p>
            <Link to="/shop" className="hero__cta">
              SHOP NOW
            </Link>
          </div>

          {/* Discus fish — floats and follows mouse */}
          <div
            className="hero__visual-parallax"
            style={{
              transform: `translate(${mouse.x * 22}px, ${mouse.y * -16}px) rotate(${mouse.x * 2}deg)`,
              transition: 'transform 0.18s ease-out',
            }}
            aria-hidden
          >
            <div className="hero__visual">
              <svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="dg-body" cx="42%" cy="42%" r="58%">
                    <stop offset="0%"   stopColor="#00E5FF"/>
                    <stop offset="28%"  stopColor="#0097A7"/>
                    <stop offset="62%"  stopColor="#006064"/>
                    <stop offset="100%" stopColor="#BF360C"/>
                  </radialGradient>
                  <linearGradient id="dg-fin" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#E64A19" stopOpacity="0.92"/>
                    <stop offset="100%" stopColor="#004D40" stopOpacity="0.85"/>
                  </linearGradient>
                  <radialGradient id="dg-eye" cx="38%" cy="35%" r="62%">
                    <stop offset="0%"   stopColor="#FFD54F"/>
                    <stop offset="45%"  stopColor="#E53935"/>
                    <stop offset="100%" stopColor="#8B0000"/>
                  </radialGradient>
                  <radialGradient id="dg-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#00E5FF" stopOpacity="0.22"/>
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <ellipse cx="162" cy="152" rx="148" ry="144" fill="url(#dg-glow)"/>
                <path d="M50,152 L6,96 L2,152 L6,208 Z" fill="url(#dg-fin)"/>
                <path d="M80,42 Q162,8 244,42 Q258,66 242,76 Q162,54 80,76 Z" fill="url(#dg-fin)"/>
                <path d="M80,260 Q162,292 244,260 Q258,236 242,226 Q162,248 80,226 Z" fill="url(#dg-fin)"/>
                <ellipse cx="164" cy="152" rx="116" ry="120" fill="url(#dg-body)"/>
                <ellipse cx="158" cy="184" rx="60" ry="17" fill="#00838F" transform="rotate(20 158 184)" opacity="0.6"/>
                <line x1="90"  y1="46"  x2="86"  y2="258" stroke="#003D33" strokeWidth="5.5" opacity="0.35"/>
                <line x1="110" y1="33"  x2="106" y2="271" stroke="#003D33" strokeWidth="5"   opacity="0.3"/>
                <line x1="130" y1="27"  x2="128" y2="277" stroke="#003D33" strokeWidth="4.5" opacity="0.27"/>
                <line x1="152" y1="24"  x2="152" y2="280" stroke="#003D33" strokeWidth="4.5" opacity="0.25"/>
                <line x1="174" y1="26"  x2="174" y2="278" stroke="#003D33" strokeWidth="4"   opacity="0.23"/>
                <line x1="196" y1="30"  x2="195" y2="274" stroke="#003D33" strokeWidth="3.5" opacity="0.2"/>
                <line x1="216" y1="38"  x2="215" y2="266" stroke="#003D33" strokeWidth="3"   opacity="0.18"/>
                <line x1="233" y1="50"  x2="233" y2="254" stroke="#003D33" strokeWidth="2.5" opacity="0.15"/>
                <path d="M72,110 Q132,98 196,108 Q236,104 272,118"  stroke="rgba(0,229,255,0.5)"  strokeWidth="2.5" fill="none"/>
                <path d="M68,132 Q132,120 200,130 Q240,126 274,140"  stroke="rgba(0,229,255,0.42)" strokeWidth="2"   fill="none"/>
                <path d="M68,154 Q134,144 200,152 Q240,148 272,162"  stroke="rgba(0,229,255,0.34)" strokeWidth="2"   fill="none"/>
                <path d="M72,176 Q134,166 199,174 Q238,170 268,182"  stroke="rgba(0,229,255,0.28)" strokeWidth="1.5" fill="none"/>
                <path d="M78,196 Q136,188 197,194 Q235,191 263,200"  stroke="rgba(0,229,255,0.22)" strokeWidth="1.5" fill="none"/>
                <ellipse cx="130" cy="114" rx="55" ry="36" fill="rgba(0,229,255,0.09)"/>
                <circle cx="242" cy="136" r="27" fill="rgba(0,10,20,0.55)"/>
                <circle cx="242" cy="136" r="22" fill="url(#dg-eye)"/>
                <circle cx="242" cy="136" r="11" fill="#080808"/>
                <circle cx="235" cy="129" r="5"  fill="white" opacity="0.95"/>
                <circle cx="247" cy="142" r="2.2" fill="white" opacity="0.45"/>
                <path d="M280,148 Q288,152 280,156" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Animated seaweed on the seafloor */}
        <div className="hero__seafloor" aria-hidden>
          {SEAWEED.map((s, i) => (
            <div
              key={i}
              className="seaweed"
              style={{
                left: s.left,
                '--dur': s.dur,
                '--delay': s.delay,
                '--from': s.from,
                '--to': s.to,
              } as React.CSSProperties}
            >
              <svg viewBox="0 0 30 200" width={s.w} height={s.h} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path
                  d={`M15,200 C4,165 26,125 13,90 C0,55 22,28 15,0`}
                  stroke={s.color} strokeWidth="5" fill="none" strokeLinecap="round"
                />
                <path
                  d={`M15,200 C24,168 10,130 20,95 C30,60 16,32 15,0`}
                  stroke={s.color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55"
                />
              </svg>
            </div>
          ))}
          <div className="hero__seafloor-sand" />
        </div>

        <div className="hero__scroll-hint">
          <span>Scroll to explore</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* Features bar */}
      <section className="features-bar">
        <div className="features-bar__inner">
          <div className="feature-item">
            <span className="feature-icon">&#x1F69A;</span>
            <div>
              <strong>Live Arrival Guarantee</strong>
              <p>100% live arrival on all fish</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#x1F4E6;</span>
            <div>
              <strong>Careful Packaging</strong>
              <p>Insulated boxes with heat packs</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#x1F3C6;</span>
            <div>
              <strong>Award-Winning Stock</strong>
              <p>Championship-level discus fish</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">&#x1F4DE;</span>
            <div>
              <strong>Expert Support</strong>
              <p>We're here to help you succeed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="featured-section__inner">
          <div className="section-header">
            <h2>Featured Fish</h2>
            <p>Hand-selected premium specimens from our collection</p>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="featured-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>No products available at the moment. Check back soon!</p>
            </div>
          )}

          <div className="featured-cta">
            <Link to="/shop" className="btn-outline">View All Fish</Link>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="about-teaser">
        <div className="about-teaser__inner">
          <div className="about-teaser__text">
            <h2>Why Choose Exotic Gills and Fins?</h2>
            <p>
              For over a decade, we have dedicated ourselves to breeding and raising the
              finest Discus fish available. Our fish are bred in pristine water conditions,
              fed a varied diet, and carefully monitored for health before shipping.
            </p>
            <p>
              We ship nationwide with overnight delivery to ensure your fish arrive healthy
              and vibrant. Every order includes a live arrival guarantee.
            </p>
            <Link to="/about" className="btn-outline">Learn More About Us</Link>
          </div>
          <div className="about-teaser__image">
            <div className="image-placeholder">
              <span>&#x1F41F;</span>
              <p>Premium Discus Collection</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
