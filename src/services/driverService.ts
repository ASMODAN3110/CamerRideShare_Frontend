import { apiRequest, getBaseUrl } from '../lib/apiClient'
import type {
  DriverProgress,
  CreateReportBody,
  ReportResponse,
  PaymentSummary,
  PaginatedDriverPayments,
  FaqItem,
  ReportCategorie,
} from '../types/api'

/**
 * GET /driver/progress
 * Retourne la progression de remboursement du conducteur connecté (JWT requis, rôle DRIVER).
 */
export function getDriverProgress(): Promise<DriverProgress> {
  return apiRequest<DriverProgress>('/driver/progress')
}

/**
 * GET /driver/payments?page=1&limit=10
 * Retourne l'historique des paiements du conducteur, paginé (JWT requis, rôle DRIVER).
 * @param page  Numéro de page (défaut 1)
 * @param limit Éléments par page (défaut 10)
 */
export function getDriverPayments(page = 1, limit = 10): Promise<PaginatedDriverPayments> {
  return apiRequest<PaginatedDriverPayments>(`/driver/payments?page=${page}&limit=${limit}`)
}

/**
 * GET /driver/payments/summary
 * Retourne les KPIs de la page paiements (total payé, reste à payer, dernier versement).
 */
export function getPaymentSummary(): Promise<PaymentSummary> {
  return apiRequest<PaymentSummary>('/driver/payments/summary')
}

/**
 * POST /driver/reports
 * Soumet un signalement texte (JWT requis, rôle DRIVER).
 * Response: { id, status: 'OPEN' }
 */
export function createReport(body: CreateReportBody): Promise<ReportResponse> {
  return apiRequest<ReportResponse>('/driver/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * POST /driver/reports (multipart/form-data)
 * Soumet un signalement avec catégorie, description et photo optionnelle.
 * N'utilise pas apiRequest car le Content-Type doit être multipart (déduit par fetch).
 */
export async function submitReportWithPhoto(
  description: string,
  categorie: ReportCategorie,
  photoFile?: File,
): Promise<ReportResponse> {
  const token = localStorage.getItem('access_token')
  const baseUrl = getBaseUrl()

  const formData = new FormData()
  formData.append('description', description)
  formData.append('categorie', categorie)
  if (photoFile) formData.append('photo', photoFile)

  const res = await fetch(`${baseUrl}/driver/reports`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const msg = `Erreur ${res.status}: ${res.statusText}`
    throw new Error(msg)
  }

  return res.json()
}

/**
 * GET /driver/faq
 * Retourne la liste des questions fréquentes.
 */
export function getDriverFaq(): Promise<FaqItem[]> {
  return apiRequest<FaqItem[]>('/driver/faq')
}

/**
 * DELETE /driver/payments/:id
 * Supprime un paiement du conducteur connecté (JWT requis, rôle DRIVER).
 * Response: { success: true }
 */
export function deleteDriverPayment(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/driver/payments/${id}`, {
    method: 'DELETE',
  })
}
