import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then(r => r.data),
  changePassword: (data) => api.put('/auth/password', data).then(r => r.data),
};

export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }).then(r => r.data),
  getOne: (id) => api.get(`/transactions/${id}`).then(r => r.data),
  create: (data) => api.post('/transactions', data).then(r => r.data),
  update: (id, data) => api.put(`/transactions/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/transactions/${id}`).then(r => r.data),
};

export const categoryService = {
  getAll: (params) => api.get('/categories', { params }).then(r => r.data),
  create: (data) => api.post('/categories', data).then(r => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const budgetService = {
  getAll: () => api.get('/budgets').then(r => r.data),
  create: (data) => api.post('/budgets', data).then(r => r.data),
  update: (id, data) => api.put(`/budgets/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/budgets/${id}`).then(r => r.data),
};

export const goalService = {
  getAll: () => api.get('/goals').then(r => r.data),
  create: (data) => api.post('/goals', data).then(r => r.data),
  update: (id, data) => api.put(`/goals/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/goals/${id}`).then(r => r.data),
};

export const analyticsService = {
  getSummary: (params) => api.get('/analytics/summary', { params }).then(r => r.data),
  getMonthly: () => api.get('/analytics/monthly').then(r => r.data),
  getCategories: (params) => api.get('/analytics/categories', { params }).then(r => r.data),
  getCashFlow: () => api.get('/analytics/cash-flow').then(r => r.data),
  getSavings: () => api.get('/analytics/savings').then(r => r.data),
  getInsights: () => api.get('/analytics/insights').then(r => r.data),
};

export const reportService = {
  getMonthlyReport: (month) => api.get('/reports/monthly', { params: { month } }).then(r => r.data),
  exportTransactionsCSV: async (params) => {
    const response = await api.get('/reports/transactions.csv', { params, responseType: 'blob' });
    return response.data;
  },
  exportMonthlyCSV: async (month) => {
    const response = await api.get('/reports/monthly.csv', { params: { month }, responseType: 'blob' });
    return response.data;
  },
};
