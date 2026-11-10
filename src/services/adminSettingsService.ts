import { apiRequest } from '../lib/apiClient'
import type {
  AdminAccessItem,
  AdminSettings,
  CreateAdminBody,
  UpdateAdminProfileBody,
  UpdateAdminSettingsBody,
} from '../types/api'

/** GET /admin/settings — profil, réglages de la plateforme, seuils d'alerte et préférences de notification. */
export function getAdminSettings(): Promise<AdminSettings> {
  return apiRequest<AdminSettings>('/admin/settings')
}

/** PUT /admin/settings — réglages globaux et préférences de notification de l'admin connecté. */
export function updateAdminSettings(body: UpdateAdminSettingsBody): Promise<AdminSettings> {
  return apiRequest<AdminSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) })
}

/** PUT /admin/profile */
export function updateAdminProfile(body: UpdateAdminProfileBody) {
  return apiRequest<AdminSettings['profile']>('/admin/profile', { method: 'PUT', body: JSON.stringify(body) })
}

/** PUT /admin/password */
export function changeAdminPassword(body: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ success: boolean }>('/admin/password', { method: 'PUT', body: JSON.stringify(body) })
}

/** POST /admin/avatar — téléverse la photo de profil (JPEG, PNG, WebP, 5 Mo max). */
export function uploadAdminAvatar(file: File): Promise<{ avatarUrl: string }> {
  const body = new FormData()
  body.append('image', file)
  return apiRequest<{ avatarUrl: string }>('/admin/avatar', { method: 'POST', body })
}

/** POST /admin/settings/weekly-report — envoie tout de suite le rapport hebdomadaire à l'admin connecté. */
export function sendWeeklyReportNow() {
  return apiRequest<{ emailSent: boolean }>('/admin/settings/weekly-report', { method: 'POST' })
}

// ─── Gestion des accès ───────────────────────────────────────────────────

export function listAdminAccess(): Promise<AdminAccessItem[]> {
  return apiRequest<AdminAccessItem[]>('/admin/access')
}

/** `emailSent` : identifiants envoyés par e-mail (false : échec d'envoi, null : aucune adresse). */
export function createAdminAccess(body: CreateAdminBody) {
  return apiRequest<{ id: number; fullName: string; emailSent: boolean | null }>('/admin/access', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setAdminActive(id: number, isActive: boolean) {
  return apiRequest<{ id: number; isActive: boolean }>(`/admin/access/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

/** Mot de passe temporaire : renvoyé seulement si l'e-mail n'a pas pu partir. */
export function resetAdminPassword(id: number) {
  return apiRequest<{ id: number; emailSent: boolean | null; temporaryPassword?: string }>(`/admin/access/${id}/reset-password`, {
    method: 'POST',
  })
}
