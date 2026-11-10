import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** Bandeau affiché tant que l'appareil n'a plus de connexion : l'application s'ouvre, mais les données ne se rafraîchissent pas. */
export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div
      role="status"
      data-testid="offline-banner"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
        <WifiOff className="size-4 shrink-0 text-destructive" />
        <span>Hors connexion : les données affichées peuvent être anciennes.</span>
      </div>
    </div>
  )
}
