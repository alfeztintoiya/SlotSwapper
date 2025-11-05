import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
})

export function setAuthInterceptor() {
  http.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        // optional: location redirect
      }
      return Promise.reject(err)
    }
  )
}
