import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCategories } from '../../services/api';
import {
  getLocalProducts,
  addLocalProduct,
  updateLocalProduct,
  toggleLocalAvailable,
  deleteLocalProduct,
} from '../../services/localProductStore';
import type { Product, Category } from '../../types';
import './AdminProducts.css';

const ADMIN_PASSWORD = 'fishowner2024';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  available: true,
};

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();

  /* ── Auth gate ── */
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('egf_admin') === '1');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('egf_admin', '1');
      setAuthed(true);
    } else {
      setPwError(true);
    }
  };

  /* ── Data ── */
  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  /* ── Form ── */
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Search / filter ── */
  const [search, setSearch]       = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => {
    if (!authed) return;
    setProducts(getLocalProducts());
    getCategories().then(setCategories).catch(() => {});
    setLoading(false);
  }, [authed]);

  const refresh = () => setProducts(getLocalProducts());

  /* ── Image pick ── */
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── Open add form ── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setError('');
    setShowForm(true);
  };

  /* ── Open edit form ── */
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      category: String(p.category?.id ?? ''),
      available: p.available,
    });
    setImageFile(null);
    setImagePreview(p.image
      ? p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image}`
      : '');
    setError('');
    setShowForm(true);
  };

  /* ── Save (create or update) ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock) {
      setError('Name, price and stock are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateLocalProduct(editingId, form, imageFile, imagePreview, categories);
        setSuccess('Fish updated successfully!');
      } else {
        await addLocalProduct(form, imageFile, imagePreview, categories);
        setSuccess('Fish added to shop!');
      }
      refresh();
      setShowForm(false);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  /* ── Toggle available ── */
  const toggleAvailable = (p: Product) => {
    toggleLocalAvailable(p.id);
    refresh();
  };

  /* ── Delete ── */
  const handleDelete = (p: Product) => {
    if (!window.confirm(`Remove "${p.name}" from the shop permanently?`)) return;
    deleteLocalProduct(p.id);
    setProducts(prev => prev.filter(x => x.id !== p.id));
    setSuccess(`"${p.name}" removed.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  /* ── Filter ── */
  const visible = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStock  = filterStock === 'all' ? true
                      : filterStock === 'in'  ? p.available
                      : !p.available;
    return matchSearch && matchStock;
  });

  const getImgSrc = (p: Product) => {
    if (!p.image) return '/placeholder-fish.jpg';
    return (p.image.startsWith('http') || p.image.startsWith('data:')) ? p.image : `http://localhost:8000${p.image}`;
  };

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
            {pwError && <p className="admin-gate__error">Incorrect password.</p>}
            <button type="submit" className="admin-gate__btn">Enter Admin Panel</button>
          </form>
          <button className="admin-gate__back" onClick={() => navigate(-1)}>← Back to Site</button>
        </div>
      </div>
    );
  }

  /* ── Main UI ── */
  return (
    <div className="ap-layout">
      {/* Sidebar */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar__brand">
          <span>🐠</span>
          <div>
            <strong>Exotic Gills and Fins</strong>
            <p>Owner Panel</p>
          </div>
        </div>

        <nav className="ap-sidebar__nav">
          <Link to="/admin" className="ap-sidebar__link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Customer Chat
          </Link>
          <Link to="/admin/products" className="ap-sidebar__link ap-sidebar__link--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Manage Fish
          </Link>
        </nav>

        <button
          className="ap-sidebar__exit"
          onClick={() => { sessionStorage.removeItem('egf_admin'); navigate('/'); }}
        >
          ← Exit to Site
        </button>
      </aside>

      {/* Main content */}
      <div className="ap-main">
        {/* Header */}
        <div className="ap-header">
          <div className="ap-header__left">
            <h1>Fish Shop Management</h1>
            <span>{products.length} items in shop</span>
          </div>
          <button className="ap-add-btn" onClick={openAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Fish
          </button>
        </div>

        {/* Notifications */}
        {success && <div className="ap-toast ap-toast--success">✓ {success}</div>}
        {error && !showForm && <div className="ap-toast ap-toast--error">✗ {error}</div>}

        {/* Filters */}
        <div className="ap-filters">
          <input
            type="text"
            placeholder="Search fish…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ap-search"
          />
          <div className="ap-filter-tabs">
            {(['all', 'in', 'out'] as const).map(f => (
              <button
                key={f}
                className={`ap-filter-tab ${filterStock === f ? 'active' : ''}`}
                onClick={() => setFilterStock(f)}
              >
                {f === 'all' ? 'All' : f === 'in' ? 'In Stock' : 'Out of Stock'}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="ap-loading">Loading products…</div>
        ) : visible.length === 0 ? (
          <div className="ap-empty">
            <span>🐠</span>
            <p>{search ? 'No fish match your search.' : 'No fish added yet. Click "Add New Fish" to start!'}</p>
          </div>
        ) : (
          <div className="ap-grid">
            {visible.map(p => (
              <div key={p.id} className={`ap-card ${!p.available ? 'ap-card--out' : ''}`}>
                <div className="ap-card__img-wrap">
                  <img
                    src={getImgSrc(p)}
                    alt={p.name}
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-fish.jpg'; }}
                  />
                  {!p.available && <span className="ap-card__out-badge">Out of Stock</span>}
                </div>
                <div className="ap-card__body">
                  <h3>{p.name}</h3>
                  <p className="ap-card__cat">{p.category?.name}</p>
                  <div className="ap-card__meta">
                    <span className="ap-card__price">₹{Number(p.price).toFixed(2)}</span>
                    <span className="ap-card__stock">Stock: {p.stock}</span>
                  </div>
                  <div className="ap-card__actions">
                    {/* Stock toggle */}
                    <button
                      className={`ap-card__toggle ${p.available ? 'ap-card__toggle--in' : 'ap-card__toggle--out'}`}
                      onClick={() => toggleAvailable(p)}
                      title={p.available ? 'Mark as Out of Stock' : 'Mark as In Stock'}
                    >
                      {p.available ? '✓ In Stock' : '✗ Out of Stock'}
                    </button>
                    {/* Edit */}
                    <button className="ap-card__edit" onClick={() => openEdit(p)} title="Edit">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button className="ap-card__delete" onClick={() => handleDelete(p)} title="Delete">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="ap-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="ap-modal">
            <div className="ap-modal__header">
              <h2>{editingId ? 'Edit Fish' : 'Add New Fish'}</h2>
              <button onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {error && <div className="ap-toast ap-toast--error ap-toast--inline">✗ {error}</div>}

            <form onSubmit={handleSave} className="ap-form">
              {/* Image upload */}
              <div className="ap-form__img-area" onClick={() => fileRef.current?.click()}>
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="ap-form__img-preview" />
                  : <div className="ap-form__img-placeholder">
                      <span>📷</span>
                      <p>Click to upload fish image</p>
                    </div>
                }
                <input ref={fileRef} type="file" accept="image/*" onChange={onImageChange} style={{ display: 'none' }} />
                {imagePreview && (
                  <button
                    type="button"
                    className="ap-form__img-change"
                    onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  >
                    Change Image
                  </button>
                )}
              </div>

              <div className="ap-form__row">
                <div className="ap-form__field">
                  <label>Fish Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Discus"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-form__field">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ap-form__row">
                <div className="ap-form__field">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-form__field">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="ap-form__field">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the fish — color, size, temperament…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="ap-form__available">
                <label className="ap-form__toggle-label">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                  />
                  <span className="ap-form__toggle-track">
                    <span className="ap-form__toggle-thumb" />
                  </span>
                  {form.available ? 'Available for sale' : 'Not available (hidden from customers)'}
                </label>
              </div>

              <div className="ap-form__footer">
                <button type="button" className="ap-form__cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="ap-form__save" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Fish' : 'Add to Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
