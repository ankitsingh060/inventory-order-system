/**
 * api/index.js — Centralised API client.
 *
 * All HTTP calls go through this module so that:
 * - The base URL is configured in one place (via REACT_APP_API_URL env var)
 * - Request/response interceptors can be added globally
 * - Error messages are normalised into a predictable shape
 */

import axios from 'axios';

// Base URL: injected at build time via .env / docker-compose environment
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create a configured axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,  // 15 s timeout
});

/**
 * Response interceptor — normalise error shapes so components can always
 * read `error.message` without checking the axios structure.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FastAPI returns detail as a string or [{msg, loc}] for validation errors
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      // Pydantic validation error — join all messages
      error.message = detail.map((e) => e.msg).join(', ');
    } else if (typeof detail === 'string') {
      error.message = detail;
    } else {
      error.message = error.message || 'An unexpected error occurred.';
    }
    return Promise.reject(error);
  }
);


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        PRODUCT API                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const productApi = {
  /** GET /products — retrieve all products */
  getAll:  ()            => api.get('/products'),

  /** GET /products/:id */
  getById: (id)          => api.get(`/products/${id}`),

  /** POST /products */
  create:  (data)        => api.post('/products', data),

  /** PUT /products/:id */
  update:  (id, data)    => api.put(`/products/${id}`, data),

  /** DELETE /products/:id */
  delete:  (id)          => api.delete(`/products/${id}`),
};


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        CUSTOMER API                                         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const customerApi = {
  /** GET /customers */
  getAll:  ()        => api.get('/customers'),

  /** GET /customers/:id */
  getById: (id)      => api.get(`/customers/${id}`),

  /** POST /customers */
  create:  (data)    => api.post('/customers', data),

  /** DELETE /customers/:id */
  delete:  (id)      => api.delete(`/customers/${id}`),
};


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                          ORDER API                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const orderApi = {
  /** GET /orders */
  getAll:  ()      => api.get('/orders'),

  /** GET /orders/:id */
  getById: (id)    => api.get(`/orders/${id}`),

  /**
   * POST /orders
   * Payload shape: { customer_id: int, items: [{ product_id, quantity }] }
   */
  create:  (data)  => api.post('/orders', data),

  /** DELETE /orders/:id — cancels and restores inventory */
  delete:  (id)    => api.delete(`/orders/${id}`),
};


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                        DASHBOARD API                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const dashboardApi = {
  /** GET /dashboard/stats */
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
