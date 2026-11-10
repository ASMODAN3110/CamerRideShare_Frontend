import { useEffect } from 'react'

/** Signale à index.html que l'application a démarré : sinon, il la répare (voir le garde-fou de démarrage). */
export default function BootMark() {
  useEffect(() => {
    window.__crsBooted = true
  }, [])
  return null
}
