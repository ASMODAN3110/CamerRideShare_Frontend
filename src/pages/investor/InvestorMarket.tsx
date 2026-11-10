import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin, RefreshCw, Search, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import PortalLayout from '@/components/admin/AdminLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatShortDate, formatXafLabel } from '@/lib/format'
import { VEHICLE_TYPE_LABEL, vehicleDescription } from '@/lib/vehicles'
import { expectedReturn, purchasePrice, weeklyShareOf } from '@/lib/investmentRules'
import { SHARE_REQUEST_STATUS_UI } from '@/lib/shareRequests'
import { cancelShareRequest, createShareRequest, getMarketplace, listMyShareRequests } from '../../services/investorService'
import type { MarketplaceItem, MarketplaceResponse, MarketplaceSort, ShareRequestItem } from '../../types/api'

/** Un apport en cours de contrat est rattrapé sur 32 semaines à compter de la date de l'apport. */
const CATCH_UP_SPREAD_WEEKS = 32

const SORT_LABEL: Record<MarketplaceSort, string> = {
  recent: 'Ajoutés récemment',
  available: 'Plus de capital à financer',
  progress: 'Plus avancés',
}

const DRIVER_STATE_UI: Record<MarketplaceItem['driverState'], { label: (m: MarketplaceItem) => string; variant: 'green' | 'red' | 'orange' }> = {
  UP_TO_DATE: { label: () => 'Conducteur à jour', variant: 'green' },
  LATE: { label: (m) => `Conducteur en retard · ${m.driverLateWeeks} sem.`, variant: 'red' },
  NO_DRIVER: { label: () => 'Sans conducteur', variant: 'orange' },
}

const DRIVER_STATE_WARNING: Partial<Record<MarketplaceItem['driverState'], string>> = {
  LATE: 'Le conducteur de ce véhicule a des versements en retard : vos reversements peuvent être retardés.',
  NO_DRIVER: "Ce véhicule n'a pas de conducteur : il ne génère aucun revenu tant qu'il n'est pas réaffecté.",
}

const RISK_TEXT =
  "Investissement à risque, comme tout investissement : vos revenus dépendent de l'activité du véhicule et des versements du conducteur. Les reversements peuvent être retardés, réduits ou suspendus, et le capital non récupéré est perdu si le véhicule ne peut plus tourner. Le retour de 160 % est un objectif, pas une garantie."

interface Loaded {
  key: string
  market: MarketplaceResponse | null
  mine: ShareRequestItem[]
  error: string | null
}

function MarketCard(props: { item: MarketplaceItem; rules: MarketplaceResponse['rules']; onInvest: (m: MarketplaceItem) => void; onCancel: (id: number) => void }) {
  const { item: m, rules } = props
  const fundedPct = Math.round(((m.purchasePrice - m.availableAmount) / Math.max(m.purchasePrice, 1)) * 100)
  const driver = DRIVER_STATE_UI[m.driverState]
  const min = rules.minInvestment
  return (
    <Card data-testid="market-card">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {m.matricule}
          <Badge variant="secondary" className="text-[10px]">
            {VEHICLE_TYPE_LABEL[m.vehicleType]}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="size-3 shrink-0" />
          <span className="min-w-0 truncate">
            {m.city}
            {vehicleDescription(m) ? ` · ${vehicleDescription(m)}` : ''}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">Prix d&apos;achat à financer</span>
          <span className="whitespace-nowrap font-bold tabular-nums">{formatXafLabel(m.purchasePrice)}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Capital financé</span>
            <span className="font-semibold tabular-nums">{fundedPct} %</span>
          </div>
          <Progress value={fundedPct} className="h-2" aria-label={`Capital financé de ${m.matricule}`} />
          <p className="text-xs font-semibold text-success-foreground">
            {formatXafLabel(m.maxAmount)} investissables
            {m.maxAmount < m.availableAmount ? ' (plafond du véhicule en cours de contrat)' : ''}
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 p-2.5 text-xs">
          <div className="font-semibold">Exemple : {formatXafLabel(min)} investis</div>
          <div className="mt-1 text-muted-foreground">
            Retour total {formatXafLabel(expectedReturn(min))} ({rules.returnPct} %), soit environ{' '}
            <span className="whitespace-nowrap font-semibold text-foreground">{formatXafLabel(weeklyShareOf(m.targetAmount, m.weeklyAmount, min))}</span> par semaine, sur {m.weeks} semaines de contrat.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={driver.variant} className="text-[10px]">
            {driver.label(m)}
          </Badge>
          {m.weeksElapsed > 0 ? (
            <Badge variant="secondary" className="text-[10px]">
              En service depuis {m.weeksElapsed} sem. · {m.progressPct} % remboursé
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Nouveau véhicule
            </Badge>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-1">
          {m.myParts > 0 ? (
            <Badge variant="secondary" className="max-w-full whitespace-normal">
              Vous avez {m.myParts} part{m.myParts > 1 ? 's' : ''} : {formatXafLabel(m.myInvested)}
            </Badge>
          ) : null}
          {m.pendingRequest ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="orange" className="max-w-full whitespace-normal">
                Demande en attente : {formatXafLabel(m.pendingRequest.amount)}
              </Badge>
              <Button type="button" size="sm" variant="ghost" onClick={() => props.onCancel(m.pendingRequest!.id)}>
                Annuler
              </Button>
            </div>
          ) : (
            <Button type="button" className="w-full" onClick={() => props.onInvest(m)}>
              {m.myParts > 0 ? 'Investir à nouveau' : 'Investir dans ce véhicule'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Fenêtre de demande d'apport : montant libre, aperçu du retour, reconnaissance du risque. Montée à l'ouverture seulement. */
function InvestDialog(props: { target: MarketplaceItem | null; rules: MarketplaceResponse['rules'] | null; onClose: () => void; onDone: () => void }) {
  return (
    <Dialog open={props.target !== null} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {props.target ? <InvestForm key={props.target.id} target={props.target} rules={props.rules} onClose={props.onClose} onDone={props.onDone} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function InvestForm({ target, rules, onClose, onDone }: { target: MarketplaceItem; rules: MarketplaceResponse['rules'] | null; onClose: () => void; onDone: () => void }) {
  const min = rules?.minInvestment ?? 50_000
  const [amountInput, setAmountInput] = useState(String(Math.min(min, target.maxAmount)))
  const [risk, setRisk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amount = parseInt(amountInput, 10) || 0
  const valid = amount >= min && amount <= target.maxAmount
  const returnAmount = expectedReturn(amount)
  const weekly = weeklyShareOf(target.targetAmount, target.weeklyAmount, amount)
  // apport en cours de contrat : les semaines déjà écoulées sont rattrapées, en plus des revenus habituels
  const arrears = target.weeksElapsed > 0 ? Math.min(target.weeksElapsed * weekly, returnAmount) : 0
  const sharePct = Math.round((amount / Math.max(purchasePrice(target.targetAmount), 1)) * 1000) / 10
  const warning = DRIVER_STATE_WARNING[target.driverState]

  const amountProblem = (): string | null => {
    if (amount < min) return `Investissement minimum : ${formatXafLabel(min)}`
    if (amount > target.maxAmount) {
      return target.maxAmount < target.availableAmount
        ? `Véhicule déjà en cours de contrat : ${formatXafLabel(target.maxAmount)} maximum`
        : `Seulement ${formatXafLabel(target.availableAmount)} restent à financer`
    }
    return null
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = amountProblem()
    if (problem) return setError(problem)
    if (!risk) return setError('Confirmez que vous avez compris le risque de cet investissement.')
    setSubmitting(true)
    setError(null)
    try {
      await createShareRequest({ motoId: target.id, amount })
      toast.success('Demande envoyée : un administrateur doit la valider')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Investir dans ce véhicule</DialogTitle>
        <DialogDescription>
          {VEHICLE_TYPE_LABEL[target.vehicleType]} {target.matricule} — {target.city}
        </DialogDescription>
      </DialogHeader>

      {warning ? (
        <Alert className="border-warning/60 bg-warning/10" data-testid="invest-warning">
          <AlertTriangle />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="request-amount">Montant de votre apport (XAF)</Label>
        <Input id="request-amount" type="number" inputMode="numeric" min={min} max={target.maxAmount} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setAmountInput(String(Math.min(min, target.maxAmount)))}>
            Minimum
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAmountInput(String(target.maxAmount))}>
            Maximum
          </Button>
          <span className="text-xs text-muted-foreground">
            de {formatXafLabel(min)} à {formatXafLabel(target.maxAmount)}
          </span>
        </div>
        {amountInput !== '' && amountProblem() ? (
          <p className="text-xs font-semibold text-destructive" role="alert" data-testid="amount-problem">
            {amountProblem()}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm" data-testid="invest-summary">
        {target.weeksElapsed > 0 ? (
          <p className="text-xs text-warning-foreground">
            Ce véhicule est déjà en service depuis {target.weeksElapsed} semaine(s). Votre apport est plafonné pour que votre retour reste sous 50 % de ce qu&apos;il doit encore produire.
          </p>
        ) : null}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Montant à investir</span>
          <span className="whitespace-nowrap text-lg font-extrabold tabular-nums">{formatXafLabel(amount)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Part du prix d&apos;achat</span>
          <span className="font-semibold tabular-nums">{sharePct} %</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Retour total ({rules?.returnPct ?? 160} %)</span>
          <span className="whitespace-nowrap font-semibold tabular-nums text-success-foreground">{formatXafLabel(returnAmount)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Versé chaque semaine</span>
          <span className="whitespace-nowrap font-semibold tabular-nums">{formatXafLabel(weekly)}</span>
        </div>
        {arrears > 0 ? (
          <div className="flex items-baseline justify-between gap-3 text-xs" data-testid="invest-catchup">
            <span className="text-muted-foreground">Rattrapage des semaines passées</span>
            <span className="text-right font-semibold tabular-nums">
              {formatXafLabel(arrears)}, soit {formatXafLabel(Math.ceil(arrears / CATCH_UP_SPREAD_WEEKS))} / sem. pendant {CATCH_UP_SPREAD_WEEKS} sem.
            </span>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Vous pouvez investir plusieurs fois dans le même véhicule : chaque apport est une part distincte, avec son propre contrat. Un administrateur valide chaque demande.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-xs" data-testid="invest-risk">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" checked={risk} onChange={(e) => setRisk(e.target.checked)} />
        <span>{RISK_TEXT}</span>
      </label>

      {error ? (
        <p className="text-xs font-semibold text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting || !valid || !risk}>
          {submitting ? 'Envoi…' : 'Envoyer la demande'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function InvestorMarket() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [zone, setZone] = useState('')
  const [sort, setSort] = useState<MarketplaceSort>('recent')
  const [reload, setReload] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  // les zones restent affichées pendant qu'un filtre se recharge
  const [lastMarket, setLastMarket] = useState<MarketplaceResponse | null>(null)
  const requestKey = `${debouncedSearch}|${zone}|${sort}|${reload}`

  const [target, setTarget] = useState<MarketplaceItem | null>(null)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    Promise.all([getMarketplace({ search: debouncedSearch || undefined, zone: zone || undefined, sort: sort === 'recent' ? undefined : sort }), listMyShareRequests()])
      .then(([market, mine]) => {
        if (cancelled) return
        setLoaded({ key: requestKey, market, mine, error: null })
        setLastMarket(market)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key: requestKey, market: null, mine: [], error: err instanceof Error ? err.message : 'Impossible de charger le marché des parts.' })
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, zone, sort, requestKey])

  const current = loaded && loaded.key === requestKey ? loaded : null
  const loading = current === null
  const items = current?.market?.items ?? []
  const mine = current?.mine ?? []
  const rules = (current?.market ?? lastMarket)?.rules ?? null
  const zones = (current?.market ?? lastMarket)?.zones ?? []
  const filtered = debouncedSearch !== '' || zone !== ''
  const pendingCount = mine.filter((r) => r.status === 'PENDING').length

  const confirmCancel = async () => {
    if (cancelId === null) return
    setCancelling(true)
    try {
      await cancelShareRequest(cancelId)
      toast.success('Demande annulée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Annulation impossible')
    }
    setCancelling(false)
    setCancelId(null)
    setReload((n) => n + 1)
  }

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setZone('')
    setSort('recent')
  }

  return (
    <PortalLayout portal="investor" title="Marché des parts" hideHeading>
      <div className="@container/page space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marché des parts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investissez dans un véhicule à partir de {formatXafLabel(rules?.minInvestment ?? 50_000)} : chaque apport est une part à part entière. Un administrateur valide chaque demande.
          </p>
        </div>

        <Alert data-testid="risk-banner">
          <ShieldAlert />
          <AlertDescription>{RISK_TEXT}</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center">
          <div className="relative min-w-0 @xl:max-w-sm @xl:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Plaque, marque, modèle…"
              aria-label="Rechercher un véhicule"
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as MarketplaceSort)}>
            <SelectTrigger className="w-full @xl:w-60" aria-label="Trier les véhicules">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as MarketplaceSort[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SORT_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par zone">
          <Button type="button" size="sm" variant={zone === '' ? 'default' : 'outline'} aria-pressed={zone === ''} onClick={() => setZone('')}>
            Toutes les zones
          </Button>
          {zones.map((z) => (
            <Button key={z} type="button" size="sm" variant={zone === z ? 'default' : 'outline'} aria-pressed={zone === z} onClick={() => setZone(z)}>
              {z}
            </Button>
          ))}
        </div>

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
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {filtered ? (
              <>
                <p>Aucun véhicule à financer ne correspond à ces filtres.</p>
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </>
            ) : (
              <p>Aucun véhicule n&apos;a de capital à financer pour le moment. Revenez bientôt.</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {items.length} véhicule{items.length > 1 ? 's' : ''} à financer
            </p>
            <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
              {items.map((m) => (
                <MarketCard key={m.id} item={m} rules={rules ?? { returnPct: 160, minInvestment: 50_000 }} onInvest={setTarget} onCancel={setCancelId} />
              ))}
            </div>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mes demandes</CardTitle>
            <CardDescription>
              Suivi de vos demandes de parts{pendingCount > 0 ? ` · ${pendingCount} en attente de validation` : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vous n&apos;avez fait aucune demande.</p>
            ) : (
              <ul className="divide-y" aria-label="Mes demandes de parts">
                {mine.map((r) => {
                  const ui = SHARE_REQUEST_STATUS_UI[r.status]
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {r.moto.matricule} · apport de {formatXafLabel(r.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatShortDate(r.createdAt)}
                          {r.note ? ` — ${r.note}` : ''}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={ui.variant}>{ui.label}</Badge>
                        {r.status === 'APPROVED' ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/investor-fleet">Voir dans Mon parc</Link>
                          </Button>
                        ) : null}
                        {r.status === 'PENDING' ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => setCancelId(r.id)}>
                            Annuler
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <InvestDialog
        target={target}
        rules={rules}
        onClose={() => setTarget(null)}
        onDone={() => {
          setTarget(null)
          setReload((n) => n + 1)
        }}
      />

      <AlertDialog open={cancelId !== null} onOpenChange={(open) => (!open ? setCancelId(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>Votre demande de part ne sera pas traitée par l&apos;administrateur. Vous pourrez en faire une nouvelle.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Conserver</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault()
                void confirmCancel()
              }}
            >
              {cancelling ? 'Annulation…' : 'Annuler la demande'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  )
}
