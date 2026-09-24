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
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Premium Quality Fish</p>
          <h1 className="hero__title">Premium Discus Fish</h1>
          <p className="hero__subtitle">Servicing the Hobby for Over 10 Years</p>
          <Link to="/shop" className="hero__cta">
            SHOP NOW
          </Link>
        </div>
        {/* SVG tropical fish swimming in background */}
        <div className="hero__fish-scene" aria-hidden>
          {/* Clownfish */}
          <span className="hero-fish hero-fish--1">
            <svg viewBox="0 0 100 58" width="90" height="52" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.9">
                <polygon points="16,29 1,6 1,52" fill="#E8500A"/>
                <ellipse cx="58" cy="29" rx="40" ry="22" fill="#F4641E"/>
                <path d="M30,8 Q50,-3 73,8" fill="#D94010"/>
                <ellipse cx="55" cy="47" rx="17" ry="7" fill="#E8500A" transform="rotate(-20 55 47)"/>
                <ellipse cx="44" cy="29" rx="5" ry="20" fill="white" opacity="0.95"/>
                <ellipse cx="67" cy="29" rx="4" ry="17" fill="white" opacity="0.95"/>
                <ellipse cx="44" cy="29" rx="5.5" ry="20.5" fill="none" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.5"/>
                <ellipse cx="67" cy="29" rx="4.5" ry="17.5" fill="none" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.5"/>
                <ellipse cx="90" cy="29" rx="10" ry="17" fill="#D94010"/>
                <circle cx="93" cy="22" r="6" fill="white"/>
                <circle cx="94" cy="22" r="4" fill="#111"/>
                <circle cx="95.5" cy="20.5" r="1.5" fill="white"/>
              </g>
            </svg>
          </span>
          {/* Blue Discus */}
          <span className="hero-fish hero-fish--2">
            <svg viewBox="0 0 90 80" width="65" height="58" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.88">
                <polygon points="12,40 0,18 0,62" fill="#1565C0"/>
                <ellipse cx="48" cy="40" rx="36" ry="30" fill="#1976D2"/>
                <path d="M18,12 Q48,-2 78,12" fill="#0D47A1"/>
                <path d="M18,68 Q48,82 78,68" fill="#0D47A1"/>
                <ellipse cx="48" cy="40" rx="27" ry="22" fill="none" stroke="#4FC3F7" strokeWidth="2.5" opacity="0.55"/>
                <ellipse cx="48" cy="40" rx="17" ry="14" fill="none" stroke="#29B6F6" strokeWidth="2" opacity="0.45"/>
                <line x1="35" y1="12" x2="32" y2="68" stroke="#0D47A1" strokeWidth="2.5" opacity="0.4"/>
                <line x1="50" y1="10" x2="50" y2="70" stroke="#0D47A1" strokeWidth="2.5" opacity="0.4"/>
                <line x1="65" y1="12" x2="62" y2="68" stroke="#0D47A1" strokeWidth="2.5" opacity="0.4"/>
                <circle cx="80" cy="32" r="7.5" fill="white"/>
                <circle cx="81" cy="32" r="5" fill="#0D1A26"/>
                <circle cx="82.5" cy="30.5" r="1.5" fill="white"/>
              </g>
            </svg>
          </span>
          {/* Betta fish */}
          <span className="hero-fish hero-fish--3">
            <svg viewBox="0 0 130 75" width="100" height="58" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.88">
                <path d="M20,37 Q-15,8 -10,-2 Q12,28 -10,76 Q-15,68 20,37 Z" fill="#7B1FA2" opacity="0.8"/>
                <ellipse cx="72" cy="37" rx="48" ry="18" fill="#9C27B0"/>
                <path d="M35,20 Q68,3 98,19" fill="none" stroke="#CE93D8" strokeWidth="8" strokeLinecap="round" opacity="0.85"/>
                <path d="M50,52 Q30,70 18,80" stroke="#AB47BC" strokeWidth="6" strokeLinecap="round" fill="none"/>
                <path d="M72,53 Q55,72 45,80" stroke="#AB47BC" strokeWidth="5" strokeLinecap="round" fill="none"/>
                <ellipse cx="72" cy="31" rx="34" ry="11" fill="none" stroke="#E1BEE7" strokeWidth="1.5" opacity="0.5"/>
                <ellipse cx="110" cy="35" rx="13" ry="14" fill="#7B1FA2"/>
                <circle cx="115" cy="28" r="6" fill="white"/>
                <circle cx="116" cy="28" r="4" fill="#1a1a1a"/>
                <circle cx="117.5" cy="26.5" r="1.5" fill="white"/>
              </g>
            </svg>
          </span>
          {/* Neon tetra */}
          <span className="hero-fish hero-fish--4">
            <svg viewBox="0 0 75 35" width="58" height="27" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.88">
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
          {/* Small clownfish */}
          <span className="hero-fish hero-fish--5">
            <svg viewBox="0 0 100 58" width="65" height="38" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.85">
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
