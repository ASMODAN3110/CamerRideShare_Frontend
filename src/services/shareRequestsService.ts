import { apiRequest } from '../lib/apiClient'
import type { ShareRequestStatus, ShareRequestsResponse } from '../types/api'

/** GET /share-requests — demandes de parts (admin), filtrées et paginées côté serveur. */
export function listShareRequests(params: { page: number; limit: number; status?: ShareRequestStatus; search?: string }) {
  const qs = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  return apiRequest<ShareRequestsResponse>(`/share-requests?${qs.toString()}`)
}

/** PATCH /share-requests/:id — valide ou refuse une demande. */
export function resolveShareRequest(id: number, body: { status: 'APPROVED' | 'REJECTED'; note?: string }) {
  return apiRequest<{ id: number; status: ShareRequestStatus; autoRejected: boolean; reason: string | null }>(`/share-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
