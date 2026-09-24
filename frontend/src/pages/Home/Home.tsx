import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { getProducts } from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.css';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
      <section className="hero">
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

          {/* Large discus fish illustration */}
          <div className="hero__visual" aria-hidden>
            <svg viewBox="0 0 320 300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Blue-teal center fading to orange-red at edges — classic red turquoise discus */}
                <radialGradient id="dg-body" cx="42%" cy="42%" r="58%">
                  <stop offset="0%"   stopColor="#00E5FF"/>
                  <stop offset="28%"  stopColor="#0097A7"/>
                  <stop offset="62%"  stopColor="#006064"/>
                  <stop offset="100%" stopColor="#BF360C"/>
                </radialGradient>
                {/* Fins: orange base fading to dark teal tip */}
                <linearGradient id="dg-fin" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#E64A19" stopOpacity="0.92"/>
                  <stop offset="100%" stopColor="#004D40" stopOpacity="0.85"/>
                </linearGradient>
                {/* Eye iris: bright amber center → deep red edge */}
                <radialGradient id="dg-eye" cx="38%" cy="35%" r="62%">
                  <stop offset="0%"   stopColor="#FFD54F"/>
                  <stop offset="45%"  stopColor="#E53935"/>
                  <stop offset="100%" stopColor="#8B0000"/>
                </radialGradient>
                {/* Soft glow halo around fish */}
                <radialGradient id="dg-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#00E5FF" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* Ambient glow */}
              <ellipse cx="162" cy="152" rx="148" ry="144" fill="url(#dg-glow)"/>

              {/* Tail fin — forked, realistic */}
              <path d="M50,152 L6,96 L2,152 L6,208 Z" fill="url(#dg-fin)"/>

              {/* Dorsal fin (long, tall) */}
              <path d="M80,42 Q162,8 244,42 Q258,66 242,76 Q162,54 80,76 Z" fill="url(#dg-fin)"/>

              {/* Anal fin (bottom, symmetrical) */}
              <path d="M80,260 Q162,292 244,260 Q258,236 242,226 Q162,248 80,226 Z" fill="url(#dg-fin)"/>

              {/* Main body disc */}
              <ellipse cx="164" cy="152" rx="116" ry="120" fill="url(#dg-body)"/>

              {/* Pectoral fin */}
              <ellipse cx="158" cy="184" rx="60" ry="17" fill="#00838F" transform="rotate(20 158 184)" opacity="0.6"/>

              {/* Vertical stripes (9 stripes — characteristic of discus) */}
              <line x1="90"  y1="46"  x2="86"  y2="258" stroke="#003D33" strokeWidth="5.5" opacity="0.35"/>
              <line x1="110" y1="33"  x2="106" y2="271" stroke="#003D33" strokeWidth="5"   opacity="0.3"/>
              <line x1="130" y1="27"  x2="128" y2="277" stroke="#003D33" strokeWidth="4.5" opacity="0.27"/>
              <line x1="152" y1="24"  x2="152" y2="280" stroke="#003D33" strokeWidth="4.5" opacity="0.25"/>
              <line x1="174" y1="26"  x2="174" y2="278" stroke="#003D33" strokeWidth="4"   opacity="0.23"/>
              <line x1="196" y1="30"  x2="195" y2="274" stroke="#003D33" strokeWidth="3.5" opacity="0.2"/>
              <line x1="216" y1="38"  x2="215" y2="266" stroke="#003D33" strokeWidth="3"   opacity="0.18"/>
              <line x1="233" y1="50"  x2="233" y2="254" stroke="#003D33" strokeWidth="2.5" opacity="0.15"/>

              {/* Iridescent horizontal shimmers */}
              <path d="M72,110 Q132,98 196,108 Q236,104 272,118"  stroke="rgba(0,229,255,0.5)"  strokeWidth="2.5" fill="none"/>
              <path d="M68,132 Q132,120 200,130 Q240,126 274,140"  stroke="rgba(0,229,255,0.42)" strokeWidth="2"   fill="none"/>
              <path d="M68,154 Q134,144 200,152 Q240,148 272,162"  stroke="rgba(0,229,255,0.34)" strokeWidth="2"   fill="none"/>
              <path d="M72,176 Q134,166 199,174 Q238,170 268,182"  stroke="rgba(0,229,255,0.28)" strokeWidth="1.5" fill="none"/>
              <path d="M78,196 Q136,188 197,194 Q235,191 263,200"  stroke="rgba(0,229,255,0.22)" strokeWidth="1.5" fill="none"/>

              {/* Highlight on upper body */}
              <ellipse cx="130" cy="114" rx="55" ry="36" fill="rgba(0,229,255,0.09)"/>

              {/* Eye — dark socket ring */}
              <circle cx="242" cy="136" r="27" fill="rgba(0,10,20,0.55)"/>
              {/* Eye — vivid iris */}
              <circle cx="242" cy="136" r="22" fill="url(#dg-eye)"/>
              {/* Eye — dark pupil */}
              <circle cx="242" cy="136" r="11" fill="#080808"/>
              {/* Eye — bright primary highlight (top-left) */}
              <circle cx="235" cy="129" r="5" fill="white" opacity="0.95"/>
              {/* Eye — tiny secondary highlight (bottom-right) */}
              <circle cx="247" cy="142" r="2.2" fill="white" opacity="0.45"/>

              {/* Mouth */}
              <path d="M280,148 Q288,152 280,156" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
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
