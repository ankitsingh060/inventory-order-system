/**
 * Products.jsx — Full product management page.
 *
 * Features:
 *  - Table listing all products
 *  - Client-side search/filter
 *  - Add Product modal (POST /products)
 *  - Edit Product modal (PUT /products/:id)
 *  - Delete with confirmation dialog (DELETE /products/:id)
 *  - Toast feedback on every action
 */

import React, { useEffect, useState, useCallback } from 'react';
import { productApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastContext } from '../components/Toast';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '', description: '' };

function StockBadge({ qty }) {
  if (qty === 0)   return <span className="badge badge-danger">Out of Stock</span>;
  if (qty < 10)    return <span className="badge badge-warning">{qty} left</span>;
  return               <span className="badge badge-success">In Stock</span>;
}

/* ── Product Form (shared by Add & Edit) ─────────────────────────────────── */
function ProductForm({ form, onChange, errors }) {
  return (
    <>
      <div className="form-row">
        {/* Product name */}
        <div className="form-group">
          <label className="form-label">Name <span>*</span></label>
          <input
            className={`form-input ${errors.name ? 'error' : ''}`}
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g. Wireless Keyboard"
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        {/* SKU */}
        <div className="form-group">
          <label className="form-label">SKU / Code <span>*</span></label>
          <input
            className={`form-input ${errors.sku ? 'error' : ''}`}
            name="sku"
            value={form.sku}
            onChange={onChange}
            placeholder="e.g. WK-001"
          />
          {errors.sku && <p className="form-error">{errors.sku}</p>}
          <p className="form-hint">Must be unique across all products.</p>
        </div>
      </div>

      <div className="form-row">
        {/* Price */}
        <div className="form-group">
          <label className="form-label">Price ($) <span>*</span></label>
          <input
            className={`form-input ${errors.price ? 'error' : ''}`}
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={onChange}
            placeholder="0.00"
          />
          {errors.price && <p className="form-error">{errors.price}</p>}
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity <span>*</span></label>
          <input
            className={`form-input ${errors.quantity ? 'error' : ''}`}
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={onChange}
            placeholder="0"
          />
          {errors.quantity && <p className="form-error">{errors.quantity}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Optional product description…"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function Products() {
  const { addToast } = useToastContext();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  // Modal state
  const [addOpen,    setAddOpen]    = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch {
      addToast('error', 'Load Failed', 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Filtering ──────────────────────────────────────────────────────────── */
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Form helpers ───────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error for the field being edited
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = (isEdit = false) => {
    const errs = {};
    if (!form.name.trim())            errs.name     = 'Name is required.';
    if (!isEdit && !form.sku.trim())  errs.sku      = 'SKU is required.';
    if (!form.price || +form.price <= 0) errs.price = 'Price must be > 0.';
    if (form.quantity === '' || +form.quantity < 0) errs.quantity = 'Quantity must be ≥ 0.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Add ────────────────────────────────────────────────────────────────── */
  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setAddOpen(true); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await productApi.create({
        name:        form.name.trim(),
        sku:         form.sku.trim().toUpperCase(),
        price:       parseFloat(form.price),
        quantity:    parseInt(form.quantity, 10),
        description: form.description.trim() || null,
      });
      addToast('success', 'Product Added', `"${form.name}" has been added to the catalog.`);
      setAddOpen(false);
      fetchProducts();
    } catch (err) {
      addToast('error', 'Failed to Add', err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Edit ───────────────────────────────────────────────────────────────── */
  const openEdit = (product) => {
    setEditTarget(product);
    setForm({
      name:        product.name,
      sku:         product.sku,        // Read-only in edit mode
      price:       product.price,
      quantity:    product.quantity,
      description: product.description || '',
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validate(true)) return;
    setSaving(true);
    try {
      await productApi.update(editTarget.id, {
        name:        form.name.trim(),
        price:       parseFloat(form.price),
        quantity:    parseInt(form.quantity, 10),
        description: form.description.trim() || null,
      });
      addToast('success', 'Product Updated', `"${form.name}" has been updated.`);
      setEditOpen(false);
      fetchProducts();
    } catch (err) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const openDelete = (product) => { setDeleteTarget(product); setDeleteOpen(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productApi.delete(deleteTarget.id);
      addToast('success', 'Product Deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteOpen(false);
      fetchProducts();
    } catch (err) {
      addToast('error', 'Delete Failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Product Catalog</h1>
          <p>{products.length} products total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      {/* Content card */}
      <div className="card">
        {/* Card header with search */}
        <div className="card-header">
          <h2>All Products</h2>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>{search ? 'No results found' : 'No products yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Add your first product to get started.'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={{ color: '#94A3B8', fontWeight: 500 }}>{p.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                            {p.description.length > 50
                              ? p.description.slice(0, 50) + '…'
                              : p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: 12, background: '#F1F5F9', padding: '3px 7px', borderRadius: 4 }}>
                          {p.sku}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{p.quantity}</td>
                      <td><StockBadge qty={p.quantity} /></td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="btn-icon edit"
                            title="Edit product"
                            onClick={() => openEdit(p)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Delete product"
                            onClick={() => openDelete(p)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Showing {filtered.length} of {products.length} products</span>
            </div>
          </>
        )}
      </div>

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Product"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm" /> Saving…</> : 'Add Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdd}>
          <ProductForm form={form} onChange={handleChange} errors={errors} />
        </form>
      </Modal>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit: ${editTarget?.name || ''}`}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm" /> Saving…</> : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEdit}>
          {/* SKU is read-only in edit mode */}
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              className="form-input"
              value={form.sku}
              disabled
              style={{ background: '#F1F5F9', cursor: 'not-allowed', color: '#94A3B8' }}
            />
            <p className="form-hint">SKU cannot be changed after creation.</p>
          </div>
          <ProductForm form={form} onChange={handleChange} errors={errors} />
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
