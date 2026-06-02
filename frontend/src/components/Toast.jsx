/**
 * Toast.jsx — Notification toast system.
 *
 * Usage:
 *   import { useToast, ToastContainer } from './Toast';
 *
 *   // In a parent component (e.g. App.js):
 *   const { toasts, addToast, removeToast } = useToast();
 *   <ToastContainer toasts={toasts} onRemove={removeToast} />
 *
 *   // In any child via context:
 *   const { addToast } = useToastContext();
 *   addToast('success', 'Saved!', 'Product created successfully.');
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

/* ── Context ─────────────────────────────────────────────────────────────── */
const ToastContext = createContext(null);

/* ── Hook for consuming context ─────────────────────────────────────────── */
export function useToastContext() {
  return useContext(ToastContext);
}

/* ── Provider — wraps the whole app ─────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    // Auto-dismiss after `duration` ms
    setTimeout(() => removeToast(id), duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/* ── Container — renders all active toasts ───────────────────────────────── */
function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

/* ── Individual toast ────────────────────────────────────────────────────── */
const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

function ToastItem({ toast, onRemove }) {
  return (
    <div className={`toast ${toast.type}`} role="alert">
      <span className="toast-icon">{ICONS[toast.type] || 'ℹ️'}</span>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: '#94A3B8',
          fontSize: 16,
          padding: '0 0 0 8px',
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
