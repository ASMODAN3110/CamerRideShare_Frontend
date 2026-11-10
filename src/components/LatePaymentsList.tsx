import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { parseKey } from '@/lib/calendar'
import { formatXafLabel, initials } from '@/lib/format'
import type { LatePayment, LatePaymentsParams, LatePaymentsResponse } from '../types/api'

const ALL = 'all'
const PAGE_SIZE = 10

const day = (key: string) => parseKey(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function Row({ row, showDriver }: { row: LatePayment; showDriver: boolean }) {
  const open = row.status === 'OPEN'
  return (
    <li className="flex items-start gap-3 py-3">
      {showDriver ? (
        <Avatar className="size-10 shrink-0">
          {row.driver.avatarUrl ? <AvatarImage src={row.driver.avatarUrl} alt={row.driver.fullName} /> : null}
          <AvatarFallback className="text-xs">{initials(row.driver.fullName)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${open ? 'bg-destructive/10 text-destructive' : 'bg-success/12 text-success-foreground'}`}>
          {open ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {showDriver ? <span className="truncate text-sm font-semibold">{row.driver.fullName}</span> : null}
          <span className="text-sm font-semibold">Semaine du {day(row.dueDate)}</span>
          <Badge variant="secondary" className="text-[10px]">
            {row.moto.matricule}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          En retard depuis le {day(row.lateSince)}
          {open
            ? ` · ${row.daysLate} jour${row.daysLate > 1 ? 's' : ''} de retard`
            : ` · régularisé le ${new Date(row.settledAt as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} (${row.daysLate} jour${row.daysLate > 1 ? 's' : ''} de retard)`}
        </div>
        {open && row.missingAmount < row.amountDue ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {formatXafLabel(row.amountDue - row.missingAmount)} déjà versés sur {formatXafLabel(row.amountDue)}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold tabular-nums">{formatXafLabel(open ? row.missingAmount : row.amountDue)}</span>
        <Badge variant={open ? 'red' : 'green'}>{open ? 'À régulariser' : 'Régularisé'}</Badge>
      </div>
    </li>
  )
}

/**
 * Historique des semaines de versement en retard : chaque retard est enregistré à son échéance et reste consultable
 * après régularisation. Filtres, recherche et pagination sont appliqués par le serveur.
 */
export default function LatePaymentsList(props: {
  fetcher: (params: LatePaymentsParams) => Promise<LatePaymentsResponse>
  /** Vue admin : plusieurs chauffeurs, avec recherche par nom ou matricule. */
  showDriver?: boolean
  onSummary?: (summary: LatePaymentsResponse['summary']) => void
}) {
  const { fetcher, showDriver = false, onSummary } = props
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  // résultat rattaché à sa requête : changer de filtre n'affiche jamais l'ancienne liste
  const [result, setResult] = useState<{ key: string; data: LatePaymentsResponse | null; error: string | null } | null>(null)
  const requestKey = `${status}|${debounced}|${page}`

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    fetcher({ page, limit: PAGE_SIZE, status: (status || undefined) as LatePaymentsParams['status'], search: debounced || undefined })
      .then((data) => {
        if (cancelled) return
        setResult({ key: requestKey, data, error: null })
        onSummary?.(data.summary)
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key: requestKey, data: null, error: err instanceof Error ? err.message : "Impossible de charger l'historique des retards." })
      })
    return () => {
      cancelled = true
    }
  }, [fetcher, page, status, debounced, requestKey, onSummary])

  const current = result && result.key === requestKey ? result : null
  const data = current?.data
  const pages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {showDriver ? (
          <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou matricule…"
              aria-label="Rechercher un chauffeur ou un véhicule"
              className="pl-9"
            />
          </div>
        ) : null}
        <Select
          value={status || ALL}
          onValueChange={(v) => {
            setStatus(v === ALL ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer les retards par statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les retards</SelectItem>
            <SelectItem value="OPEN">À régulariser</SelectItem>
            <SelectItem value="SETTLED">Régularisés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {current?.error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{current.error}</AlertDescription>
        </Alert>
      ) : null}

      {current === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <ul className="divide-y" aria-label="Historique des retards de paiement">
          {data.data.map((row) => (
            <Row key={row.id} row={row} showDriver={showDriver} />
          ))}
        </ul>
      ) : !current.error ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucun retard enregistré.</p>
      ) : null}

      {data && data.total > PAGE_SIZE ? (
        // collée en bas de la zone de défilement : la pagination reste visible quand la liste défile dans sa carte
        <div className="sticky -bottom-px z-10 -mx-1 flex items-center justify-between gap-2 bg-card px-1 py-2">
          <span className="text-xs text-muted-foreground">
            Page {page} sur {pages} · {data.total} retard{data.total > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="icon" aria-label="Page précédente" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft />
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Page suivante" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
