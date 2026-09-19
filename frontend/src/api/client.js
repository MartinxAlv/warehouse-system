const BASE_URL = 'http://localhost:8080/api';

function getToken() {
  try {
    const stored = localStorage.getItem('wms_user')
    return stored ? JSON.parse(stored).token : null
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // users (admin only)
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // dashboard
  getDashboardSummary: () => request('/dashboard/summary'),

  // products
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // profile (self-service)
  changePassword: (data) => request('/profile/password', { method: 'PUT', body: JSON.stringify(data) }),

  // categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // warehouses
  getWarehouses: () => request('/warehouses'),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  // inventory
  getInventory: () => request('/inventory'),
  getLowStock: () => request('/inventory/low-stock'),
  adjustStock: (data) => request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data) => request('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
  updateBinLocation: (id, binLocation) => request(`/inventory/${id}/location`, { method: 'PATCH', body: JSON.stringify({ binLocation }) }),
  getMovements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory/movements${qs ? `?${qs}` : ''}`);
  },

  // purchase orders
  getPurchaseOrders: () => request('/purchase-orders'),
  getPurchaseOrder: (id) => request(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  submitPurchaseOrder: (id) => request(`/purchase-orders/${id}/submit`, { method: 'POST' }),
  receivePurchaseOrder: (id, data) => request(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }),
  cancelPurchaseOrder: (id) => request(`/purchase-orders/${id}/cancel`, { method: 'POST' }),

  // admin tools (admin only)
  getSampleDataStatus: () => request('/admin/sample-data/status'),
  seedSampleData: () => request('/admin/sample-data/seed', { method: 'POST' }),
  clearAllData: () => request('/admin/sample-data/clear', { method: 'DELETE' }),
  getSystemLogs: () => request('/admin/logs'),

  // customer orders
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  confirmOrder: (id) => request(`/orders/${id}/confirm`, { method: 'POST' }),
  fulfillOrder: (id, data) => request(`/orders/${id}/fulfill`, { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id, data) => request(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify(data || {}) }),
};
