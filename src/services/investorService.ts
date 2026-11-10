import { apiRequest } from '../lib/apiClient'
import type {
  InvestorDashboardResponse,
  InvestorNotificationPrefs,
  InvestorReport,
  InvestorSettings,
  InvestorWeeklyReportResult,
  UpdateAdminProfileBody,
  InvestorFleetDetail,
  InvestorFleetGroup,
  InvestorFleetResponse,
  InvestorPayoutSummary,
  InvestorRevenuesResponse,
  MarketplaceResponse,
  MarketplaceSort,
  ShareRequestItem,
} from '../types/api'

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  }
  const text = qs.toString()
  return text ? `?${text}` : ''
}

/** GET /investor/reports — rapport de performance sur une période (tout l'historique sans dates). */
export function getInvestorReport(params: { from?: string; to?: string }) {
  return apiRequest<InvestorReport>(`/investor/reports${toQuery(params)}`)
}

/** Chemin du rapport PDF pour la même période. */
export function investorReportPdfPath(params: { from?: string; to?: string }) {
  return `/investor/reports/pdf${toQuery(params)}`
}

/** GET /investor/dashboard — capital investi, sommes perçues, solde net, ROI et courbe des 12 dernières semaines. */
export function getInvestorDashboard(params: { weeks?: number } = {}) {
  return apiRequest<InvestorDashboardResponse>(`/investor/dashboard${toQuery(params)}`)
}

/** GET /investor/fleet/:id — fiche d'un véhicule de l'investisseur (404 s'il n'y a pas de part). */
export function getInvestorFleetDetail(id: number | string) {
  return apiRequest<InvestorFleetDetail>(`/investor/fleet/${id}`)
}

/** GET /investor/fleet — motos de l'investisseur, filtrées côté serveur. */
export function getInvestorFleet(params: { group: InvestorFleetGroup; search?: string; zone?: string }) {
  return apiRequest<InvestorFleetResponse>(`/investor/fleet${toQuery(params)}`)
}

/** GET /investor/revenues — sommes perçues, paginées ; recherche, statut de reversement et période appliqués par le serveur. */
export function getInvestorRevenues(params: {
  page: number
  limit: number
  search?: string
  status?: 'PENDING' | 'PAID_OUT'
  from?: string
  to?: string
}) {
  return apiRequest<InvestorRevenuesResponse>(`/investor/revenues${toQuery(params)}`)
}

/** GET /investor/marketplace — motos actives avec des parts à vendre (recherche / zone côté serveur). */
export function getMarketplace(params: { search?: string; zone?: string; sort?: MarketplaceSort }) {
  return apiRequest<MarketplaceResponse>(`/investor/marketplace${toQuery(params)}`)
}

export function listMyShareRequests() {
  return apiRequest<ShareRequestItem[]>('/investor/share-requests')
}

/** POST /investor/share-requests — demande de parts, en attente de validation par l'admin. */
export function createShareRequest(body: { motoId: number; amount: number }) {
  return apiRequest<ShareRequestItem>('/investor/share-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function cancelShareRequest(id: number) {
  return apiRequest<{ id: number }>(`/investor/share-requests/${id}`, { method: 'DELETE' })
}

/** GET /investor/payouts — mode de versement, sommes reçues et en attente. */
export function getPayoutSummary() {
  return apiRequest<InvestorPayoutSummary>('/investor/payouts')
}

// ─── Paramètres ──────────────────────────────────────────────────────────

/** GET /investor/settings — profil, mode de versement, portefeuille et préférences de notification. */
export function getInvestorSettings() {
  return apiRequest<InvestorSettings>('/investor/settings')
}

/** PUT /investor/settings — préférences de notification. */
export function updateInvestorSettings(notifications: Partial<InvestorNotificationPrefs>) {
  return apiRequest<InvestorSettings>('/investor/settings', { method: 'PUT', body: JSON.stringify({ notifications }) })
}

/** PUT /investor/profile */
export function updateInvestorProfile(body: UpdateAdminProfileBody) {
  return apiRequest<Omit<InvestorSettings['profile'], 'memberSince' | 'passwordChangedAt'>>('/investor/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** PUT /investor/password */
export function changeInvestorPassword(body: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ success: boolean }>('/investor/password', { method: 'PUT', body: JSON.stringify(body) })
}

/** POST /investor/avatar — téléverse la photo de profil (JPEG, PNG, WebP, 5 Mo max). */
export function uploadInvestorAvatar(file: File): Promise<{ avatarUrl: string }> {
  const body = new FormData()
  body.append('image', file)
  return apiRequest<{ avatarUrl: string }>('/investor/avatar', { method: 'POST', body })
}

/** POST /investor/settings/weekly-report — envoie tout de suite le rapport de la semaine écoulée par e-mail. */
export function sendInvestorWeeklyReportNow() {
  return apiRequest<InvestorWeeklyReportResult>('/investor/settings/weekly-report', { method: 'POST' })
}
