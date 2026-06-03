import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { homeRouteForRole } from './roles'

export default function RootRedirect() {
  const { isAuthenticated, user, isHydrating } = useAuth()

  if (isHydrating) {
    return null
  }

  if (isAuthenticated && user) {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  return <Navigate to="/inscription" replace />
}
