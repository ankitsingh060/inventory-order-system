/**
 * Dashboard.jsx — Overview page with key metrics and alerts.
 *
 * Displays:
 *  - 4 stat cards: total products, customers, orders, revenue
 *  - Low-stock product alerts table
 *  - Recent orders table
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, orderApi } from '../api';

/* ── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ icon, iconClass, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

/* ── Low-stock badge ─────────────────────────────────────────────────────── */
function StockBadge({ qty }) {
  if (qty === 0)  return <span className="badge badge-danger">Out of Stock</span>;
  if (qty < 5)    return <span className="badge badge-danger">Critical</span>;
  return              <span className="badge badge-warning">Low Stock</span>;
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [stats,        setStats]        = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    // Fetch stats and orders in parallel for speed
    Promise.all([dashboardApi.getStats(), orderApi.getAll()])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data);
        // Show only the 5 most recent orders
        setRecentOrders(ordersRes.data.slice(0, 5));
      })
      .catch(() => setError('Failed to load dashboard data. Is the API running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">⚠️</div>
      <h3>Connection Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div>
      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          icon="📦"
          iconClass="indigo"
          value={stats.total_products}
          label="Total Products"
        />
        <StatCard
          icon="👥"
          iconClass="cyan"
          value={stats.total_customers}
          label="Total Customers"
        />
        <StatCard
          icon="🛍️"
          iconClass="emerald"
          value={stats.total_orders}
          label="Total Orders"
        />
        <StatCard
          icon="💰"
          iconClass="amber"
          value={`$${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          label="Total Revenue"
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="dashboard-grid">

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h2>⚠️ Low Stock Alerts</h2>
            <Link to="/products" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {stats.low_stock_products.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-icon">✅</div>
              <h3>All items well-stocked</h3>
              <p>No products below threshold.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                          {p.sku}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.quantity === 0 ? '#EF4444' : '#F59E0B' }}>
                          {p.quantity}
                        </span>
                      </td>
                      <td><StockBadge qty={p.quantity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h2>🛍️ Recent Orders</h2>
            <Link to="/orders" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-icon">📋</div>
              <h3>No orders yet</h3>
              <p>Create your first order.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: '#94A3B8', fontWeight: 500 }}>#{o.id}</td>
                      <td>{o.customer.full_name}</td>
                      <td>
                        <strong>${o.total_amount.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${o.status === 'pending' ? 'warning' : 'success'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
