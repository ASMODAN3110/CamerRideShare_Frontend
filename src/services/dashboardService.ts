import { apiRequest } from '../lib/apiClient'
import type { DashboardOverview, Alert, AlertPriority } from '../types/api'

/**
 * GET /admin/dashboard/overview
 * Fetches all KPIs for the admin dashboard overview.
 * Side-effect on backend: updates current-month snapshot.
 */
export function getDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>('/admin/dashboard/overview')
}

/**
 * GET /admin/alerts?priority=high|medium|low
 * Returns a flat array of alert objects (no wrapper).
 * Note: backend currently returns the same list regardless of priority.
 */
export function getAlerts(priority: AlertPriority = 'high'): Promise<Alert[]> {
  return apiRequest<Alert[]>(`/admin/alerts?priority=${priority}`)
}
