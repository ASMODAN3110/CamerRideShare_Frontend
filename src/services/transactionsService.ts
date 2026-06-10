import { apiRequest } from '../lib/apiClient'
import type { ListTransactionsParams, PaginatedTransactions } from '../types/api'

function buildTransactionsQuery(params: ListTransactionsParams = {}): string {
  const qs = new URLSearchParams()
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const sort = params.sort ?? 'desc'
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  qs.set('sort', sort)
  if (params.search?.trim()) qs.set('search', params.search.trim())
  if (params.status) qs.set('status', params.status)
  if (params.type) qs.set('type', params.type)
  const query = qs.toString()
  return query ? `?${query}` : ''
}

/**
 * GET /transactions — liste paginée (JWT + ADMIN).
 * Réponse : { data, meta }.
 */
export function listTransactions(params: ListTransactionsParams = {}): Promise<PaginatedTransactions> {
  return apiRequest<PaginatedTransactions>(`/transactions${buildTransactionsQuery(params)}`)
}
