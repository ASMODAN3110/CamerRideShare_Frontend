/**
 * Règle métier : le chauffeur rembourse un montant cible (160 % du prix d'achat) par versements hebdomadaires.
 * L'admin fixe la cible et le versement par semaine ; la durée du contrat en est déduite
 * (800 000 à 25 000 par semaine → 32 semaines). Un investisseur finance le prix d'achat par parts
 * (dès 50 000 XAF) et reçoit 160 % de sa mise sur la durée du contrat.
 * Miroir de backend/src/common/investment-rules.ts.
 */
export const DEFAULT_PLAN_WEEKS = 32
/** Garde-fou : un contrat ne peut pas dépasser 5 ans. */
export const MAX_PLAN_WEEKS = 260
export const RETURN_MULTIPLIER = 1.6
export const MIN_INVESTMENT_XAF = 50_000

export const purchasePrice = (targetAmount: number) => Math.round(targetAmount / RETURN_MULTIPLIER)
export const expectedReturn = (invested: number) => Math.round(invested * RETURN_MULTIPLIER)
export const weeklyReturn = (invested: number, weeks: number = DEFAULT_PLAN_WEEKS) =>
  Math.round(expectedReturn(invested) / Math.max(weeks, 1))
/** Versement hebdomadaire proposé par défaut : la cible répartie sur 32 semaines. */
export const defaultWeeklyAmount = (targetAmount: number) => Math.max(Math.round(targetAmount / DEFAULT_PLAN_WEEKS), 1)
/** Durée du contrat en semaines, déduite de la cible et du versement hebdomadaire (arrondie au supérieur). */
export const planWeeks = (targetAmount: number, weeklyAmount: number) =>
  Math.max(Math.ceil(targetAmount / Math.max(weeklyAmount, 1)), 1)
/** Capital qu'il reste à financer sur la moto. */
export const fundingRemaining = (targetAmount: number, funded: number) => Math.max(purchasePrice(targetAmount) - funded, 0)
/** Part du versement hebdomadaire du chauffeur revenant à un apport (sa fraction du prix d'achat). */
export const weeklyShareOf = (targetAmount: number, weeklyAmount: number, invested: number) =>
  Math.round((weeklyAmount * invested) / Math.max(purchasePrice(targetAmount), 1))
