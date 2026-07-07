import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './router/AppRouter'

// ── Interceptor global de fetch (RNF-08) ──────────────────────────────────────
const originalFetch = window.fetch
window.fetch = async function (input, init) {
  const updatedInit = { ...init }
  updatedInit.credentials = 'include'

  if (updatedInit.headers) {
    if (updatedInit.headers instanceof Headers) {
      const auth = updatedInit.headers.get('Authorization')
      if (
        auth &&
        (auth.includes('null') ||
          auth.includes('undefined') ||
          auth.includes('cookie') ||
          auth.trim() === 'Bearer')
      ) {
        updatedInit.headers.delete('Authorization')
      }
    } else if (Array.isArray(updatedInit.headers)) {
      updatedInit.headers = updatedInit.headers.filter(([key, val]) => {
        if (key.toLowerCase() === 'authorization') {
          return (
            val &&
            !val.includes('null') &&
            !val.includes('undefined') &&
            !val.includes('cookie') &&
            val.trim() !== 'Bearer'
          )
        }
        return true
      })
    } else if (typeof updatedInit.headers === 'object') {
      const headersRecord = updatedInit.headers as Record<string, string>
      const auth = headersRecord['Authorization'] || headersRecord['authorization']
      if (
        auth &&
        (auth.includes('null') ||
          auth.includes('undefined') ||
          auth.includes('cookie') ||
          auth.trim() === 'Bearer')
      ) {
        delete headersRecord['Authorization']
        delete headersRecord['authorization']
      }
    }
  }

  const response = await originalFetch(input, updatedInit)

  // Si la petición retorna 401 (No Autorizado), limpiar sesión y redirigir
  if (response.status === 401) {
    localStorage.removeItem('rc_user')
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }

  return response
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
