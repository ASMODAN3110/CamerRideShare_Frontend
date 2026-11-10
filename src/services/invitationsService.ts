import { apiRequest } from '../lib/apiClient'
import type { CreateInvitationBody, Invitation } from '../types/api'

/**
 * POST /invitations
 * Sends an invitation by email (INVESTOR or DRIVER).
 * No user account is created at this stage.
 *
 * Possible 409 errors:
 *   - "Email already registered"
 *   - "A pending invitation already exists for this email"
 */
export function inviteUser(body: CreateInvitationBody): Promise<Invitation> {
  return apiRequest<Invitation>('/invitations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
