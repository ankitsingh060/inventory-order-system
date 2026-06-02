/**
 * Navbar.jsx — Top navigation bar.
 *
 * Displays the current page title / subtitle and a live status badge
 * that shows the API connection state.
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

/* ── Page metadata by route ─────────────────────────────────────────────── */
const PAGE_META = {
  '/':          { title: 'Dashboard',         subtitle: 'Overview & key metrics'          },
  '/products':  { title: 'Product Catalog',   subtitle: 'Manage inventory & SKUs'         },
  '/customers': { title: 'Customers',         subtitle: 'Registered customer accounts'    },
  '/orders':    { title: 'Orders',            subtitle: 'Track and manage orders'         },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: 'InvenOrder', subtitle: '' };

  // Lightweight API health check — shows whether the backend is reachable
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    api.get('/health')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const statusConfig = {
    online:   { label: 'API Online',   color: '#10B981', bg: '#D1FAE5' },
    offline:  { label: 'API Offline',  color: '#EF4444', bg: '#FEE2E2' },
    checking: { label: 'Connecting…',  color: '#F59E0B', bg: '#FEF3C7' },
  }[apiStatus];

  return (
    <header className="navbar">
      {/* Page title */}
      <div className="navbar-left">
        <h1>{meta.title}</h1>
        {meta.subtitle && <p>{meta.subtitle}</p>}
      </div>

      {/* Right-side controls */}
      <div className="navbar-right">
        {/* API status indicator */}
        <span
          className="navbar-badge"
          style={{ background: statusConfig.bg, color: statusConfig.color }}
        >
          {/* Animated dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: statusConfig.color,
              display: 'inline-block',
              animation: apiStatus === 'online' ? 'none' : 'spin 1s linear infinite',
            }}
          />
          {statusConfig.label}
        </span>
      </div>
    </header>
  );
}
