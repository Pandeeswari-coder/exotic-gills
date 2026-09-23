import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product, Category, ProductQueryParams } from '../../types';
import { getProducts, getCategories } from '../../services/api';
import { getLocalProducts } from '../../services/localProductStore';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Shop.css';

const Shop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category');
    return cat ? [cat] : [];
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [availableOnly, setAvailableOnly] = useState(
    searchParams.get('available') === 'true'
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: ProductQueryParams = {
        search: searchParams.get('search') || undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 10000 ? priceRange[1] : undefined,
        available: availableOnly || undefined,
      };

      if (selectedCategories.length === 1) {
        params.category = selectedCategories[0];
      }

      // Merge: local products first, then API products (skip duplicates by id)
      const localProds = getLocalProducts();
      let apiProds: Product[] = [];
      try { apiProds = await getProducts(params); } catch { /* backend offline */ }

      const apiFiltered = apiProds.filter(a => !localProds.some(l => l.id === a.id));
      let merged = [...localProds, ...apiFiltered];

      // Apply filters to local products too
      if (params.search) {
        const q = params.search.toLowerCase();
        merged = merged.filter(p => p.name.toLowerCase().includes(q));
      }
      if (params.available) merged = merged.filter(p => p.available);
      if (params.min_price) merged = merged.filter(p => p.price >= (params.min_price ?? 0));
      if (params.max_price && params.max_price < 10000) merged = merged.filter(p => p.price <= params.max_price!);

      setProducts(merged);
    } catch {
      // local products still shown above
    } finally {
      setLoading(false);
    }
  }, [searchParams, selectedCategories, priceRange, availableOnly]);

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
    setPriceRange([0, 10000]);
    setAvailableOnly(false);
  };

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <h1>Our Fish Collection</h1>
        <p>Browse our premium selection of Discus and tropical fish</p>
      </div>

      <div className="shop-layout">
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
              categories.map((cat) => (
                <label key={cat.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => handleCategoryToggle(cat.slug)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))
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
