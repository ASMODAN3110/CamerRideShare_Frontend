import { apiRequest } from '../lib/apiClient'
import type { CreateInvitationBody, Invitation } from '../types/api'

/**
 * POST /invitations
 * Sends an investor invitation by email. role must be exactly "INVESTOR".
 * No user account is created at this stage.
 *
 * Possible 409 errors:
 *   - "Email already registered"
 *   - "A pending invitation already exists for this email"
 */
export function inviteInvestor(body: CreateInvitationBody): Promise<Invitation> {
  return apiRequest<Invitation>('/invitations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
