import { dateKey } from './calendar'

export type PeriodPreset = 'ALL' | 'MONTH' | 'LAST_MONTH' | 'QUARTER' | 'YEAR' | 'LAST_YEAR' | 'CUSTOM'

export const PERIOD_LABEL: Record<PeriodPreset, string> = {
  ALL: "Tout l'historique",
  MONTH: 'Ce mois-ci',
  LAST_MONTH: 'Le mois dernier',
  QUARTER: 'Ce trimestre',
  YEAR: 'Cette année',
  LAST_YEAR: "L'année dernière",
  CUSTOM: 'Période personnalisée',
}

export interface PeriodRange {
  /** Premier jour inclus, `AAAA-MM-JJ` ; absent : depuis l'origine. */
  from?: string
  /** Dernier jour inclus, `AAAA-MM-JJ` ; absent : jusqu'à aujourd'hui. */
  to?: string
}

/** Bornes d'une période prédéfinie du relevé ; les périodes en cours s'arrêtent à aujourd'hui. */
export function presetRange(preset: Exclude<PeriodPreset, 'CUSTOM'>, today: Date): PeriodRange {
  const y = today.getFullYear()
  const m = today.getMonth()
  switch (preset) {
    case 'ALL':
      return {}
    case 'MONTH':
      return { from: dateKey(new Date(y, m, 1)), to: dateKey(today) }
    case 'LAST_MONTH':
      return { from: dateKey(new Date(y, m - 1, 1)), to: dateKey(new Date(y, m, 0)) }
    case 'QUARTER':
      return { from: dateKey(new Date(y, Math.floor(m / 3) * 3, 1)), to: dateKey(today) }
    case 'YEAR':
      return { from: dateKey(new Date(y, 0, 1)), to: dateKey(today) }
    case 'LAST_YEAR':
      return { from: dateKey(new Date(y - 1, 0, 1)), to: dateKey(new Date(y - 1, 11, 31)) }
  }
}

/** Chemin de l'API du relevé pour la période choisie. */
export function statementPath(range: PeriodRange): string {
  const qs = new URLSearchParams()
  if (range.from) qs.set('from', range.from)
  if (range.to) qs.set('to', range.to)
  const query = qs.toString()
  return `/investor/statement${query ? `?${query}` : ''}`
}

/** Message d'erreur d'une période personnalisée invalide, ou null. */
export function customRangeError(range: PeriodRange): string | null {
  if (!range.from && !range.to) return 'Choisissez au moins une date.'
  if (range.from && range.to && range.to < range.from) return 'La date de fin précède la date de début.'
  return null
}
