import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Category, Product } from '../../types';
import { getProduct, updateProduct, getCategories } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.is_admin;

  const [product, setProduct]     = useState<Product | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [quantity, setQuantity]   = useState(1);
  const [addedMsg, setAddedMsg]   = useState('');

  /* ── admin edit state ── */
  const [editName, setEditName]           = useState('');
  const [editPrice, setEditPrice]         = useState('');
  const [editDesc, setEditDesc]           = useState('');
  const [editStock, setEditStock]         = useState('');
  const [editAvail, setEditAvail]         = useState(true);
  const [editCatId, setEditCatId]         = useState('');
  const [categories, setCategories]       = useState<Category[]>([]);
  const [newImageFile, setNewImageFile]   = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [saveMsg, setSaveMsg]             = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setEditName(p.name);
        setEditPrice(String(p.price));
        setEditDesc(p.description);
        setEditStock(String(p.stock));
        setEditAvail(p.available);
        setEditCatId(p.category?.id ?? '');
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      getCategories().then(setCategories).catch(() => {});
    }
  }, [isAdmin]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/cart');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!product || !id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const fd = new FormData();
      fd.append('name', editName);
      fd.append('price', editPrice);
      fd.append('description', editDesc);
      fd.append('stock', editStock);
      fd.append('available', String(editAvail));
      if (editCatId) fd.append('category_id', editCatId);
      if (newImageFile) fd.append('image', newImageFile);
      const updated = await updateProduct(id, fd);
      setProduct(updated);
      setNewImageFile(null);
      setPreviewUrl(null);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch {
      setSaveMsg('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getItemLabel = (): string => {
    if (!product) return 'item';
    const text = `${product.category?.name ?? ''} ${product.category?.slug ?? ''}`.toLowerCase();
    if (/plant|anubias|moss|fern|java|stem|float|hygro|crypto|buce|lily|val|wisteria|hornwort|rotala|ludwigia|cabomba|sword/.test(text)) return 'plant';
    if (/rock|stone|driftwood|decor|wood|substrate|gravel|sand|ornament/.test(text)) return 'decoration';
    if (/filter|pump|heater|light|equip|accessory|accessories|co2|medicine|food|supply/.test(text)) return 'item';
    return 'fish';
  };

  const displayImage = previewUrl ?? (
    product?.image
      ? (product.image.startsWith('http') || product.image.startsWith('data:'))
        ? product.image
        : `http://localhost:8000${product.image}`
      : '/placeholder-fish.svg'
  );

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="detail-skeleton">
          <div className="skeleton-img" />
          <div className="skeleton-info">
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line narrow" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="detail-error">
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed.</p>
          <Link to="/shop" className="btn-back">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail">
        {/* Image column */}
        <div className="detail-image-col">
          <div className="detail-image-wrap">
            <img
              src={displayImage}
              alt={product.name}
              className="detail-image"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-fish.svg'; }}
            />
          </div>
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <button
                className="btn-change-image"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
            </>
          )}
        </div>

        {/* Info column */}
        <div className="detail-info-col">
          {isAdmin ? (
            /* ── Admin inline edit form ── */
            <div className="admin-edit-form">
              <p className="admin-edit-label">Category</p>
              <select
                className="admin-edit-input"
                value={editCatId}
                onChange={(e) => setEditCatId(e.target.value)}
              >
                <option value="">— select category —</option>
                {categories.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {c.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                    <option value={c.id}>{c.name} (top-level)</option>
                  </optgroup>
                ))}
              </select>

              <p className="admin-edit-label">Name</p>
              <input
                className="admin-edit-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <p className="admin-edit-label">Price (₹)</p>
              <input
                className="admin-edit-input"
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />

              <p className="admin-edit-label">Stock</p>
              <input
                className="admin-edit-input"
                type="number"
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
              />

              <p className="admin-edit-label">Description</p>
              <textarea
                className="admin-edit-input admin-edit-textarea"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
              />

              <label className="admin-edit-avail">
                <input
                  type="checkbox"
                  checked={editAvail}
                  onChange={(e) => setEditAvail(e.target.checked)}
                />
                Available for sale
              </label>

              <button
                className="btn-add-cart"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: '1rem' }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>

              {saveMsg && (
                <div className={`added-notice ${saveMsg.includes('failed') ? 'error-notice' : ''}`}>
                  {saveMsg}
                </div>
              )}
            </div>
          ) : (
            /* ── Customer view ── */
            <>
              <p className="detail-category">{product.category?.name}</p>
              <h1 className="detail-name">{product.name}</h1>

              <div className="detail-price-row">
                <span className="detail-price">₹{Number(product.price).toFixed(2)}</span>
                <span className={`detail-availability ${product.available ? 'in-stock' : 'out-of-stock'}`}>
                  {product.available ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="detail-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>

              {product.available && (
                <>
                  <div className="qty-selector">
                    <label>Quantity</label>
                    <div className="qty-controls">
                      <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}>+</button>
                    </div>
                    <p className="stock-note">{product.stock} available</p>
                  </div>

                  <div className="detail-actions">
                    <button className="btn-add-cart" onClick={handleAddToCart}>Add to Cart</button>
                    <button className="btn-buy-now" onClick={handleBuyNow}>Buy Now</button>
                  </div>

                  {addedMsg && (
                    <div className="added-notice">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {addedMsg}
                    </div>
                  )}
                </>
              )}

              {!product.available && (
                <div className="out-of-stock-msg">
                  This {getItemLabel()} is currently not available. Please check back later.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
