import { apiRequest, getBaseUrl } from '../lib/apiClient'
import type {
  DriverProgress,
  CreateReportBody,
  ReportResponse,
  DriverPaymentFilter,
  PaymentMethod,
  PaymentSummary,
  PaginatedDriverPayments,
  DeclarePaymentResponse,
  DriverNotificationPrefs,
  DriverReport,
  DriverSettingsResponse,
  FaqItem,
  UpdateAdminProfileBody,
  ReportCategorie,
  SupportConfig,
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
export function getDriverPayments(
  page = 1,
  limit = 10,
  filters: { status?: DriverPaymentFilter; method?: PaymentMethod; search?: string } = {},
): Promise<PaginatedDriverPayments> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filters.status) qs.set('status', filters.status)
  if (filters.method) qs.set('method', filters.method)
  if (filters.search) qs.set('search', filters.search)
  return apiRequest<PaginatedDriverPayments>(`/driver/payments?${qs.toString()}`)
}

/**
 * POST /driver/payments
 * Le chauffeur déclare un versement (multipart, preuve de paiement en option) ; il reste « En attente » jusqu'à sa validation par l'admin.
 * `proofSaved` : null sans preuve jointe, false si le stockage d'images a échoué (le versement est quand même déclaré).
 */
export function declareDriverPayment(body: { amount: number; method: PaymentMethod; proof?: File }): Promise<DeclarePaymentResponse> {
  const form = new FormData()
  form.append('amount', String(body.amount))
  form.append('method', body.method)
  if (body.proof) form.append('proof', body.proof)
  return apiRequest<DeclarePaymentResponse>('/driver/payments', { method: 'POST', body: form })
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
    // le serveur explique le refus (description trop courte, image invalide…) : on le montre tel quel
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null
    const detail = Array.isArray(body?.message) ? body.message.join(' ') : body?.message
    throw new Error(detail || `Erreur ${res.status}`)
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

/** GET /driver/reports — mes signalements et leur état de traitement. */
export function getDriverReports(): Promise<DriverReport[]> {
  return apiRequest<DriverReport[]>('/driver/reports')
}

/** GET /driver/support/config — coordonnées du support, définies par l'administrateur. */
export function getSupportConfig(): Promise<SupportConfig> {
  return apiRequest<SupportConfig>('/driver/support/config')
}

// ─── Paramètres ──────────────────────────────────────────────────────────

/** GET /driver/settings — profil, préférences de notification et véhicule. */
export function getDriverSettings(): Promise<DriverSettingsResponse> {
  return apiRequest<DriverSettingsResponse>('/driver/settings')
}

/** PUT /driver/settings — préférences de notification. */
export function updateDriverSettings(notifications: Partial<DriverNotificationPrefs>): Promise<DriverSettingsResponse> {
  return apiRequest<DriverSettingsResponse>('/driver/settings', { method: 'PUT', body: JSON.stringify({ notifications }) })
}

/** PUT /driver/profile */
export function updateDriverProfile(body: UpdateAdminProfileBody) {
  return apiRequest<Omit<DriverSettingsResponse['profile'], 'memberSince' | 'passwordChangedAt'>>('/driver/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** PUT /driver/password */
export function changeDriverPassword(body: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ success: boolean }>('/driver/password', { method: 'PUT', body: JSON.stringify(body) })
}

/** POST /driver/avatar — téléverse la photo de profil (JPEG, PNG, WebP, 5 Mo max). */
export function uploadDriverAvatar(file: File): Promise<{ avatarUrl: string }> {
  const body = new FormData()
  body.append('image', file)
  return apiRequest<{ avatarUrl: string }>('/driver/avatar', { method: 'POST', body })
}
