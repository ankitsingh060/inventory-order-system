/**
 * Sidebar.jsx — Fixed left-side navigation panel.
 *
 * Highlights the active route using React Router's NavLink.
 * Each nav item has an SVG icon, label, and active styling.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

/* ── Inline SVG icon components ─────────────────────────────────────────── */

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const ProductsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73L12 2 4 6.27A2 2 0 003 8v8a2 2 0 001 1.73L12 22l8-4.27A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const CustomersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

/* ── Navigation items config ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  Icon: DashboardIcon },
  { to: '/products',  label: 'Products',   Icon: ProductsIcon  },
  { to: '/customers', label: 'Customers',  Icon: CustomersIcon },
  { to: '/orders',    label: 'Orders',     Icon: OrdersIcon    },
];

/* ── Component ───────────────────────────────────────────────────────────── */

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">📦</div>
        <div className="sidebar-brand-text">
          <h2>InvenOrder</h2>
          <span>Management System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>

        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}            /* Only mark "/" active when exact */
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-version">InvenOrder v1.0.0</p>
      </div>
    </aside>
  );
}
