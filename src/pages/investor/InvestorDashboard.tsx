import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Banknote, ChevronRight, PiggyBank, RefreshCw, TrendingUp, Wallet } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { useAuth } from '../../auth/useAuth'
import InvestorMotoDetailModal from '../../components/InvestorMotoDetailModal'
import StatementDownload from '../../components/StatementDownload'
import PortalLayout from '../../components/admin/AdminLayout'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../../components/ui/chart'
import { Progress } from '../../components/ui/progress'
import { Skeleton } from '../../components/ui/skeleton'
import { formatXafLabel } from '../../lib/format'
import { PAYOUT_FREQUENCY_LABEL } from '../../lib/payouts'
import { VEHICLE_TYPE_LABEL } from '../../lib/vehicles'
import { getInvestorDashboard, getInvestorFleet, getPayoutSummary } from '../../services/investorService'
import type { DashboardAttention, DashboardAttentionKind, DashboardWeeks, InvestorDashboardResponse, InvestorFleetItem, InvestorPayoutSummary } from '../../types/api'

/** Courbe des sommes perçues : composant graphique shadcn, couleur issue de la configuration. */
const cumulChartConfig = { cumul: { label: 'Cumul perçu', color: 'var(--chart-1)' } } satisfies ChartConfig

const PERIODS: Array<{ weeks: DashboardWeeks; label: string; description: string }> = [
  { weeks: 4, label: '1 mois', description: 'les 4 dernières semaines' },
  { weeks: 12, label: '3 mois', description: 'les 12 dernières semaines' },
  { weeks: 26, label: '6 mois', description: 'les 26 dernières semaines' },
  { weeks: 52, label: '1 an', description: 'les 52 dernières semaines' },
]

const ATTENTION: Record<DashboardAttentionKind, { label: string; variant: 'red' | 'orange'; text: (a: DashboardAttention) => string }> = {
  UNAVAILABLE: { label: 'Indisponible', variant: 'red', text: () => 'Véhicule volé ou perdu : il ne génère plus de revenus.' },
  BROKEN: { label: 'En panne', variant: 'orange', text: () => 'Véhicule immobilisé : vos reversements peuvent être retardés.' },
  LATE: {
    label: 'Retard',
    variant: 'red',
    text: (a) => `${a.lateWeeks} semaine${a.lateWeeks > 1 ? 's' : ''} de retard : ${formatXafLabel(a.lateAmount)} restent à verser par le conducteur.`,
  },
  NO_DRIVER: { label: 'Sans conducteur', variant: 'orange', text: () => "Aucun revenu tant qu'un conducteur n'est pas affecté." },
}

/** Montant signé : le solde net est négatif tant que le capital n'est pas récupéré. */
const signedXaf = (amount: number) => `${amount < 0 ? '−' : ''}${formatXafLabel(amount)}`
const signedPct = (pct: number) => `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toLocaleString('fr-FR')}%`

function StatCard(props: {
  className?: string
  /** Page détaillée ouverte au clic. */
  to: string
  linkLabel: string
  title: string
  value: string
  subLabel: string
  deltaLabel?: string
  deltaTone?: 'positive' | 'negative'
  note?: string
  Icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  return (
    <Link
      to={props.to}
      aria-label={`${props.title} : ${props.linkLabel}`}
      className={['group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', props.className].filter(Boolean).join(' ')}
    >
    <Card className="h-full transition-shadow group-hover:shadow-md">
      <CardHeader>
        <CardDescription>{props.title}</CardDescription>
        <CardTitle className="whitespace-nowrap text-2xl font-extrabold tabular-nums">{props.value}</CardTitle>
        <CardAction>
          <div className={['flex size-10 items-center justify-center rounded-md', props.iconBg, props.iconColor].join(' ')}>
            <props.Icon className="size-5" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm font-semibold text-muted-foreground">
        {props.subLabel}
        {props.deltaLabel ? (
          <span className={['ml-2', props.deltaTone === 'negative' ? 'text-destructive' : 'text-primary'].join(' ')}>{props.deltaLabel}</span>
        ) : null}
        {props.note ? <div className="mt-1 text-xs font-medium text-destructive">{props.note}</div> : null}
        <div className="mt-2 flex w-fit items-center gap-1 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100">
          {props.linkLabel}
          <ChevronRight className="size-3.5" />
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}

/** Prochain reversement : ce que l'administrateur doit reverser maintenant et à quelle date tombe le suivant. */
function PayoutStrip({ payout }: { payout: InvestorPayoutSummary }) {
  const next = new Date(payout.nextPayoutDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <Card data-testid="payout-strip">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Banknote className="size-5" />
        </div>
        <div className="min-w-[12rem] flex-1">
          <div className="text-sm font-semibold text-foreground">Reversement {PAYOUT_FREQUENCY_LABEL[payout.frequency].toLowerCase()}</div>
          <div className="text-xs text-muted-foreground">
            Prochain reversement le <span data-testid="next-payout" className="font-semibold text-foreground">{next}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">À reverser maintenant</div>
          <div data-testid="payout-due" className={['text-lg font-extrabold tabular-nums', payout.dueNow > 0 ? 'text-primary' : 'text-foreground'].join(' ')}>
            {formatXafLabel(payout.dueNow)}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/investor-revenues">Historique des revenus</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/** Véhicules qui ne produisent pas normalement : un clic ouvre leur fiche. */
const ATTENTION_VISIBLE = 3

function AttentionCard({ items, onOpen }: { items: DashboardAttention[]; onOpen: (motoId: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, ATTENTION_VISIBLE)
  const hidden = items.length - ATTENTION_VISIBLE
  return (
    <Card className="border-warning/40" data-testid="attention">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-warning-foreground" />
          À surveiller
          <Badge variant="orange">{items.length}</Badge>
        </CardTitle>
        <CardDescription>Ces véhicules peuvent retarder vos reversements.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {shown.map((a) => (
            <li key={a.motoId} className="grid gap-2 py-3 first:pt-0 last:pb-0 @xl:grid-cols-[auto_minmax(0,1fr)_auto] @xl:items-center @xl:gap-x-3" data-testid="attention-item">
              <Badge variant={ATTENTION[a.kind].variant} className="justify-self-start">
                {ATTENTION[a.kind].label}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{a.plate}</div>
                <div className="text-xs text-muted-foreground">{ATTENTION[a.kind].text(a)}</div>
              </div>
              <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => onOpen(a.motoId)} aria-label={`Détails ${a.plate}`}>
                Détails
              </Button>
            </li>
          ))}
        </ul>
        {hidden > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Réduire la liste' : `Voir les ${hidden} autre${hidden > 1 ? 's' : ''}`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function FlotteMotoCard({ moto, attention, onOpen, className }: { moto: InvestorFleetItem; attention?: DashboardAttention; onOpen: () => void; className?: string }) {
  const progressPct = moto.semaineTotal > 0 ? Math.min(Math.round((moto.semaineAcquise / moto.semaineTotal) * 100), 100) : 0
  const assigned = moto.chauffeur !== 'Non assigné'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ouvrir la fiche ${moto.plaque}`}
      data-testid="dashboard-vehicle"
      className={['group block w-full rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', className].filter(Boolean).join(' ')}
    >
    <Card className="h-full transition-shadow group-hover:shadow-md">
      <CardHeader>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {moto.avatarUrl ? <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} className="h-full w-full object-cover" /> : null}
              <AvatarFallback>{moto.avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{assigned ? moto.chauffeur : 'Sans conducteur'}</div>
              <div className="truncate text-xs text-muted-foreground">{moto.plaque}</div>
            </div>
          </div>
          <Badge variant={moto.status === 'actif' ? 'green' : 'orange'} className="shrink-0">
            {VEHICLE_TYPE_LABEL[moto.vehicleType]}
            {moto.status === 'actif' ? '' : moto.status === 'panne' ? ' · en panne' : ' · indisponible'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-muted-foreground">{`Semaine ${moto.semaineAcquise} / ${moto.semaineTotal}`}</div>
            <div className="text-xs font-semibold text-muted-foreground">{progressPct}%</div>
          </div>
          <Progress value={progressPct} className="h-2" aria-label={`Progression ${moto.plaque}`} />

          <div className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calendrier de remboursement</div>
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs font-semibold text-muted-foreground">CE MOIS</div>
            <div className="whitespace-nowrap text-sm font-bold text-foreground">{formatXafLabel(moto.revenuMois)}</div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs font-semibold text-muted-foreground">PAR SEMAINE (ATTENDU)</div>
            <div className="whitespace-nowrap text-sm font-bold text-foreground">{formatXafLabel(moto.parSemaine)}</div>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            {attention ? (
              <Badge variant={ATTENTION[attention.kind].variant}>
                {attention.kind === 'LATE' ? `${attention.lateWeeks} sem. de retard` : ATTENTION[attention.kind].label}
              </Badge>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Détails <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
    </button>
  )
}

/** Colonnes de la grille du portefeuille : autant que de cartes (3 au plus), pour ne jamais laisser une case vide. */
const fleetColumns = (count: number) => (count >= 3 ? '@xl:grid-cols-2 @3xl:grid-cols-3' : count === 2 ? '@xl:grid-cols-2' : '')
/** La 3e carte occupe toute la largeur quand la grille n'a que deux colonnes : pas de case vide à côté d'elle. */
const fleetCardSpan = (index: number, count: number) => (count === 3 && index === 2 ? '@xl:col-span-2 @3xl:col-span-1' : '')

const shortDay = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

interface Base {
  key: number
  fleet: InvestorFleetItem[]
  payout: InvestorPayoutSummary | null
  error: string | null
}

export default function InvestorDashboard() {
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

  // « Réessayer » relance tous les chargements
  const [reloadKey, setReloadKey] = useState(0)
  const [weeks, setWeeks] = useState<DashboardWeeks>(12)
  const [openId, setOpenId] = useState<string | null>(null)

  // véhicules et reversements : null tant qu'ils se chargent ; le reversement est secondaire (absent s'il échoue)
  const [baseRaw, setBase] = useState<Base | null>(null)
  const base = baseRaw !== null && baseRaw.key === reloadKey ? baseRaw : null
  useEffect(() => {
    let cancelled = false
    Promise.all([getInvestorFleet({ group: 'all' }), getPayoutSummary().catch(() => null)])
      .then(([fleet, payout]) => {
        if (!cancelled) setBase({ key: reloadKey, fleet: fleet.overview, payout, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setBase({ key: reloadKey, fleet: [], payout: null, error: err instanceof Error ? err.message : 'Impossible de charger le tableau de bord.' })
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // synthèse et courbe : la courbe dépend de la période, choisie et appliquée par le serveur
  const [dash, setDash] = useState<{ key: number; weeks: DashboardWeeks; data: InvestorDashboardResponse | null; error: string | null } | null>(null)
  useEffect(() => {
    let cancelled = false
    getInvestorDashboard({ weeks })
      .then((data) => {
        if (!cancelled) setDash({ key: reloadKey, weeks, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setDash({ key: reloadKey, weeks, data: null, error: err instanceof Error ? err.message : 'Impossible de charger le tableau de bord.' })
      })
    return () => {
      cancelled = true
    }
  }, [weeks, reloadKey])

  const dashCur = dash !== null && dash.key === reloadKey ? dash : null
  const error = base?.error ?? dashCur?.error ?? null
  // la synthèse reste affichée pendant le rechargement de la courbe ; seule la courbe se met en attente
  const data = dashCur?.data ?? null
  const summary = data?.summary
  const chartLoading = dashCur === null || dashCur.weeks !== weeks
  const loading = base === null || (dashCur === null && !error)
  const chart = useMemo(
    () =>
      (data?.weekly ?? []).map((w) => ({
        semaine: shortDay(w.weekStart),
        cumul: w.cumulative,
        amount: w.amount,
      })),
    [data],
  )
  const attention = useMemo(() => data?.attention ?? [], [data])
  const attentionByMoto = useMemo(() => new Map(attention.map((a) => [String(a.motoId), a])), [attention])
  const period = PERIODS.find((p) => p.weeks === weeks) ?? PERIODS[1]

  const { user } = useAuth()
  // prénom de l'investisseur connecté (« Jean-Pierre Nkoulou » → « Jean-Pierre »)
  const firstName = user?.fullName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Bon retour, ${firstName}` : 'Bon retour'

  return (
    <PortalLayout portal="investor" title="Tableau de bord" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
      <div className="flex-1 p-4 sm:p-6">
        <div className="@container space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-start @2xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Voici l&apos;état actuel de votre parc de véhicules aujourd&apos;hui.</p>
            </div>
            <div className="@2xl:shrink-0 @2xl:pt-1">
              <StatementDownload />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{error}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                  <RefreshCw />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : summary ? (
              <>
                <StatCard
                  to="/investor-fleet"
                  linkLabel="Voir mon parc"
                  title="TOTAL INVESTI"
                  value={formatXafLabel(summary.invested)}
                  subLabel={`Capital initial · ${summary.partsCount} part${summary.partsCount > 1 ? 's' : ''} · ${summary.motosCount} véhicule${summary.motosCount > 1 ? 's' : ''}`}
                  Icon={Wallet}
                  iconBg="bg-primary/10"
                  iconColor="text-primary"
                />
                <StatCard
                  to="/investor-revenues"
                  linkLabel="Voir l’historique des revenus"
                  title="TOTAL RÉCUPÉRÉ"
                  value={formatXafLabel(summary.received)}
                  subLabel="Montant perçu"
                  deltaLabel={summary.expected > 0 ? `${summary.recoveryPct}% du retour attendu` : undefined}
                  Icon={PiggyBank}
                  iconBg="bg-primary/10"
                  iconColor="text-success-foreground"
                />
                <StatCard
                  className="@xl:col-span-2 @3xl:col-span-1"
                  to="/investor-reports"
                  linkLabel="Voir les rapports"
                                    title="SOLDE NET"
                  value={signedXaf(summary.net)}
                  subLabel="ROI global"
                  deltaLabel={summary.invested > 0 ? signedPct(summary.roiPct) : undefined}
                  deltaTone={summary.net < 0 ? 'negative' : 'positive'}
                  note={summary.loss > 0 ? `dont perte constatée : ${formatXafLabel(summary.loss)}` : undefined}
                  Icon={TrendingUp}
                  iconBg="bg-muted"
                  iconColor="text-foreground"
                />
              </>
            ) : null}
          </div>

          {base?.payout && (summary?.partsCount ?? 0) > 0 ? <PayoutStrip payout={base.payout} /> : null}

          {attention.length > 0 ? <AttentionCard items={attention} onOpen={(id) => setOpenId(String(id))} /> : null}

          {/* Courbe des sommes perçues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance des Revenus Hebdomadaires</CardTitle>
              <div className="col-start-1 mt-1 text-sm text-muted-foreground">Sommes perçues cumulées sur {period.description}</div>
              <CardAction className="col-start-1 row-span-1 row-start-3 mt-2 justify-self-start @xl:col-start-2 @xl:row-span-2 @xl:row-start-1 @xl:mt-0 @xl:justify-self-end">
                <div role="group" aria-label="Période de la courbe" className="flex flex-wrap gap-1">
                  {PERIODS.map((p) => (
                    <Button
                      key={p.weeks}
                      type="button"
                      size="sm"
                      variant={p.weeks === weeks ? 'default' : 'outline'}
                      aria-pressed={p.weeks === weeks}
                      onClick={() => setWeeks(p.weeks)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                {chartLoading && !error ? (
                  <Skeleton className="h-full w-full" />
                ) : chart.length > 0 && (summary?.received ?? 0) > 0 ? (
                  <ChartContainer config={cumulChartConfig} className="aspect-auto h-full w-full" data-testid="revenue-chart">
                    <LineChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis dataKey="semaine" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) => `Semaine du ${label}`}
                            formatter={(value, _name, item) => (
                              <div className="grid w-full gap-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: 'var(--color-cumul)' }} />
                                    Cumul perçu
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">{formatXafLabel(Number(value))}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 pl-[18px] text-muted-foreground">
                                  <span>Cette semaine</span>
                                  <span className="font-mono tabular-nums">{formatXafLabel((item.payload as { amount: number }).amount)}</span>
                                </div>
                              </div>
                            )}
                          />
                        }
                      />
                      <Line dataKey="cumul" type="monotone" stroke="var(--color-cumul)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    Aucune somme perçue pour le moment.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio */}
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div className="text-lg font-semibold text-foreground">Votre Portefeuille de Flotte</div>
            <Button asChild variant="link" className="text-xs font-semibold">
              <Link to="/investor-fleet">Voir Tout →</Link>
            </Button>
          </div>

          <div className={['grid grid-cols-1 gap-4', fleetColumns(base?.fleet.length ?? 3)].join(' ')}>
            {base === null ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-52 w-full" />)
            ) : base.fleet.length > 0 ? (
              base.fleet.map((m, i) => <FlotteMotoCard key={m.id} moto={m} className={fleetCardSpan(i, base.fleet.length)} attention={attentionByMoto.get(m.id)} onOpen={() => setOpenId(m.id)} />)
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Vous n&apos;avez pas encore de part dans un véhicule.{' '}
                <Link to="/investor-market" className="font-semibold text-primary hover:underline">
                  Découvrir le marché des parts
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <InvestorMotoDetailModal motoId={openId} onClose={() => setOpenId(null)} />
    </PortalLayout>
  )
}
