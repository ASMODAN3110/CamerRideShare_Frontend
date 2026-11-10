import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

/**
 * PWA : installation, mise à jour automatique et récupération en cas de problème.
 *
 * - Mise à jour : le navigateur vérifie le service worker au chargement, toutes les 30 minutes, quand l'application revient au
 *   premier plan et au retour du réseau. Une nouvelle version télécharge en coulisses puis est activée automatiquement
 *   au premier moment sans risque (voir `applyWhenSafe`) : aucune action de l'utilisateur n'est nécessaire.
 * - Récupération : si l'application ne démarre plus (fichier obsolète, cache corrompu), `recover` vide les caches et le
 *   service worker et recharge depuis le réseau (une seule tentative par 30 s, pour ne jamais boucler).
 * - Les appels à l'API ne sont jamais mis en cache (voir vite.config.ts).
 */

const CHECK_EVERY_MS = 30 * 60_000
const APPLY_DELAY_MS = 8_000
const RECOVERY_GUARD_MS = 30_000
const RECOVERY_KEY = 'crs-recovered-at'

// ── Récupération ─────────────────────────────────────────────────────────────

/** Supprime service workers et caches puis recharge : la prochaine ouverture repart d'une installation propre. */
export async function hardReset(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    // on recharge quand même
  }
  location.reload()
}

/** Même chose, mais une seule fois par fenêtre de 30 s : une panne persistante ne provoque pas de boucle de rechargements. */
export function recover(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RECOVERY_KEY) ?? 0)
    if (Date.now() - last < RECOVERY_GUARD_MS) return false
    sessionStorage.setItem(RECOVERY_KEY, String(Date.now()))
  } catch {
    // sessionStorage indisponible : on tente quand même, sans garde
  }
  void hardReset()
  return true
}

// ── Mise à jour automatique ──────────────────────────────────────────────────

let activate: ((reload?: boolean) => Promise<void>) | null = null
let waiting = false
let timer: number | undefined

/** L'utilisateur est en train de saisir quelque chose : recharger lui ferait perdre sa saisie. */
function userIsBusy(): boolean {
  const el = document.activeElement
  const typing =
    el instanceof HTMLElement &&
    (el.isContentEditable || el.matches('textarea, select, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="file"])'))
  return typing || document.querySelector('[role="dialog"], [role="alertdialog"]') !== null
}

function applyNow() {
  if (!waiting || !activate) return
  waiting = false
  window.clearTimeout(timer)
  toast.dismiss('pwa-update')
  void activate(true) // active la nouvelle version puis recharge la page
}

/** Active la mise à jour dès que ce n'est plus gênant : page masquée, changement de page, ou aucune saisie / fenêtre ouverte. */
export function applyWhenSafe() {
  if (!waiting) return
  if (document.hidden || !userIsBusy()) return applyNow()
  timer = window.setTimeout(applyWhenSafe, 5_000)
}

function onUpdateFound() {
  waiting = true
  toast.info('Nouvelle version disponible', {
    id: 'pwa-update',
    description: "L'application se met à jour automatiquement.",
    duration: Infinity,
    action: { label: 'Mettre à jour', onClick: applyNow },
  })
  window.clearTimeout(timer)
  timer = window.setTimeout(applyWhenSafe, APPLY_DELAY_MS)
}

/** À appeler une fois au démarrage (production seulement : en développement le service worker est désactivé). */
export function startPwa(): void {
  if (!('serviceWorker' in navigator)) return
  captureInstallPrompt()

  window.addEventListener('vite:preloadError', (event) => {
    // un fichier de l'ancienne version a disparu du serveur après un déploiement : on repart sur la version à jour
    event.preventDefault()
    recover()
  })

  if (import.meta.env.DEV) return

  activate = registerSW({
    immediate: true,
    onNeedRefresh: onUpdateFound,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => undefined)
      }
      window.setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) applyWhenSafe()
        else check()
      })
      window.addEventListener('online', check)
    },
  })
}

// ── Installation ─────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Application déjà ouverte comme application installée (fenêtre dédiée, écran d'accueil). */
export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** iPhone / iPad : pas d'invite d'installation, il faut passer par « Partager → Sur l'écran d'accueil ». */
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function captureInstallPrompt() {
  installed = isStandalone()
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // on propose l'installation nous-mêmes, au bon endroit
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installed = true
    toast.success('CamerRideShare est installée sur cet appareil.')
    notify()
  })
}

export type InstallState = 'installed' | 'available' | 'ios' | 'unavailable'

const snapshot = (): InstallState => (installed ? 'installed' : deferredPrompt ? 'available' : isIos() ? 'ios' : 'unavailable')

/** État de l'installation : `available` = le navigateur propose l'installation, `ios` = instructions manuelles. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    snapshot,
    () => 'unavailable',
  )
}

/** Ouvre l'invite d'installation du navigateur. */
export async function promptInstall(): Promise<void> {
  if (!deferredPrompt) return
  const event = deferredPrompt
  deferredPrompt = null // une invite ne sert qu'une fois
  notify()
  await event.prompt()
  await event.userChoice.catch(() => undefined)
}
