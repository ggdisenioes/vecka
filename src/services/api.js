const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, opts = {}) {
  const token = localStorage.getItem('vecka_token');
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password, phone) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) }),
  me: () => request('/api/auth/me'),
  updateProfile: (data) =>
    request('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  updatePassword: (currentPassword, newPassword) =>
    request('/api/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  users: () => request('/api/auth/users'),

  // Orders
  createOrder: (data) =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  myOrders: () => request('/api/orders/my'),
  orderDetail: (id) => request(`/api/orders/${id}`),
  allOrders: () => request('/api/orders'),
  updateOrderStatus: (id, status, tracking_number) =>
    request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, tracking_number }) }),

  // Downloads
  downloadUrl: (token) => `${API}/api/downloads/${token}`,
};
