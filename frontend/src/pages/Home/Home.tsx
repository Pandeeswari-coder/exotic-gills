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
            <svg viewBox="0 0 300 280" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="dg-body" cx="38%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#26C6DA"/>
                  <stop offset="30%" stopColor="#00ACC1"/>
                  <stop offset="65%" stopColor="#00838F"/>
                  <stop offset="100%" stopColor="#006064"/>
                </radialGradient>
                <radialGradient id="dg-eye" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FF7043"/>
                  <stop offset="100%" stopColor="#BF360C"/>
                </radialGradient>
                <radialGradient id="dg-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* Outer glow halo */}
              <ellipse cx="155" cy="140" rx="130" ry="130" fill="url(#dg-glow)"/>

              {/* Tail fin */}
              <path d="M48,140 L8,88 L4,140 L8,192 Z" fill="#004D40" opacity="0.9"/>

              {/* Dorsal fin */}
              <path d="M76,36 Q152,6 228,36 Q240,58 228,68 Q152,46 76,68 Z" fill="#004D40" opacity="0.88"/>

              {/* Anal fin */}
              <path d="M76,242 Q152,270 228,242 Q240,220 228,210 Q152,230 76,210 Z" fill="#004D40" opacity="0.88"/>

              {/* Body */}
              <ellipse cx="155" cy="140" rx="108" ry="112" fill="url(#dg-body)"/>

              {/* Pectoral fin */}
              <ellipse cx="148" cy="168" rx="52" ry="16" fill="#00838F" transform="rotate(18 148 168)" opacity="0.7"/>

              {/* Vertical stripes */}
              <line x1="84" y1="40" x2="80" y2="240" stroke="#004D40" strokeWidth="5" opacity="0.3"/>
              <line x1="103" y1="29" x2="99" y2="251" stroke="#004D40" strokeWidth="4.5" opacity="0.26"/>
              <line x1="123" y1="24" x2="121" y2="256" stroke="#004D40" strokeWidth="4" opacity="0.24"/>
              <line x1="144" y1="22" x2="144" y2="258" stroke="#004D40" strokeWidth="4" opacity="0.22"/>
              <line x1="166" y1="24" x2="166" y2="256" stroke="#004D40" strokeWidth="4" opacity="0.2"/>
              <line x1="187" y1="27" x2="186" y2="253" stroke="#004D40" strokeWidth="3.5" opacity="0.18"/>
              <line x1="207" y1="34" x2="206" y2="246" stroke="#004D40" strokeWidth="3" opacity="0.16"/>
              <line x1="224" y1="44" x2="224" y2="236" stroke="#004D40" strokeWidth="2.5" opacity="0.14"/>

              {/* Iridescent wave lines */}
              <path d="M66,98 Q120,88 182,98 Q222,94 256,108" stroke="rgba(0,229,255,0.4)" strokeWidth="2.5" fill="none"/>
              <path d="M63,118 Q120,108 186,118 Q226,114 258,128" stroke="rgba(0,229,255,0.32)" strokeWidth="2" fill="none"/>
              <path d="M63,140 Q124,132 186,140 Q226,136 257,148" stroke="rgba(0,229,255,0.26)" strokeWidth="2" fill="none"/>
              <path d="M66,162 Q124,154 184,162 Q224,158 254,170" stroke="rgba(0,229,255,0.22)" strokeWidth="1.5" fill="none"/>
              <path d="M72,182 Q128,175 183,182 Q222,179 250,188" stroke="rgba(0,229,255,0.18)" strokeWidth="1.5" fill="none"/>

              {/* Body highlight */}
              <ellipse cx="118" cy="104" rx="48" ry="32" fill="rgba(0,229,255,0.07)"/>

              {/* Eye */}
              <circle cx="229" cy="126" r="22" fill="url(#dg-eye)"/>
              <circle cx="229" cy="126" r="14" fill="#0D0D0D"/>
              <circle cx="223" cy="120" r="5" fill="white" opacity="0.9"/>
              <circle cx="233" cy="131" r="2" fill="white" opacity="0.5"/>

              {/* Mouth */}
              <path d="M263,136 Q270,140 263,144" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
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
