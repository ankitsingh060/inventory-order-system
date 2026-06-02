/**
 * Orders.jsx — Order management page.
 *
 * Features:
 *  - Table of all orders with customer and total info
 *  - View Order Details modal (items breakdown)
 *  - Create Order wizard modal:
 *      1. Select a customer
 *      2. Add product line items (dynamic rows)
 *      3. Real-time total preview
 *  - Cancel/Delete order with confirmation (restores inventory)
 *  - Toast feedback on every action
 */

import React, { useEffect, useState, useCallback } from 'react';
import { orderApi, customerApi, productApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastContext } from '../components/Toast';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function Orders() {
  const { addToast } = useToastContext();

  // Data
  const [orders,    setOrders]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Modal open flags
  const [createOpen, setCreateOpen]  = useState(false);
  const [detailOpen, setDetailOpen]  = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Create form state
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formErrors, setFormErrors] = useState({});
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  /* ── Data loading ───────────────────────────────────────────────────────── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderApi.getAll();
      setOrders(res.data);
    } catch {
      addToast('error', 'Load Failed', 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Load customers and products for the create form dropdowns
  useEffect(() => {
    fetchOrders();
    customerApi.getAll().then((r) => setCustomers(r.data)).catch(() => {});
    productApi.getAll().then((r) => setProducts(r.data)).catch(() => {});
  }, [fetchOrders]);

  /* ── Computed order total preview ───────────────────────────────────────── */
  const computedTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === parseInt(item.product_id));
    return sum + (product ? product.price * (parseInt(item.quantity) || 0) : 0);
  }, 0);

  /* ── Create order helpers ───────────────────────────────────────────────── */
  const openCreate = () => {
    setCustomerId('');
    setItems([{ product_id: '', quantity: 1 }]);
    setFormErrors({});
    setCreateOpen(true);
  };

  const addItemRow    = () => setItems((p) => [...p, { product_id: '', quantity: 1 }]);
  const removeItemRow = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // Clear errors as user types
    setFormErrors((p) => ({ ...p, items: '' }));
  };

  const validateCreateForm = () => {
    const errs = {};
    if (!customerId)           errs.customerId = 'Please select a customer.';
    if (items.some((i) => !i.product_id || parseInt(i.quantity) < 1))
      errs.items = 'All items must have a product and quantity ≥ 1.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;
    setSaving(true);
    try {
      await orderApi.create({
        customer_id: parseInt(customerId),
        items: items.map((i) => ({
          product_id: parseInt(i.product_id),
          quantity:   parseInt(i.quantity),
        })),
      });
      addToast('success', 'Order Placed', `Order created for ${customers.find((c) => c.id === parseInt(customerId))?.full_name}.`);
      setCreateOpen(false);
      fetchOrders();
      // Refresh product list to reflect updated stock
      productApi.getAll().then((r) => setProducts(r.data)).catch(() => {});
    } catch (err) {
      addToast('error', 'Order Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const openDelete = (o) => { setDeleteTarget(o); setDeleteOpen(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orderApi.delete(deleteTarget.id);
      addToast('success', 'Order Cancelled', `Order #${deleteTarget.id} has been cancelled and inventory restored.`);
      setDeleteOpen(false);
      fetchOrders();
      productApi.getAll().then((r) => setProducts(r.data)).catch(() => {});
    } catch (err) {
      addToast('error', 'Cancel Failed', err.message);
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
          <h1>Orders</h1>
          <p>{orders.length} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Order
        </button>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <h2>All Orders</h2>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛍️</div>
            <h3>No orders yet</h3>
            <p>Click "New Order" to place your first order.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: '#94A3B8', fontWeight: 600 }}>#{o.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.customer.full_name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{o.customer.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {o.order_items.length} item{o.order_items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#4F46E5' }}>{fmt(o.total_amount)}</td>
                      <td>
                        <span className={`badge ${o.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ color: '#94A3B8', fontSize: 13 }}>{fmtDate(o.created_at)}</td>
                      <td>
                        <div className="td-actions">
                          <button
                            className="btn-icon edit"
                            title="View details"
                            onClick={() => { setDetailOrder(o); setDetailOpen(true); }}
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Cancel order"
                            onClick={() => openDelete(o)}
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
              <span>{orders.length} orders</span>
              <span style={{ fontWeight: 700, color: '#4F46E5' }}>
                Total Revenue: {fmt(orders.reduce((s, o) => s + o.total_amount, 0))}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Create Order Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm" /> Placing…</> : `Place Order • ${fmt(computedTotal)}`}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          {/* Customer selector */}
          <div className="form-group">
            <label className="form-label">Customer <span>*</span></label>
            <select
              className={`form-input ${formErrors.customerId ? 'error' : ''}`}
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setFormErrors((p) => ({ ...p, customerId: '' })); }}
            >
              <option value="">— Select a customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
            {formErrors.customerId && <p className="form-error">{formErrors.customerId}</p>}
          </div>

          {/* Line items */}
          <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
            Order Items <span>*</span>
          </label>

          <div className="order-items-list">
            {items.map((item, i) => {
              const selectedProduct = products.find((p) => p.id === parseInt(item.product_id));
              return (
                <div key={i} className="order-item-row">
                  {/* Product select */}
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Product</label>
                    <select
                      className="form-input"
                      value={item.product_id}
                      onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                    >
                      <option value="">— Choose product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                          {p.name} — ${p.price.toFixed(2)} (Stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Qty</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max={selectedProduct?.quantity || 999}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    />
                  </div>

                  {/* Line total preview */}
                  {selectedProduct && (
                    <div style={{ paddingBottom: 2, color: '#4F46E5', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                      {fmt(selectedProduct.price * (parseInt(item.quantity) || 0))}
                    </div>
                  )}

                  {/* Remove row */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => removeItemRow(i)}
                      title="Remove item"
                      style={{ marginBottom: 2 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {formErrors.items && <p className="form-error" style={{ marginTop: 6 }}>{formErrors.items}</p>}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10 }}
            onClick={addItemRow}
          >
            + Add Item
          </button>

          {/* Total preview bar */}
          <div className="order-total-bar">
            <span className="label">Estimated Total</span>
            <span className="amount">{fmt(computedTotal)}</span>
          </div>
        </form>
      </Modal>

      {/* ── Order Details Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Order #${detailOrder?.id} Details`}
        size="md"
      >
        {detailOrder && (
          <div>
            {/* Customer info */}
            <div style={{
              background: '#F8FAFC', borderRadius: 8, padding: '14px 16px',
              marginBottom: 20, border: '1px solid #E2E8F0'
            }}>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Customer
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{detailOrder.customer.full_name}</div>
              <div style={{ color: '#4F46E5', fontSize: 14 }}>{detailOrder.customer.email}</div>
              {detailOrder.customer.phone && (
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{detailOrder.customer.phone}</div>
              )}
            </div>

            {/* Order meta */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <span className={`badge ${detailOrder.status === 'pending' ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: 6 }}>
                  {detailOrder.status}
                </span>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{fmtDate(detailOrder.created_at)}</div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Items ({detailOrder.order_items.length})
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              {detailOrder.order_items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < detailOrder.order_items.length - 1 ? '1px solid #E2E8F0' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      SKU: {item.product.sku} · Unit price: {fmt(item.unit_price)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#4F46E5' }}>
                      {fmt(item.unit_price * item.quantity)}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>×{item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 16, padding: '14px 16px',
              background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE',
            }}>
              <span style={{ fontWeight: 700, color: '#4F46E5', fontSize: 15 }}>Grand Total</span>
              <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: 20 }}>
                {fmt(detailOrder.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Cancel Order"
        message={`Cancel Order #${deleteTarget?.id}? Inventory will be automatically restored.`}
        confirmText="Cancel Order"
        loading={deleting}
      />
    </div>
  );
}
