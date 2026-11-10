import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { resolveIncident } from '@/services/incidentsService'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  MapPin,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Label, Pie, PieChart } from 'recharts'
import AdminLayout from '@/components/admin/AdminLayout'
import { PaymentModal, IncidentModal, InvitationModal } from '@/components/ActionModals'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import {
  deltaPctTone,
  formatDeltaPct,
  formatPeriod,
  formatShortDate,
  formatXaf,
  formatXafLabel,
  initials,
} from '@/lib/format'
import type { Alert as AlertItem, DashboardOverview, Transaction } from '@/types/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function StatCard(props: {
  title: string
  value: string
  delta: string
  deltaTone: 'positive' | 'negative' | 'neutral'
  Icon: LucideIcon
}) {
  const DeltaIcon =
    props.deltaTone === 'negative' ? TrendingDown : props.deltaTone === 'positive' ? TrendingUp : Minus
  const variant = props.deltaTone === 'positive' ? 'green' : props.deltaTone === 'negative' ? 'red' : 'secondary'

  return (
    <Card>
      <CardHeader>
        <CardDescription>{props.title}</CardDescription>
        <CardTitle className="truncate text-2xl font-extrabold tabular-nums sm:text-3xl">{props.value}</CardTitle>
        <CardAction>
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <props.Icon className="size-5" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant={variant}>
          <DeltaIcon />
          {props.delta}
        </Badge>
        <span className="text-xs text-muted-foreground">vs mois dernier</span>
      </CardContent>
    </Card>
  )
}

const fleetChartConfig = {
  actif: { label: 'Actif (en route)', color: 'var(--chart-1)' },
  panne: { label: 'En panne', color: 'var(--chart-2)' },
  vole: { label: 'Volées / perdues', color: 'var(--chart-3)' },
} satisfies ChartConfig

function EtatParcDonutCard(props: { fleetStatus: DashboardOverview['fleetStatus']; total: number }) {
  const { active, broken, stolen } = props.fleetStatus
  const total = props.total || active + broken + stolen
  const actifPct = total > 0 ? Math.round((active / total) * 100) : 0

  const data = useMemo(
    () => [
      { status: 'actif', value: active, fill: 'var(--color-actif)' },
      { status: 'panne', value: broken, fill: 'var(--color-panne)' },
      { status: 'vole', value: stolen, fill: 'var(--color-vole)' },
    ],
    [active, broken, stolen],
  )

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>État du parc</CardTitle>
        <CardDescription>Suivi en temps réel de {total} véhicules</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-5">
        <ChartContainer config={fleetChartConfig} className="mx-auto aspect-square w-full max-w-64">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={78}
              outerRadius={112}
              strokeWidth={4}
              paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0}
              startAngle={90}
              endAngle={-270}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} className="fill-foreground text-4xl font-extrabold">
                        {actifPct}%
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-sm">
                        Actif
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="w-full max-w-sm space-y-2 text-sm">
          {data.map((d) => (
            <li key={d.status} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{ backgroundColor: fleetChartConfig[d.status as keyof typeof fleetChartConfig].color }}
                />
                {fleetChartConfig[d.status as keyof typeof fleetChartConfig].label}
              </span>
              <span className="font-semibold tabular-nums">{d.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TresorerieCard(props: { treasury: DashboardOverview['treasuryWeekly'] }) {
  const pct =
    props.treasury.target > 0 ? Math.round((props.treasury.collected / props.treasury.target) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trésorerie hebdomadaire</CardTitle>
        <CardDescription>{formatPeriod(props.treasury.periodStart, props.treasury.periodEnd)}</CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start text-left sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:text-right">
          <div className="text-sm font-extrabold tabular-nums sm:text-lg">
            {formatXaf(props.treasury.collected, true)} / {formatXaf(props.treasury.target, true)} XAF
          </div>
          <div className="text-sm font-semibold text-success-foreground">{pct}% recouvré</div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={Math.min(pct, 100)} className="h-3" aria-label="Progression de la trésorerie" />
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>0 XAF</span>
          <span>Objectif : {formatXafLabel(props.treasury.target, true)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertesCard(props: { alerts: AlertItem[]; onViewIncident: (alert: AlertItem) => void }) {
  const count = props.alerts?.length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-4" />
          </span>
          Alertes critiques
        </CardTitle>
        <CardAction>
          <Badge variant="red">
            {count} priorité{count !== 1 ? 's' : ''} haute{count !== 1 ? 's' : ''}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune alerte pour le moment.</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {props.alerts.map((a) => (
              <li key={`${a.type}-${a.id}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.driverName} /> : null}
                    <AvatarFallback>{initials(a.driverName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{a.driverName}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.location}</div>
                  </div>
                </div>
                <div className="flex max-w-[50%] shrink-0 flex-col items-end gap-1">
                  <Badge
                    variant={a.type === 'PAYMENT_OVERDUE' && a.severity === 'warning' ? 'orange' : 'red'}
                    className="h-auto max-w-full whitespace-normal text-right"
                    title={a.daysLate ? `${a.daysLate} jour${a.daysLate > 1 ? 's' : ''} de retard` : undefined}
                  >
                    {a.label}
                  </Badge>
                  {a.type === 'INCIDENT' ? (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => props.onViewIncident(a)}>
                      Détails
                      <ChevronRight />
                    </Button>
                  ) : a.amount !== undefined ? (
                    <span className="text-xs font-semibold text-warning-foreground">{formatXafLabel(a.amount)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionStatusBadge(props: { tx: Transaction }) {
  if (props.tx.type === 'EXPENSE') return <Badge variant="secondary">Dépense</Badge>
  if (props.tx.status === 'VERIFIED') return <Badge variant="green">Vérifié</Badge>
  if (props.tx.status === 'REJECTED') return <Badge variant="red">Refusé</Badge>
  return <Badge variant="orange">En attente</Badge>
}

function TransactionsCard(props: { transactions: Transaction[]; onViewAll: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions récentes</CardTitle>
        <CardAction>
          <Button type="button" variant="link" size="sm" onClick={props.onViewAll}>
            Tout afficher
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {props.transactions?.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune transaction récente.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conducteur</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.transactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE'
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          {tx.driver.avatarUrl ? <AvatarImage src={tx.driver.avatarUrl} alt={tx.driver.fullName} /> : null}
                          <AvatarFallback className="text-xs">{initials(tx.driver.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{tx.driver.fullName}</div>
                          <div className="mt-1 flex items-center gap-2 sm:hidden">
                            <TransactionStatusBadge tx={tx} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatShortDate(tx.createdAt)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <TransactionStatusBadge tx={tx} />
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap text-right font-bold tabular-nums ${isExpense ? 'text-muted-foreground' : 'text-success-foreground'}`}
                    >
                      {isExpense ? '−' : '+'} {formatXaf(tx.amount)} XAF
                      <div className="text-xs font-normal text-muted-foreground sm:hidden">{formatShortDate(tx.createdAt)}</div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function IncidentDetailDialog(props: { alert: AlertItem | null; onClose: () => void; onResolved: () => void }) {
  const a = props.alert
  const navigate = useNavigate()
  const [resolving, setResolving] = useState(false)

  const resolve = async () => {
    if (!a) return
    setResolving(true)
    try {
      await resolveIncident(a.id)
      toast.success('Incident marqué comme résolu : le conducteur en est informé.')
      props.onClose()
      props.onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de clôturer cet incident.')
    } finally {
      setResolving(false)
    }
  }

  return (
    <Dialog open={a !== null} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        {a ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </span>
                Détails de l&apos;incident
              </DialogTitle>
              <DialogDescription>
                {a.createdAt ? `Signalé le ${formatShortDate(a.createdAt)}` : 'Incident signalé'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 rounded-md bg-muted p-4">
              <Avatar className="size-14">
                {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.driverName} /> : null}
                <AvatarFallback className="text-base">{initials(a.driverName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-base font-bold">{a.driverName}</div>
                <div className="text-sm text-muted-foreground">{a.location || 'Localisation inconnue'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Type</div>
                <div className="mt-1 text-sm font-bold">{a.incidentType ?? 'Incident'}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Statut</div>
                <Badge variant="red" className="mt-1">
                  {a.label}
                </Badge>
              </div>
            </div>

            {a.motoMatricule ? (
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Véhicule concerné</div>
                <div className="mt-1 text-sm font-bold">{a.motoMatricule}</div>
              </div>
            ) : null}

            {a.description ? (
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Description</div>
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">{a.description}</p>
              </div>
            ) : null}

            {a.photoUrl ? (
              <a href={a.photoUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
                <img src={a.photoUrl} alt="Photo de l'incident" className="max-h-48 w-full object-cover" />
              </a>
            ) : null}

            {a.amount !== undefined ? (
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">Montant concerné</div>
                <div className="mt-1 text-sm font-bold text-warning-foreground">{formatXafLabel(a.amount)}</div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={props.onClose}>
                Fermer
              </Button>
              <Button type="button" variant="outline" disabled={resolving} onClick={() => void resolve()}>
                <CheckCircle2 />
                {resolving ? 'Clôture…' : 'Marquer comme résolu'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  props.onClose()
                  navigate('/parc')
                }}
              >
                Voir dans le parc
                <ChevronRight />
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36 rounded-md" />
        <Skeleton className="h-36 rounded-md" />
        <Skeleton className="h-36 rounded-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-md" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    </div>
  )
}

export default function DashboardPage(props: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const navigate = useNavigate()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [invitationOpen, setInvitationOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<AlertItem | null>(null)

  const { overview, alerts, transactions, loading, error, refresh } = useAdminDashboard()

  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <AdminLayout
      title="Tableau de bord"
      description="Bon retour, Grand Patron. Voici l'activité d'aujourd'hui."
      theme={props.theme}
      onToggleTheme={props.onToggleTheme}
      actions={
        <Badge variant="outline" className="hidden h-9 px-3 text-sm sm:inline-flex">
          {todayLabel}
        </Badge>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && !overview ? (
        <DashboardSkeleton />
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Parc total"
              value={String(overview.fleet.total)}
              delta={formatDeltaPct(overview.fleet.deltaPct)}
              deltaTone={deltaPctTone(overview.fleet.deltaPct)}
              Icon={MapPin}
            />
            <StatCard
              title="Investisseurs actifs"
              value={String(overview.activeInvestors.count)}
              delta={formatDeltaPct(overview.activeInvestors.deltaPct)}
              deltaTone={deltaPctTone(overview.activeInvestors.deltaPct)}
              Icon={Users}
            />
            <StatCard
              title="Revenu mensuel"
              value={formatXafLabel(overview.monthlyRevenue.amount, true)}
              delta={formatDeltaPct(overview.monthlyRevenue.deltaPct)}
              deltaTone={deltaPctTone(overview.monthlyRevenue.deltaPct)}
              Icon={DollarSign}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EtatParcDonutCard fleetStatus={overview.fleetStatus} total={overview.fleet.total} />
            <div className="flex min-w-0 flex-col gap-4">
              <TresorerieCard treasury={overview.treasuryWeekly} />
              <AlertesCard alerts={alerts} onViewIncident={setSelectedIncident} />
            </div>
          </div>

          <section aria-labelledby="actions-rapides">
            <h2 id="actions-rapides" className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Actions rapides
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Button type="button" size="lg" onClick={() => setPaymentOpen(true)}>
                <CreditCard />
                Saisir un paiement
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setIncidentOpen(true)}>
                <AlertTriangle className="text-destructive" />
                Signaler un incident
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setInvitationOpen(true)}>
                <Users className="text-primary" />
                Ajouter un utilisateur
              </Button>
            </div>
          </section>

          <Separator />

          <TransactionsCard transactions={transactions} onViewAll={() => navigate('/paiements')} />
        </>
      ) : null}

      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={() => void refresh()} />
      <IncidentModal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} onSuccess={() => void refresh()} />
      <InvitationModal isOpen={invitationOpen} onClose={() => setInvitationOpen(false)} onSuccess={() => void refresh()} />
      <IncidentDetailDialog alert={selectedIncident} onClose={() => setSelectedIncident(null)} onResolved={() => void refresh()} />
    </AdminLayout>
  )
}
