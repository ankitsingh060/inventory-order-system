/**
 * Modal.jsx — Reusable dialog component.
 *
 * Props:
 *   isOpen   {boolean}         — controls visibility
 *   onClose  {function}        — called when backdrop or × is clicked
 *   title    {string}          — modal heading
 *   size     {'sm'|'md'|'lg'|'xl'}  — width preset
 *   children {ReactNode}       — modal body content
 *   footer   {ReactNode}       — optional footer override (defaults to no footer)
 */

import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`modal modal-${size}`}>
        {/* Header */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
