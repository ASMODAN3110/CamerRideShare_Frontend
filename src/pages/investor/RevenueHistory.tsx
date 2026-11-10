import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'

import InvestorMotoDetailModal from '../../components/InvestorMotoDetailModal'
import StatementDownload from '../../components/StatementDownload'
import PortalLayout from '../../components/admin/AdminLayout'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { formatXafLabel } from '../../lib/format'
import { PAYOUT_FREQUENCY_LABEL } from '../../lib/payouts'
import { customRangeError, PERIOD_LABEL, presetRange, type PeriodPreset, type PeriodRange } from '../../lib/statementPeriods'
import { getInvestorRevenues, getPayoutSummary } from '../../services/investorService'
import type { InvestorPayoutSummary, InvestorRevenueItem, InvestorRevenuesResponse } from '../../types/api'

const PAGE_SIZE = 10
const ALL = 'all'
const PRESETS = Object.keys(PERIOD_LABEL) as PeriodPreset[]

const dayTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}
const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

/** Pastilles d'une somme : reversée ou à recevoir, et ce qui la distingue (priorité, solde de la Société, rattrapage). */
function StatusBadges({ tx }: { tx: InvestorRevenueItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={tx.paidOutAt ? 'green' : 'orange'} className="gap-1.5 px-2.5 py-1">
        {tx.paidOutAt ? `Versé le ${day(tx.paidOutAt)}` : 'À recevoir'}
      </Badge>
      {tx.rahimApplied ? <Badge variant="secondary">Priorité investisseurs</Badge> : null}
      {tx.settlement ? <Badge variant="secondary">Échéance de la Société</Badge> : null}
      {tx.catchUpXaf > 0 ? <Badge variant="outline">dont rattrapage {formatXafLabel(tx.catchUpXaf)}</Badge> : null}
    </div>
  )
}

function OpenVehicle({ tx, onOpen }: { tx: InvestorRevenueItem; onOpen: (id: number) => void }) {
  if (tx.motoId === null) return null
  const motoId = tx.motoId
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => onOpen(motoId)} aria-label={`Voir le véhicule ${tx.plate}`}>
      Voir le véhicule
    </Button>
  )
}

function RevenueTable({ rows, onOpen }: { rows: InvestorRevenueItem[]; onOpen: (id: number) => void }) {
  return (
    <div className="hidden overflow-x-auto rounded-md border border-border @3xl:block">
      <Table className="min-w-full text-sm" data-testid="revenue-table">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted">
            <TableHead className="px-5 py-3">DATE ET HEURE</TableHead>
            <TableHead className="px-5 py-3">CHAUFFEUR</TableHead>
            <TableHead className="px-5 py-3">VÉHICULE</TableHead>
            <TableHead className="px-5 py-3 text-right">MONTANT</TableHead>
            <TableHead className="px-5 py-3">STATUT</TableHead>
            <TableHead className="px-5 py-3 text-right">ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {rows.map((tx) => (
            <TableRow key={tx.id} className="transition hover:bg-muted/60">
              <TableCell className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{dayTime(tx.date)}</TableCell>
              <TableCell className="px-5 py-3.5">
                <span className="font-semibold text-foreground">{tx.driverName}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{tx.plate}</TableCell>
              <TableCell className="whitespace-nowrap px-5 py-3.5 text-right">
                <span className="font-semibold tabular-nums text-success-foreground">+ {tx.amountXaf.toLocaleString('fr-FR')}</span>
              </TableCell>
              <TableCell className="px-5 py-3.5">
                <StatusBadges tx={tx} />
              </TableCell>
              <TableCell className="px-5 py-3.5 text-right">
                <OpenVehicle tx={tx} onOpen={onOpen} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Même contenu en cartes quand la place manque pour un tableau. */
function RevenueList({ rows, onOpen }: { rows: InvestorRevenueItem[]; onOpen: (id: number) => void }) {
  return (
    <ul className="divide-y rounded-md border @3xl:hidden" aria-label="Sommes perçues" data-testid="revenue-list">
      {rows.map((tx) => (
        <li key={tx.id} className="space-y-2 px-3 py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{tx.driverName}</div>
              <div className="text-xs text-muted-foreground">
                {tx.plate} · {dayTime(tx.date)}
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-success-foreground">+ {formatXafLabel(tx.amountXaf)}</span>
          </div>
          <StatusBadges tx={tx} />
          <OpenVehicle tx={tx} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

interface Loaded {
  key: string
  data: InvestorRevenuesResponse | null
  error: string | null
}

export default function RevenueHistory() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const onToggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<'' | 'PENDING' | 'PAID_OUT'>('')
  const [preset, setPreset] = useState<PeriodPreset>('ALL')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [openMoto, setOpenMoto] = useState<string | null>(null)
  const [payouts, setPayouts] = useState<InvestorPayoutSummary | null>(null)
  // résultat rattaché à sa requête : changer de filtre n'affiche jamais l'ancienne liste
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  // la synthèse reste affichée pendant qu'un filtre se recharge
  const [lastSummary, setLastSummary] = useState<InvestorRevenuesResponse['summary'] | null>(null)

  const range: PeriodRange = useMemo(
    () => (preset === 'CUSTOM' ? { ...(customFrom ? { from: customFrom } : {}), ...(customTo ? { to: customTo } : {}) } : presetRange(preset, new Date())),
    [preset, customFrom, customTo],
  )
  const rangeError = preset === 'CUSTOM' && (customFrom || customTo) ? customRangeError(range) : null
  const effective: PeriodRange = rangeError ? {} : range
  const requestKey = `${debouncedSearch}|${status}|${effective.from ?? ''}|${effective.to ?? ''}|${page}|${reload}`
  const filtersActive = debouncedSearch !== '' || status !== '' || effective.from !== undefined || effective.to !== undefined

  useEffect(() => {
    let cancelled = false
    getPayoutSummary()
      .then((res) => {
        if (!cancelled) setPayouts(res)
      })
      .catch(() => {
        /* le résumé reste masqué si l'API est indisponible */
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  // Recherche différée : filtre et pagination sont appliqués par le serveur.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    getInvestorRevenues({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined, status: status || undefined, from: effective.from, to: effective.to })
      .then((res) => {
        if (cancelled) return
        setLoaded({ key: requestKey, data: res, error: null })
        setLastSummary(res.summary)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key: requestKey, data: null, error: err instanceof Error ? err.message : "Impossible de charger l'historique." })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  const current = loaded && loaded.key === requestKey ? loaded : null
  const loading = current === null
  const rows = current?.data?.items ?? []
  const meta = current?.data?.meta
  const summary = current?.data?.summary ?? lastSummary
  const total = meta?.total ?? 0
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total)

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatus('')
    setPreset('ALL')
    setCustomFrom('')
    setCustomTo('')
    setPage(1)
  }

  const trend = summary?.trendPct
  const trendLabel =
    summary === null
      ? ''
      : trend === null || trend === undefined
        ? 'Aucun revenu le mois dernier'
        : `${trend > 0 ? '+' : trend < 0 ? '−' : ''}${Math.abs(trend)} % par rapport au mois dernier`

  return (
    <PortalLayout portal="investor" title="Historique des revenus" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
      <div className="flex-1 p-4 sm:p-6">
        <div className="@container space-y-5">
          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-start @2xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Historique des Revenus</h1>
              <p className="mt-1 text-sm text-muted-foreground">Toutes les sommes perçues sur vos parts : filtrez-les ou téléchargez votre relevé.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 @2xl:shrink-0">
              <StatementDownload />
            </div>
          </div>

          {/* Synthèse */}
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-3" data-testid="revenue-stats">
            {summary === null ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)
            ) : (
              <>
                <Card className="px-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">REVENU DU MOIS</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="mt-2 whitespace-nowrap text-2xl font-bold tracking-tight tabular-nums text-foreground">{formatXafLabel(summary.monthAmount)}</div>
                    <div className={['mt-2 text-sm font-semibold', trend !== null && trend !== undefined && trend < 0 ? 'text-destructive' : 'text-success-foreground'].join(' ')}>{trendLabel}</div>
                  </CardContent>
                </Card>

                <Card className="px-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DERNIER VERSEMENT</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {summary.last ? (
                      <>
                        <div className="mt-2 whitespace-nowrap text-2xl font-bold tracking-tight tabular-nums text-foreground">+ {formatXafLabel(summary.last.amount)}</div>
                        <div className="mt-2 text-sm font-semibold text-muted-foreground">
                          {summary.last.plate} · {day(summary.last.date)}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground">Aucune somme perçue pour le moment.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="px-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MOYENNE PAR VÉHICULE</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="mt-2 whitespace-nowrap text-2xl font-bold tracking-tight tabular-nums text-foreground">{formatXafLabel(summary.avgPerVehicle)}</div>
                    <div className="mt-2 text-sm font-semibold text-muted-foreground">
                      {summary.monthVehicles > 0 ? `sur ${summary.monthVehicles} véhicule${summary.monthVehicles > 1 ? 's' : ''} ce mois-ci` : 'aucun véhicule n’a rapporté ce mois-ci'}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {payouts ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Versement {PAYOUT_FREQUENCY_LABEL[payouts.frequency].toLowerCase()}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
                <div>
                  <div className="text-xs text-muted-foreground">Déjà reçu</div>
                  <div className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums">{formatXafLabel(payouts.received)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">À recevoir (exigible)</div>
                  <div className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums text-warning-foreground">{formatXafLabel(payouts.dueNow)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Période en cours</div>
                  <div className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums">{formatXafLabel(payouts.currentPeriod)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Prochain versement</div>
                  <div className="mt-1 text-lg font-bold">{new Date(payouts.nextPayoutDate).toLocaleDateString('fr-FR')}</div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Filtres */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,1fr)_12rem_14rem]">
              <div className="relative min-w-0 @xl:col-span-2 @4xl:col-span-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} type="search" aria-label="Filtrer par chauffeur ou plaque" placeholder="Chauffeur ou plaque…" className="pl-10" />
              </div>
              <Select
                value={status || ALL}
                onValueChange={(v) => {
                  setStatus(v === ALL ? '' : (v as 'PENDING' | 'PAID_OUT'))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full" aria-label="Filtrer par statut de reversement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">À recevoir</SelectItem>
                  <SelectItem value="PAID_OUT">Déjà versées</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={preset}
                onValueChange={(v) => {
                  setPreset(v as PeriodPreset)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full" aria-label="Filtrer par période">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIOD_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preset === 'CUSTOM' ? (
              <div className="grid grid-cols-2 gap-3 @xl:max-w-md">
                <div className="grid gap-1.5">
                  <Label htmlFor="revenue-from">Du</Label>
                  <Input
                    id="revenue-from"
                    type="date"
                    value={customFrom}
                    max={customTo || undefined}
                    onChange={(e) => {
                      setCustomFrom(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="revenue-to">Au</Label>
                  <Input
                    id="revenue-to"
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    onChange={(e) => {
                      setCustomTo(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                {rangeError ? (
                  <p className="col-span-2 text-xs font-semibold text-destructive" role="alert">
                    {rangeError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="text-sm font-semibold text-muted-foreground" aria-live="polite" data-testid="revenue-count">
                {meta ? (
                  total === 0 ? (
                    'Aucune transaction'
                  ) : (
                    <>
                      Affichage de {rangeStart}-{rangeEnd} sur {total} transaction{total > 1 ? 's' : ''}
                      {filtersActive ? <span className="text-foreground"> · total {formatXafLabel(meta.totalAmount)}</span> : null}
                    </>
                  )
                ) : (
                  ' '
                )}
              </div>
              {filtersActive ? (
                <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </div>
          </div>

          {/* Liste */}
          {current?.error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{current.error}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => setReload((n) => n + 1)}>
                  <RefreshCw />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {filtersActive ? (
                <>
                  <p>Aucune somme ne correspond à ces filtres.</p>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </Button>
                </>
              ) : (
                <>
                  Vous n&apos;avez encore rien perçu.{' '}
                  <Link to="/investor-market" className="font-semibold text-primary hover:underline">
                    Découvrir le marché des parts
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <RevenueTable rows={rows} onOpen={(id) => setOpenMoto(String(id))} />
              <RevenueList rows={rows} onOpen={(id) => setOpenMoto(String(id))} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Page {page} sur {meta?.totalPages ?? 1}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Précédent
                  </Button>
                  <Button variant="outline" type="button" disabled={page >= (meta?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <InvestorMotoDetailModal motoId={openMoto} onClose={() => setOpenMoto(null)} />
    </PortalLayout>
  )
}
