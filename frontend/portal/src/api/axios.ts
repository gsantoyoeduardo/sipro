import axios from 'axios'

const IGNORE_PATHS = ['/portal/auth/iniciar-sesion/', '/portal/auth/refrescar/']

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  if (IGNORE_PATHS.some((p) => config.url?.includes(p))) {
    return config
  }

  const token = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')

  if (token && isTokenExpired(token) && refreshToken) {
    try {
        const { data } = await axios.post('/portal/auth/refrescar/', { refresh: refreshToken })
      localStorage.setItem('access_token', data.access)
      config.headers.Authorization = `Bearer ${data.access}`
      return config
    } catch (refreshError) {
      console.error('[Auth] Refresh falló, redirigiendo a login:', refreshError)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/iniciar-sesion'
      return config
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry && !IGNORE_PATHS.some((p) => originalRequest.url?.includes(p))) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
      const { data } = await axios.post('/portal/auth/refrescar/', { refresh: refreshToken })
        localStorage.setItem('access_token', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('[Auth] Response refresh falló:', refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/iniciar-sesion'
      }
    }
    return Promise.reject(error)
  },
)

export default api
