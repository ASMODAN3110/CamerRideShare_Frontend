import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './auth/AuthContext.tsx'
import AppErrorBoundary from '@/components/pwa/AppErrorBoundary'
import BootMark from '@/components/pwa/BootMark'
import OfflineBanner from '@/components/pwa/OfflineBanner'
import { startPwa } from '@/lib/pwa'

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
}

// PWA : service worker, mise à jour automatique, installation (désactivé en développement, voir src/lib/pwa.ts)
startPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <BootMark />
          <App />
          <Toaster richColors position="top-right" />
          <OfflineBanner />
        </TooltipProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
