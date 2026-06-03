import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Dev: unregister SW so stale compiler-transformed Vite modules are not served from cache.
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => void r.unregister())
  })
  if ('caches' in window) {
    void caches.keys().then((keys) => {
      keys.forEach((k) => void caches.delete(k))
    })
  }
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js?version=3')
      .catch(() => {
        // Ignore registration failures (offline/caching is best-effort).
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
