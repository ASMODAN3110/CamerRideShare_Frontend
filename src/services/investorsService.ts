import { apiRequest } from '../lib/apiClient'
import type {
  InvestorsRoiTrend,
  InvestorsSummary,
  ListAdminInvestorsParams,
  PaginatedAdminInvestors,
} from '../types/api'

function buildInvestorsQuery(params: ListAdminInvestorsParams = {}): string {
  const qs = new URLSearchParams()
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const sort = params.sort ?? 'desc'
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  qs.set('sort', sort)
  if (params.search?.trim()) qs.set('search', params.search.trim())
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()
  return query ? `?${query}` : ''
}

/** GET /admin/investors/summary — KPIs page investisseurs (JWT + ADMIN). */
export function getInvestorsSummary(): Promise<InvestorsSummary> {
  return apiRequest<InvestorsSummary>('/admin/investors/summary')
}

/** GET /admin/investors — liste paginée (JWT + ADMIN). */
export function listAdminInvestors(params: ListAdminInvestorsParams = {}): Promise<PaginatedAdminInvestors> {
  return apiRequest<PaginatedAdminInvestors>(`/admin/investors${buildInvestorsQuery(params)}`)
}

/** GET /admin/investors/roi-trend — série ROI mensuelle (JWT + ADMIN). */
export function getInvestorsRoiTrend(months = 8): Promise<InvestorsRoiTrend> {
  return apiRequest<InvestorsRoiTrend>(`/admin/investors/roi-trend?months=${months}`)
}
