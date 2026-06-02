/**
 * Customers.jsx — Customer management page.
 *
 * Features:
 *  - Table of all customers
 *  - Client-side search
 *  - Add Customer modal (POST /customers)
 *  - Delete with confirmation (DELETE /customers/:id)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { customerApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastContext } from '../components/Toast';

const EMPTY_FORM = { full_name: '', email: '', phone: '' };

/* ── Validation ──────────────────────────────────────────────────────────── */
function validateCustomerForm(form) {
  const errs = {};
  if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
  if (!form.email.trim())     errs.email     = 'Email is required.';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
  return errs;
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function Customers() {
  const { addToast } = useToastContext();

  const [customers,     setCustomers]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [addOpen,       setAddOpen]       = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [errors,        setErrors]        = useState({});
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAll();
      setCustomers(res.data);
    } catch {
      addToast('error', 'Load Failed', 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  /* ── Filter ─────────────────────────────────────────────────────────────── */
  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Form handlers ──────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  /* ── Add ────────────────────────────────────────────────────────────────── */
  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setAddOpen(true); };

  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validateCustomerForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await customerApi.create({
        full_name: form.full_name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim() || null,
      });
      addToast('success', 'Customer Added', `${form.full_name} has been registered.`);
      setAddOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast('error', 'Failed to Add', err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const openDelete = (c) => { setDeleteTarget(c); setDeleteOpen(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerApi.delete(deleteTarget.id);
      addToast('success', 'Customer Removed', `${deleteTarget.full_name} has been deleted.`);
      setDeleteOpen(false);
      fetchCustomers();
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
          <h1>Customers</h1>
          <p>{customers.length} registered accounts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Customer
        </button>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <h2>All Customers</h2>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>{search ? 'No results' : 'No customers yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Add your first customer.'}</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td style={{ color: '#94A3B8', fontWeight: 500 }}>{c.id}</td>
                      <td>
                        {/* Avatar initial + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                          }}>
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <strong>{c.full_name}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#4F46E5' }}>{c.email}</td>
                      <td style={{ color: '#64748B' }}>{c.phone || '—'}</td>
                      <td style={{ color: '#94A3B8', fontSize: 13 }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td>
                        <button
                          className="btn-icon danger"
                          title="Delete customer"
                          onClick={() => openDelete(c)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Showing {filtered.length} of {customers.length} customers</span>
            </div>
          </>
        )}
      </div>

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Register New Customer"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <><span className="spinner spinner-sm" /> Saving…</> : 'Add Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdd}>
          {/* Full name */}
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input
              className={`form-input ${errors.full_name ? 'error' : ''}`}
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="e.g. Jane Smith"
            />
            {errors.full_name && <p className="form-error">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input
              className={`form-input ${errors.email ? 'error' : ''}`}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
            <p className="form-hint">Must be unique — used as account identifier.</p>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555-000-0000"
            />
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? Their order history will remain.`}
        loading={deleting}
      />
    </div>
  );
}
