/**
 * ConfirmDialog.jsx — Reusable confirmation modal for destructive actions.
 *
 * Props:
 *   isOpen      {boolean}
 *   onClose     {function}   — cancel callback
 *   onConfirm   {function}   — confirm callback
 *   title       {string}
 *   message     {string}
 *   confirmText {string}     — label for confirm button (default "Delete")
 *   loading     {boolean}    — shows spinner on confirm button while request is in flight
 */

import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title     = 'Are you sure?',
  message   = 'This action cannot be undone.',
  confirmText = 'Delete',
  loading   = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {/* Warning icon */}
      <div className="confirm-icon">🗑️</div>

      <p style={{ textAlign: 'center', color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
        {message}
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner spinner-sm" />
              Deleting…
            </>
          ) : confirmText}
        </button>
      </div>
    </Modal>
  );
}
