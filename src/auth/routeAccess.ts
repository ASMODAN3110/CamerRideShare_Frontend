import type { UserRole } from '../types/auth'
import { homeRouteForRole } from './roles'

/** Routes accessibles uniquement par les administrateurs */
export const ADMIN_ROUTES = [
  '/dashboard',
  '/parc',
  '/paiements',
  '/investisseurs',
  '/parametres',
] as const

/** Préfixes des espaces investisseur et conducteur */
const INVESTOR_PREFIX = '/investor-'
const DRIVER_PREFIX = '/driver-'

export const INVESTOR_ROUTES = [
  '/investor-dashboard',
  '/investor-fleet',
  '/investor-revenues',
  '/investor-reports',
  '/investor-settings',
] as const

export const DRIVER_ROUTES = [
  '/driver-dashboard',
  '/driver-payments',
  '/driver-support',
  '/driver-settings',
] as const

export const PUBLIC_ROUTES = ['/', '/connexion', '/inscription'] as const

function normalizePath(path: string) {
  const base = path.split('?')[0].split('#')[0]
  if (base.length > 1 && base.endsWith('/')) {
    return base.slice(0, -1)
  }
  return base
}

export function isPublicPath(path: string) {
  const p = normalizePath(path)
  return (PUBLIC_ROUTES as readonly string[]).includes(p)
}

export function isPathAllowedForRole(path: string, role: UserRole) {
  const p = normalizePath(path)

  switch (role) {
    case 'ADMIN':
      return (ADMIN_ROUTES as readonly string[]).includes(p)
    case 'INVESTOR':
      return p.startsWith(INVESTOR_PREFIX) && (INVESTOR_ROUTES as readonly string[]).includes(p)
    case 'DRIVER':
      return p.startsWith(DRIVER_PREFIX) && (DRIVER_ROUTES as readonly string[]).includes(p)
    default:
      return false
  }
}

/** Après login : n'autorise `from` que si le rôle y a accès */
export function resolvePostLoginPath(from: string | null | undefined, role: UserRole) {
  if (from && !isPublicPath(from) && isPathAllowedForRole(from, role)) {
    return normalizePath(from)
  }
  return homeRouteForRole(role)
}
