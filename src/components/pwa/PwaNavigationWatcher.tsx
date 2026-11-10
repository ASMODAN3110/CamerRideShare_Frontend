import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applyWhenSafe } from '@/lib/pwa'

/** Un changement de page est le moment idéal pour activer une mise à jour en attente : rien n'est en cours de saisie. */
export default function PwaNavigationWatcher() {
  const { pathname } = useLocation()
  useEffect(() => {
    applyWhenSafe()
  }, [pathname])
  return null
}
