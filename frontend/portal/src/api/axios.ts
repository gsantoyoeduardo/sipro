import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  console.log('[AXIOS REQUEST]', {
    method: config.method,
    url: config.baseURL + (config.url || ''),
    fullUrl: `${config.baseURL}${config.url}`,
    headers: {
      Authorization: config.headers.Authorization ? 'Bearer ***' + config.headers.Authorization.slice(-10) : 'NONE',
      'X-Tenant-ID': config.headers['X-Tenant-ID'] || 'NONE',
    },
    data: config.data,
  })
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('[AXIOS RESPONSE]', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    console.log('[AXIOS ERROR]', {
      status: error.response?.status,
      url: error.config?.url,
      responseData: error.response?.data,
      token: localStorage.getItem('access_token') ? 'EXISTS' : 'NONE',
      refreshToken: localStorage.getItem('refresh_token') ? 'EXISTS' : 'NONE',
    })
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        console.log('[AXIOS] Attempting token refresh...')
        const { data } = await api.post('/auth/refresh/', { refresh: refreshToken })
        localStorage.setItem('access_token', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        console.log('[AXIOS] Token refreshed successfully')
        return api(originalRequest)
      } catch (refreshError) {
        console.log('[AXIOS] Token refresh failed, redirecting to login')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
