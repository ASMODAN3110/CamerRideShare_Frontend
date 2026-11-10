import { apiRequest } from '../lib/apiClient'
import type { NotificationsResponse } from '../types/api'

/** GET /notifications — les 30 dernières notifications de l'utilisateur connecté + nombre de non lues. */
export function listNotifications() {
  return apiRequest<NotificationsResponse>('/notifications')
}

export function markNotificationRead(id: number) {
  return apiRequest<{ id: number; read: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/notifications/read-all', { method: 'PATCH' })
}
