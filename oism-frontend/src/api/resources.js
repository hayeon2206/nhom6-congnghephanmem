import axiosClient from './axiosClient';

// Branches (FR-AUTH-04)
export const branchesApi = {
  list: () => axiosClient.get('/branches').then((r) => r.data),
  create: (data) => axiosClient.post('/branches', data).then((r) => r.data),
  update: (id, data) => axiosClient.patch(`/branches/${id}`, data).then((r) => r.data),
  toggle: (id) => axiosClient.post(`/branches/${id}/toggle`).then((r) => r.data),
};

// Users (FR-AUTH-03)
export const usersApi = {
  list: () => axiosClient.get('/users').then((r) => r.data),
  create: (data) => axiosClient.post('/users', data).then((r) => r.data),
  update: (id, data) => axiosClient.patch(`/users/${id}`, data).then((r) => r.data),
};

// Catalog: categories, brands, products (FR-PROD)
export const categoriesApi = {
  list: () => axiosClient.get('/categories').then((r) => r.data),
  create: (data) => axiosClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => axiosClient.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/categories/${id}`).then((r) => r.data),
};

export const brandsApi = {
  list: () => axiosClient.get('/brands').then((r) => r.data),
  create: (data) => axiosClient.post('/brands', data).then((r) => r.data),
  update: (id, data) => axiosClient.patch(`/brands/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/brands/${id}`).then((r) => r.data),
};

export const productsApi = {
  search: (params) => axiosClient.get('/products', { params }).then((r) => r.data),
  get: (id) => axiosClient.get(`/products/${id}`).then((r) => r.data),
  create: (data) => axiosClient.post('/products', data).then((r) => r.data),
  update: (id, data) => axiosClient.patch(`/products/${id}`, data).then((r) => r.data),
};

// Inventory: stock, ledger, purchase receipts, transfers, stocktake (FR-INV)
export const inventoryApi = {
  stock: (branchId) => axiosClient.get('/inventory/stock', { params: { branchId } }).then((r) => r.data),
  ledger: (params) => axiosClient.get('/inventory/ledger', { params }).then((r) => r.data),

  receipts: {
    list: () => axiosClient.get('/inventory/purchase-receipts').then((r) => r.data),
    create: (data) => axiosClient.post('/inventory/purchase-receipts', data).then((r) => r.data),
    confirm: (id) => axiosClient.post(`/inventory/purchase-receipts/${id}/confirm`).then((r) => r.data),
  },

  transfers: {
    list: () => axiosClient.get('/inventory/transfers').then((r) => r.data),
    create: (data) => axiosClient.post('/inventory/transfers', data).then((r) => r.data),
    dispatch: (id) => axiosClient.post(`/inventory/transfers/${id}/dispatch`).then((r) => r.data),
    receive: (id) => axiosClient.post(`/inventory/transfers/${id}/receive`).then((r) => r.data),
    cancel: (id) => axiosClient.post(`/inventory/transfers/${id}/cancel`).then((r) => r.data),
  },

  stocktake: {
    list: () => axiosClient.get('/inventory/stocktake').then((r) => r.data),
    open: (data) => axiosClient.post('/inventory/stocktake', data).then((r) => r.data),
    complete: (id, items) => axiosClient.post(`/inventory/stocktake/${id}/complete`, { items }).then((r) => r.data),
  },
};

// Orders (FR-ORD / FR-RSE)
export const ordersApi = {
  list: (params) => axiosClient.get('/orders', { params }).then((r) => r.data),
  get: (id) => axiosClient.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => axiosClient.post('/orders', data).then((r) => r.data),
  reserve: (id) => axiosClient.post(`/orders/${id}/reserve`).then((r) => r.data),
  confirm: (id) => axiosClient.post(`/orders/${id}/confirm`).then((r) => r.data),
  complete: (id) => axiosClient.post(`/orders/${id}/complete`).then((r) => r.data),
  cancel: (id) => axiosClient.post(`/orders/${id}/cancel`).then((r) => r.data),
};

// POS (FR-POS)
export const posApi = {
  lookup: (branchId, q) => axiosClient.get('/pos/lookup', { params: { branchId, q } }).then((r) => r.data),
  checkout: (data) => axiosClient.post('/pos/checkout', data).then((r) => r.data),
};

// Reports (FR-REP)
export const reportsApi = {
  revenue: (params) => axiosClient.get('/reports/revenue-profit', { params }).then((r) => r.data),
  velocity: (params) => axiosClient.get('/reports/inventory-velocity', { params }).then((r) => r.data),
  stockAlerts: (branchId) => axiosClient.get('/reports/stock-alerts', { params: { branchId } }).then((r) => r.data),
};

// Webhook simulator (FR-SIM)
export const webhooksApi = {
  logs: () => axiosClient.get('/webhooks/logs').then((r) => r.data),
  simulate: (data) => axiosClient.post('/webhooks/simulate', data).then((r) => r.data),
  burst: (data) => axiosClient.post('/webhooks/simulate/burst', data).then((r) => r.data),
};
