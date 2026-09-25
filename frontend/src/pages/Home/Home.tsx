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
            <svg viewBox="0 0 100 58" width="90" height="52" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.80">
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
            <svg viewBox="0 0 75 35" width="68" height="32" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.75">
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
            <svg viewBox="0 0 100 58" width="75" height="44" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.72">
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
            <h1 className="hero__title">Premium<br/>Chiclids Fish</h1>
            <p className="hero__subtitle">Servicing the Hobby Since 2023</p>
            <Link to="/shop" className="hero__cta">
              SHOP NOW
            </Link>
          </div>

          {/* Chiclids fish — floats and follows mouse */}
          <div
            className="hero__visual-parallax"
            style={{
              transform: `translate(${mouse.x * 22}px, ${mouse.y * -16}px) rotate(${mouse.x * 2}deg)`,
              transition: 'transform 0.18s ease-out',
            }}
            aria-hidden
          >
            <div className="hero__visual">
              {/* Cichlid fish — elongated body, vibrant orange/gold Oscar-style */}
              <svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="cc-body" cx="40%" cy="38%" r="60%">
                    <stop offset="0%"   stopColor="#FFE066"/>
                    <stop offset="22%"  stopColor="#FF9900"/>
                    <stop offset="55%"  stopColor="#E05A00"/>
                    <stop offset="100%" stopColor="#7A1F00"/>
                  </radialGradient>
                  <linearGradient id="cc-fin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#FF7700" stopOpacity="0.95"/>
                    <stop offset="100%" stopColor="#6B1800" stopOpacity="0.8"/>
                  </linearGradient>
                  <radialGradient id="cc-eye" cx="36%" cy="33%" r="65%">
                    <stop offset="0%"   stopColor="#FFE566"/>
                    <stop offset="40%"  stopColor="#FF4500"/>
                    <stop offset="100%" stopColor="#1a0000"/>
                  </radialGradient>
                  <radialGradient id="cc-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#FF8C00" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#FF8C00" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                {/* Glow */}
                <ellipse cx="165" cy="142" rx="155" ry="130" fill="url(#cc-glow)"/>
                {/* Tail fin — forked */}
                <path d="M44,142 L2,90  L8,142 L2,194 Z" fill="url(#cc-fin)"/>
                <path d="M44,142 L12,104 L18,142 L12,180 Z" fill="url(#cc-fin)" opacity="0.6"/>
                {/* Dorsal fin — tall, runs along top */}
                <path d="M88,72 Q130,20 200,28 Q235,32 255,58 Q220,68 88,88 Z" fill="url(#cc-fin)"/>
                {/* Anal fin — bottom */}
                <path d="M110,210 Q155,248 200,235 Q195,218 110,202 Z" fill="url(#cc-fin)" opacity="0.85"/>
                {/* Pectoral fin */}
                <path d="M188,158 Q228,182 222,208 Q205,192 172,166 Z" fill="url(#cc-fin)" opacity="0.7"/>
                {/* Body — elongated cichlid oval */}
                <ellipse cx="168" cy="142" rx="128" ry="86" fill="url(#cc-body)"/>
                {/* Oscar-style dark blotch patch on back half */}
                <ellipse cx="155" cy="128" rx="58" ry="30" fill="rgba(80,20,0,0.22)" transform="rotate(-8 155 128)"/>
                {/* Vertical stripe bands */}
                <line x1="100" y1="60"  x2="96"  y2="222" stroke="#5C1500" strokeWidth="6"   opacity="0.32"/>
                <line x1="122" y1="56"  x2="119" y2="228" stroke="#5C1500" strokeWidth="5.5" opacity="0.27"/>
                <line x1="145" y1="56"  x2="143" y2="228" stroke="#5C1500" strokeWidth="5"   opacity="0.23"/>
                <line x1="168" y1="58"  x2="167" y2="226" stroke="#5C1500" strokeWidth="4.5" opacity="0.2"/>
                <line x1="190" y1="62"  x2="190" y2="222" stroke="#5C1500" strokeWidth="4"   opacity="0.17"/>
                <line x1="210" y1="70"  x2="211" y2="214" stroke="#5C1500" strokeWidth="3"   opacity="0.13"/>
                <line x1="228" y1="80"  x2="229" y2="204" stroke="#5C1500" strokeWidth="2.5" opacity="0.1"/>
                {/* Lateral line shimmer */}
                <path d="M70,128 Q160,116 258,124" stroke="rgba(255,220,80,0.45)" strokeWidth="2.2" fill="none"/>
                <path d="M66,142 Q160,132 260,140" stroke="rgba(255,200,50,0.28)" strokeWidth="1.8" fill="none"/>
                {/* Belly highlight */}
                <ellipse cx="138" cy="106" rx="58" ry="32" fill="rgba(255,230,100,0.1)" transform="rotate(-5 138 106)"/>
                {/* Gill cover */}
                <path d="M215,96 Q228,130 215,166" stroke="rgba(160,60,0,0.4)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                {/* Eye socket */}
                <circle cx="248" cy="128" r="26" fill="rgba(0,0,0,0.5)"/>
                {/* Eye */}
                <circle cx="248" cy="128" r="21" fill="url(#cc-eye)"/>
                {/* Pupil */}
                <circle cx="248" cy="128" r="10" fill="#060000"/>
                {/* Shine */}
                <circle cx="242" cy="122" r="5"  fill="white" opacity="0.95"/>
                <circle cx="253" cy="134" r="2"  fill="white" opacity="0.4"/>
                {/* Mouth */}
                <path d="M288,138 Q298,142 288,147" stroke="#4A1000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
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
          {/* <div className="feature-item">
            <span className="feature-icon">&#x1F3C6;</span>
            <div>
              <strong>Award-Winning Stock</strong>
              <p>Championship-level Chiclids fish</p>
            </div>
          </div> */}
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
            <h2>Featured Products</h2>
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
              Since 2023, we have dedicated ourselves to breeding and raising the
              finest Chiclids fish available. Our fish are bred in pristine water conditions,
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
              <p>Premium Chiclids Collection</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
