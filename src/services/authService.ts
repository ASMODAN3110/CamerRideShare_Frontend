import { apiRequest } from '../lib/apiClient'
import type { AcceptInvitationBody, InvitationInfo, LoginBody, LoginResponse, User } from '../types/auth'

export function login(body: LoginBody) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** GET /auth/invitations/:token — email et rôle de l'invitation (404 si inconnue, 410 si expirée). */
export function getInvitation(token: string) {
  return apiRequest<InvitationInfo>(`/auth/invitations/${encodeURIComponent(token)}`)
}

/** POST /auth/accept-invitation — seule voie d'inscription : créer son compte depuis une invitation. */
export function acceptInvitation(body: AcceptInvitationBody) {
  return apiRequest<User>('/auth/accept-invitation', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
