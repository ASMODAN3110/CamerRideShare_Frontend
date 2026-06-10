/** Compact XAF display: 1_250_000 → "1,3M" or "159 209" */
export function formatXaf(amount: number, compact = false): string {
  const abs = Math.abs(amount)
  if (compact && abs >= 1_000_000) {
    const m = abs / 1_000_000
    const formatted = m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, '')
    return `${formatted}M`
  }
  return abs.toLocaleString('fr-FR')
}

export function formatXafLabel(amount: number, compact = false): string {
  return `${formatXaf(amount, compact)} XAF`
}

/** +5% / -65% */
export function formatDeltaPct(pct: number): string {
  if (pct > 0) return `+${pct}%`
  if (pct < 0) return `${pct}%`
  return '0%'
}

export function deltaPctTone(pct: number): 'positive' | 'negative' | 'neutral' {
  if (pct > 0) return 'positive'
  if (pct < 0) return 'negative'
  return 'neutral'
}

/** "24 Oct, 2023 - 10:42" from ISO string */
export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} - ${time}`
}

/** "20 Oct - 26 Oct" from YYYY-MM-DD strings */
export function formatPeriod(start: string, end: string): string {
  const fmt = (s: string) => {
    const d = new Date(s + 'T00:00:00')
    const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    const year = d.getFullYear()
    return { day, year }
  }
  const a = fmt(start)
  const b = fmt(end)
  if (a.year === b.year) return `${a.day} - ${b.day}`
  return `${a.day} ${a.year} - ${b.day} ${b.year}`
}

/** "Jean-Paul N." → "JN" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
