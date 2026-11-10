import type { InvestorTerminationResult, TerminationReason } from '../types/api'
import { formatXafLabel } from './format'

export const REASON_LABEL: Record<TerminationReason, string> = {
  BREACH: 'Manquement aux obligations du contrat',
  VEHICLE_ISSUE: 'Véhicule immobilisé ou hors service',
  MUTUAL: 'Accord amiable',
  LOSS: 'Perte du véhicule',
  OTHER: 'Autre motif',
}

/** Motifs proposés pour résilier le contrat d'un conducteur. */
export const DRIVER_REASONS: TerminationReason[] = ['BREACH', 'VEHICLE_ISSUE', 'MUTUAL', 'LOSS', 'OTHER']

/** Motifs proposés pour résilier le contrat d'une part d'investisseur. */
export const INVESTOR_REASONS: TerminationReason[] = ['VEHICLE_ISSUE', 'MUTUAL', 'LOSS', 'BREACH', 'OTHER']

/** Message de confirmation d'une résiliation de part : ce que l'admin a décidé (remboursement, réaffectation, perte). */
export function investorResultMessage(res: InvestorTerminationResult): string {
  const parts = ['Contrat de la part résilié.']
  if (res.refundedAmount > 0) parts.push(`Capital remboursé : ${formatXafLabel(res.refundedAmount)}.`)
  if (res.transfer) parts.push(`${formatXafLabel(res.transfer.amount)} réaffectés au véhicule ${res.transfer.matricule}.`)
  if (res.reason === 'LOSS') parts.push(`Capital non récupéré, classé en perte : ${formatXafLabel(res.loss)}.`)
  return parts.join(' ')
}
