import { apiRequest } from '../lib/apiClient'
import type {
  DriverProgress,
  DriverPayment,
  CreateReportBody,
  ReportResponse,
} from '../types/api'

/**
 * GET /driver/progress
 * Retourne la progression de remboursement du conducteur connecté (JWT requis, rôle DRIVER).
 */
export function getDriverProgress(): Promise<DriverProgress> {
  return apiRequest<DriverProgress>('/driver/progress')
}

/**
 * GET /driver/payments
 * Retourne l'historique des paiements du conducteur connecté (JWT requis, rôle DRIVER).
 */
export function getDriverPayments(): Promise<DriverPayment[]> {
  return apiRequest<DriverPayment[]>('/driver/payments')
}

/**
 * POST /driver/reports
 * Soumet un signalement / problème (JWT requis, rôle DRIVER).
 * Response: { id, status: 'OPEN' }
 */
export function createReport(body: CreateReportBody): Promise<ReportResponse> {
  return apiRequest<ReportResponse>('/driver/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  })
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
