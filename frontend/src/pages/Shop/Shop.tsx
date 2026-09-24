import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Product, Category, ProductQueryParams } from '../../types';
import { getProducts, getCategories } from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Shop.css';

const STATIC_CATEGORIES: Category[] = [
  { id: '1', name: 'Fish',              slug: 'fish',              subcategories: [
    { id: '1a', name: 'Cichlids',  slug: 'cichlids' },
    { id: '1b', name: 'Stingray',  slug: 'stingray' },
    { id: '1c', name: 'Arowana',   slug: 'arowana' },
    { id: '1d', name: 'Plecos',    slug: 'plecos' },
  ]},
  { id: '2', name: 'Plants',            slug: 'plants',            subcategories: [
    { id: '2a', name: 'Ferns',    slug: 'ferns' },
    { id: '2b', name: 'Anubias',  slug: 'anubias' },
  ]},
  { id: '3', name: 'Driftwoods',        slug: 'driftwoods',        subcategories: [
    { id: '3a', name: 'Japonica Woods', slug: 'japonica-woods' },
    { id: '3b', name: 'Spiral Woods',   slug: 'spiral-woods'   },
  ]},
  { id: '4', name: 'Rocks',             slug: 'rocks',             subcategories: [
    { id: '4a', name: 'Seiyur Rock',  slug: 'seiyur-rock'  },
    { id: '4b', name: 'Dragon Stone', slug: 'dragon-stone' },
  ]},
  { id: '5', name: 'Aquarium Filters',  slug: 'aquarium-filters',  subcategories: [
    { id: '5a', name: 'Sponge Filter',    slug: 'sponge-filter'    },
    { id: '5b', name: 'Canister Filter',  slug: 'canister-filter'  },
    { id: '5c', name: 'Top Filter',       slug: 'top-filter'       },
    { id: '5d', name: 'Hang On Filter',   slug: 'hang-on-filter'   },
  ]},
];

const Shop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // All filter state — synced from URL in one effect, fetched in another
  const [searchQuery, setSearchQuery]         = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category');
    return cat ? [cat] : [];
  });
  const [priceRange, setPriceRange]           = useState<[number, number]>([0, 10000]);
  const [availableOnly, setAvailableOnly]     = useState(false);

  // Sync URL params → state (one place, one effect — prevents double-fetch race)
  useEffect(() => {
    const cat    = searchParams.get('category');
    const search = searchParams.get('search') || '';
    setSelectedCategories(cat ? [cat] : []);
    setSearchQuery(search);
    if (cat) {
      setTimeout(() => {
        document.getElementById('shop-main')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    getCategories()
      .then(cats => setCategories(cats.length > 0 ? cats : STATIC_CATEGORIES))
      .catch(() => setCategories(STATIC_CATEGORIES));
  }, []);

  // fetchProducts depends only on state — never on searchParams directly
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: ProductQueryParams = {
        search: searchQuery || undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 10000 ? priceRange[1] : undefined,
        available: availableOnly || undefined,
      };

      if (selectedCategories.length === 1) {
        params.category = selectedCategories[0];
      }

      const prods = await getProducts(params);
      setProducts(prods);
    } catch {
      setError('Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategories, priceRange, availableOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setPriceRange([0, 10000]);
    setAvailableOnly(false);
  };

  return (
    <div className="shop-page">
      <div
        className="shop-hero"
        onMouseMove={handleMouseMove}
      >
        {/* Rising bubbles */}
        <div className="shop-hero__bubbles" aria-hidden>
          <span className="shop-bubble shop-bubble--1" />
          <span className="shop-bubble shop-bubble--2" />
          <span className="shop-bubble shop-bubble--3" />
          <span className="shop-bubble shop-bubble--4" />
          <span className="shop-bubble shop-bubble--5" />
          <span className="shop-bubble shop-bubble--6" />
          <span className="shop-bubble shop-bubble--7" />
          <span className="shop-bubble shop-bubble--8" />
          <span className="shop-bubble shop-bubble--9" />
          <span className="shop-bubble shop-bubble--10" />
          <span className="shop-bubble shop-bubble--11" />
          <span className="shop-bubble shop-bubble--12" />
        </div>

        {/* Mouse-tracking spotlight */}
        <div
          className="shop-hero__spotlight"
          style={{
            background: `radial-gradient(circle 420px at ${spotlight.x}% ${spotlight.y}%, rgba(0,229,255,0.16) 0%, rgba(0,188,212,0.07) 40%, transparent 68%)`
          }}
          aria-hidden
        />

        {/* Seaweed / coral decorations */}
        <div className="shop-hero__decor" aria-hidden>
          <span className="shop-seaweed shop-seaweed--l1">🌿</span>
          <span className="shop-seaweed shop-seaweed--l2">🪸</span>
          <span className="shop-seaweed shop-seaweed--r1">🌿</span>
          <span className="shop-seaweed shop-seaweed--r2">🪸</span>
        </div>

        <div className="shop-hero__content">
          <p className="shop-hero__eyebrow">✦ &nbsp;Hand-Picked · Rare · Exotic&nbsp; ✦</p>
          <h1 className="shop-hero__title">
            <span className="shop-hero__title-line1">Discover the</span>
            <span className="shop-hero__title-line2">Ocean's Finest</span>
          </h1>
          <p className="shop-hero__sub">
            Premium fish, aquatic plants, driftwoods, rocks &amp; filters — <br className="shop-hero__br" />
            sourced from trusted breeders, delivered to your door.
          </p>

          {/* Interactive category cards */}
          <div className="shop-hero__categories">
            {[
              { emoji: '🐠', name: 'Fish',              slug: 'fish',             desc: 'Cichlids, Arowana & more' },
              { emoji: '🌿', name: 'Plants',            slug: 'plants',           desc: 'Ferns, Anubias & more' },
              { emoji: '🪵', name: 'Driftwoods',        slug: 'driftwoods',       desc: 'Natural aquascape wood' },
              { emoji: '🪨', name: 'Rocks',             slug: 'rocks',            desc: 'Stones & hardscape' },
              { emoji: '⚙️', name: 'Aquarium Filters',  slug: 'aquarium-filters', desc: 'Clean & clear water' },
            ].map(cat => (
              <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="shop-cat-card">
                <span className="shop-cat-card__icon">{cat.emoji}</span>
                <span className="shop-cat-card__name">{cat.name}</span>
                <span className="shop-cat-card__desc">{cat.desc}</span>
                <span className="shop-cat-card__arrow">→</span>
              </Link>
            ))}
          </div>

          <a href="#shop-main" className="shop-hero__cta">
            Explore All Products
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

        <div className="shop-hero__wave" aria-hidden>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="var(--light-bg)" />
          </svg>
        </div>
      </div>

      <div className="shop-layout" id="shop-main">
        {/* Mobile filter toggle */}
        <button className="filter-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="12" y2="18" />
          </svg>
          Filters
        </button>

        {/* Sidebar */}
        <aside className={`shop-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="clear-filters" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>

          <div className="filter-group">
            <h4>Categories</h4>
            {categories.length === 0 ? (
              <p className="no-categories">No categories found</p>
            ) : (
              categories.map((cat) => {
                const hasSubs = (cat.subcategories?.length ?? 0) > 0;
                const isExpanded = expandedCategories.has(cat.slug);
                return (
                  <div key={cat.id} className="filter-category-group">
                    <div className="filter-category-main">
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.slug)}
                          onChange={() => handleCategoryToggle(cat.slug)}
                        />
                        <span>{cat.name}</span>
                      </label>
                      {hasSubs && (
                        <button
                          className="filter-category-expand"
                          onClick={() => setExpandedCategories(prev => {
                            const next = new Set(prev);
                            next.has(cat.slug) ? next.delete(cat.slug) : next.add(cat.slug);
                            return next;
                          })}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      )}
                    </div>
                    {hasSubs && isExpanded && (
                      <div className="filter-subcategories">
                        {cat.subcategories!.map(sub => (
                          <label key={sub.id} className="filter-checkbox filter-checkbox--sub">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(sub.slug)}
                              onChange={() => handleCategoryToggle(sub.slug)}
                            />
                            <span>{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <div className="price-field">
                <label>Min (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                />
              </div>
              <span className="price-dash">-</span>
              <div className="price-field">
                <label>Max (₹)</label>
                <input
                  type="number"
                  min={priceRange[0]}
                  max={10000}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={10000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="price-slider"
            />
            <div className="price-labels">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <label className="filter-toggle-switch">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product grid */}
        <main className="shop-main">
          <div className="shop-results-header">
            {!loading && (
              <p className="results-count">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
                {searchParams.get('search') && (
                  <span> for &quot;{searchParams.get('search')}&quot;</span>
                )}
              </p>
            )}
          </div>

          {loading ? (
            <div className="shop-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : error ? (
            <div className="shop-error">
              <p>{error}</p>
              <button className="btn-primary" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <span className="empty-icon">&#x1F41F;</span>
              <h3>No fish found</h3>
              <p>Try adjusting your filters or search terms.</p>
              <button className="btn-outline-dark" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="shop-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
