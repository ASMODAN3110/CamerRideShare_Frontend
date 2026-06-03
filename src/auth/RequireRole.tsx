import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../types/auth'
import { useAuth } from './useAuth'
import { homeRouteForRole } from './roles'
import { isPathAllowedForRole } from './routeAccess'

type RequireRoleProps = {
  allowed: UserRole[]
}

export default function RequireRole({ allowed }: RequireRoleProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  if (!isPathAllowedForRole(location.pathname, user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  return <Outlet />
}
