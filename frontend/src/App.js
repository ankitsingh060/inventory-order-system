/**
 * App.js — Root component.
 *
 * Sets up:
 *  - React Router (BrowserRouter + Routes)
 *  - ToastProvider for global notifications
 *  - The persistent sidebar + navbar shell
 *  - Route → Page mappings
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Global styles
import './App.css';

// Layout components
import Sidebar from './components/Sidebar';
import Navbar  from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import Products  from './pages/Products';
import Customers from './pages/Customers';
import Orders    from './pages/Orders';

// Toast notification provider
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <Router>
      {/* ToastProvider wraps everything so any page can trigger toasts */}
      <ToastProvider>
        <div className="app-layout">

          {/* ── Fixed left sidebar ──────────────────────────────────────── */}
          <Sidebar />

          {/* ── Main content area ───────────────────────────────────────── */}
          <div className="main-content">

            {/* Sticky top bar — re-renders on route change for page title */}
            <Navbar />

            {/* Page content — scrollable */}
            <main className="page-body">
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/products"  element={<Products  />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/orders"    element={<Orders    />} />

                {/* 404 fallback */}
                <Route path="*" element={
                  <div className="empty-state" style={{ marginTop: 80 }}>
                    <div className="empty-state-icon">🔍</div>
                    <h3>Page Not Found</h3>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                } />
              </Routes>
            </main>

          </div>
        </div>
      </ToastProvider>
    </Router>
  );
}
