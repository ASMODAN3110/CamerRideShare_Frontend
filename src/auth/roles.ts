import type { UserRole } from '../types/auth'

export function homeRouteForRole(role: UserRole | undefined | null) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard'
    case 'INVESTOR':
      return '/investor-dashboard'
    case 'DRIVER':
      return '/driver-dashboard'
    default:
      return '/connexion'
  }
}

export function roleLabel(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'Administrateur'
    case 'INVESTOR':
      return 'Investisseur'
    case 'DRIVER':
      return 'Conducteur'
    default:
      return role
  }
}
