import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Banknote, CalendarClock, ChevronLeft, ChevronRight, Clock, Search, User } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { dateKey, dayLabel, EVENT_STATUS_UI, eventSubject, monthGrid, monthLabel } from '@/lib/calendar'
import { formatXafLabel, initials } from '@/lib/format'
import { getCalendar } from '../services/calendarService'
import type { CalendarEvent, CalendarResponse } from '../types/api'

const ALL = 'all'
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type CalendrierPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function SummaryCard(props: { label: string; count: number; amount: number; tone: string; Icon: typeof Clock }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${props.tone}`}>
          <props.Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardDescription>{props.label}</CardDescription>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <CardTitle className="text-2xl font-extrabold tabular-nums">{props.count}</CardTitle>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums">{formatXafLabel(props.amount, true)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EventRow({ event }: { event: CalendarEvent }) {
  const ui = EVENT_STATUS_UI[event.status]
  const remaining = event.amount - event.paidAmount
  const isDriver = event.kind === 'DRIVER_PAYMENT'
  return (
    <li className="flex items-start gap-3 py-3">
      <Avatar className="size-10 shrink-0">
        {event.avatarUrl ? <AvatarImage src={event.avatarUrl} alt={event.personName} /> : null}
        <AvatarFallback className="text-xs">{initials(event.personName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold">{event.personName}</span>
          <Badge variant={isDriver ? 'blue' : 'secondary'} className="gap-1 text-[10px]">
            {isDriver ? <User className="size-3" /> : <Banknote className="size-3" />}
            {isDriver ? 'Chauffeur' : 'Investisseur'}
          </Badge>
          {event.extension ? (
            <Badge variant="orange" className="text-[10px]">
              Semaine ajoutée
            </Badge>
          ) : null}
          {event.final ? (
            <Badge variant={event.weeksSaved > 0 ? 'green' : 'secondary'} className="text-[10px]">
              {event.settledEarly ? 'Soldé en avance' : event.weeksSaved > 0 ? `Échéance avancée (−${event.weeksSaved} sem.)` : 'Échéance finale'}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{eventSubject(event)}</div>
        {event.paidAmount > 0 && event.status !== 'PAID' ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {formatXafLabel(event.paidAmount)} déjà {isDriver ? 'versés' : 'reversés'} sur {formatXafLabel(event.amount)}
          </div>
        ) : null}
        {event.estimated ? <div className="mt-0.5 text-xs text-muted-foreground">Montant provisoire : la période n&apos;est pas terminée.</div> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold tabular-nums">{formatXafLabel(event.status === 'PAID' ? event.paidAmount : remaining)}</span>
        <Badge variant={ui.variant}>{ui.label}</Badge>
      </div>
    </li>
  )
}

export default function CalendrierPage({ theme, onToggleTheme }: CalendrierPageProps) {
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(todayKey)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // résultat rattaché à sa requête : changer de filtre n'affiche jamais les anciennes échéances
  const [result, setResult] = useState<{ key: string; data: CalendarResponse | null; error: string | null } | null>(null)

  const days = useMemo(() => monthGrid(month), [month])
  const from = dateKey(days[0])
  const to = dateKey(days[days.length - 1])
  const requestKey = `${from}|${to}|${type}|${status}|${debouncedSearch}`

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    getCalendar({
      from,
      to,
      type: (type || undefined) as 'DRIVER_PAYMENT' | 'INVESTOR_PAYOUT' | undefined,
      status: (status || undefined) as 'PAID' | 'UPCOMING' | 'LATE' | undefined,
      search: debouncedSearch || undefined,
    })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key: requestKey, data: null, error: err instanceof Error ? err.message : 'Impossible de charger le calendrier.' })
      })
    return () => {
      cancelled = true
    }
  }, [from, to, type, status, debouncedSearch, requestKey])

  const current = result && result.key === requestKey ? result : null
  const loading = current === null
  const events = useMemo(() => current?.data?.events ?? [], [current])
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return map
  }, [events])
  const dayEvents = byDay.get(selected) ?? []
  const summary = current?.data?.summary

  const goToMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelected(todayKey)
  }

  return (
    <AdminLayout
      title="Calendrier"
      description="Échéances de paiement des chauffeurs et reversements dus aux investisseurs."
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      {current?.error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{current.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="En retard" count={summary?.late.count ?? 0} amount={summary?.late.amount ?? 0} tone="bg-destructive/10 text-destructive" Icon={AlertTriangle} />
        <SummaryCard label="À venir" count={summary?.upcoming.count ?? 0} amount={summary?.upcoming.amount ?? 0} tone="bg-warning/25 text-warning-foreground" Icon={Clock} />
        <SummaryCard label="Payées" count={summary?.paid.count ?? 0} amount={summary?.paid.amount ?? 0} tone="bg-success/12 text-success-foreground" Icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              <span className="min-w-0 flex-1 text-lg">{monthLabel(month)}</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" aria-label="Mois précédent" onClick={() => goToMonth(-1)}>
                  <ChevronLeft />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={goToday}>
                  Aujourd&apos;hui
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Mois suivant" onClick={() => goToMonth(1)}>
                  <ChevronRight />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-52">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom ou matricule…"
                  aria-label="Rechercher une personne ou un véhicule"
                  className="pl-9"
                />
              </div>
              <Select value={type || ALL} onValueChange={(v) => setType(v === ALL ? '' : v)}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par type d'échéance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes les échéances</SelectItem>
                  <SelectItem value="DRIVER_PAYMENT">Chauffeurs</SelectItem>
                  <SelectItem value="INVESTOR_PAYOUT">Investisseurs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status || ALL} onValueChange={(v) => setStatus(v === ALL ? '' : v)}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Filtrer par statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les statuts</SelectItem>
                  <SelectItem value="LATE">En retard</SelectItem>
                  <SelectItem value="UPCOMING">À venir</SelectItem>
                  <SelectItem value="PAID">Payées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2">
                    <span className="sm:hidden">{w.charAt(0)}</span>
                    <span className="hidden sm:inline">{w}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d) => {
                  const key = dateKey(d)
                  const list = byDay.get(key) ?? []
                  const inMonth = d.getMonth() === month.getMonth()
                  const isSelected = key === selected
                  const counts = (['LATE', 'UPCOMING', 'PAID'] as const)
                    .map((s) => ({ s, n: list.filter((e) => e.status === s).length }))
                    .filter((c) => c.n > 0)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-pressed={isSelected}
                      aria-label={`${dayLabel(key)} : ${list.length} échéance${list.length > 1 ? 's' : ''}`}
                      className={`relative flex min-h-14 min-w-0 flex-col items-stretch gap-1 border-b border-r p-1 text-left transition-colors last:border-r-0 hover:bg-accent focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-20 sm:p-1.5 md:min-h-24 ${
                        isSelected ? 'bg-primary/10' : inMonth ? '' : 'bg-muted/30'
                      }`}
                    >
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                          key === todayKey ? 'bg-primary text-primary-foreground' : inMonth ? '' : 'text-muted-foreground'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {loading ? null : (
                        <>
                          <span className="flex flex-wrap gap-0.5">
                            {counts.map(({ s, n }) => (
                              <span
                                key={s}
                                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white ${EVENT_STATUS_UI[s].dot}`}
                              >
                                {n}
                              </span>
                            ))}
                          </span>
                          <span className="hidden min-w-0 flex-col gap-0.5 md:flex">
                            {list.slice(0, 2).map((e) => (
                              <span key={e.id} className="truncate text-[10px] leading-tight text-muted-foreground">
                                {e.personName}
                              </span>
                            ))}
                            {list.length > 2 ? <span className="text-[10px] font-medium text-muted-foreground">+{list.length - 2}</span> : null}
                          </span>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {(['LATE', 'UPCOMING', 'PAID'] as const).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${EVENT_STATUS_UI[s].dot}`} />
                  {EVENT_STATUS_UI[s].label}
                </span>
              ))}
              <span>Chauffeurs : échéance le dimanche, une semaine est ajoutée à la fin du calendrier pour chaque semaine de retard · Investisseurs : le lundi (ou le 1er du mois)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>{dayLabel(selected)}</CardTitle>
            <CardDescription>
              {loading ? 'Chargement…' : `${dayEvents.length} échéance${dayEvents.length > 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : dayEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune échéance ce jour-là.</p>
            ) : (
              <ul className="max-h-[32rem] divide-y overflow-y-auto">
                {dayEvents.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
