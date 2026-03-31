import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API 函数
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  getMe: () => api.get('/auth/me'),
}

export const userApi = {
  getApiKeys: () => api.get('/users/api-keys'),
  createApiKey: (data: { name: string; permissions?: string[] }) =>
    api.post('/users/api-keys', data),
  revokeApiKey: (id: string) => api.delete(`/users/api-keys/${id}`),
  getUsage: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/users/usage', { params }),
}

export const billingApi = {
  getBalance: () => api.get('/billing/balance'),
  getTransactions: () => api.get('/billing/transactions'),
  getPricing: () => api.get('/billing/pricing'),
}

export const modelApi = {
  getModels: () => api.get('/models'),
  getModel: (id: string) => api.get(`/models/${id}`),
}

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
  updateUserBalance: (id: string, amount: number) =>
    api.post(`/admin/users/${id}/balance`, { amount }),
  getProviders: () => api.get('/admin/providers'),
  createProvider: (data: any) => api.post('/admin/providers', data),
  getLogs: () => api.get('/admin/logs'),
}
