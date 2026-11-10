import { apiRequest } from '../lib/apiClient'
import type { LatePaymentsParams, LatePaymentsResponse } from '../types/api'

function query(params: LatePaymentsParams): string {
  const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 10) })
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  return qs.toString()
}

/** GET /admin/late-payments — historique des semaines de retard de tous les chauffeurs ; filtres et pagination côté serveur. */
export function getAdminLatePayments(params: LatePaymentsParams): Promise<LatePaymentsResponse> {
  return apiRequest<LatePaymentsResponse>(`/admin/late-payments?${query(params)}`)
}

/** GET /driver/late-payments — historique de mes semaines de retard. */
export function getDriverLatePayments(params: LatePaymentsParams): Promise<LatePaymentsResponse> {
  return apiRequest<LatePaymentsResponse>(`/driver/late-payments?${query(params)}`)
}
