import type { CalendarEvent } from '../types/api'

/** Jour local au format `AAAA-MM-JJ`, comme l'API. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

/** Lundi de la semaine contenant la date. */
function mondayOf(d: Date): Date {
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7))
}

/** Jours affichés pour un mois : de la semaine du 1er (lundi) à celle du dernier jour (dimanche). */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = mondayOf(first)
  const end = addDays(mondayOf(last), 6)
  const days: Date[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return days
}

export function monthLabel(month: Date): string {
  const label = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function dayLabel(key: string): string {
  const label = parseKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const EVENT_STATUS_UI: Record<CalendarEvent['status'], { label: string; variant: 'red' | 'orange' | 'green'; dot: string }> = {
  LATE: { label: 'En retard', variant: 'red', dot: 'bg-destructive' },
  UPCOMING: { label: 'À venir', variant: 'orange', dot: 'bg-warning' },
  PAID: { label: 'Payé', variant: 'green', dot: 'bg-primary' },
}

/** Description courte d'une échéance : moto du chauffeur, ou mode de reversement de l'investisseur. */
export function eventSubject(e: CalendarEvent): string {
  if (e.kind === 'DRIVER_PAYMENT') {
    if (e.settledEarly) return `Véhicule ${e.motoMatricule} · montant total soldé : échéance finale avancée à cette semaine`
    if (e.final && e.weeksSaved > 0) {
      return `Véhicule ${e.motoMatricule} · avance sur le rythme : échéance finale avancée de ${e.weeksSaved} semaine${e.weeksSaved > 1 ? 's' : ''}`
    }
    return e.extension
      ? `Véhicule ${e.motoMatricule} · semaine ajoutée à la fin du calendrier pour un retard`
      : `Véhicule ${e.motoMatricule} · versement hebdomadaire`
  }
  return `Reversement ${e.frequency === 'MONTHLY' ? 'mensuel' : 'hebdomadaire'}`
}
