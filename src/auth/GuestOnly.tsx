import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { homeRouteForRole } from './roles'

export default function GuestOnly() {
  const { isAuthenticated, user, isHydrating } = useAuth()

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Chargement…
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  return <Outlet />
}
