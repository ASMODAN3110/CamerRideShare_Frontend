import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CircleDot,
  CreditCard,
  Gauge,
  MapPin,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart as RechartsLineChart,
  Line,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import { ParticleHover, SpotlightSection } from '../components/MagicBento'
import { PaymentModal, IncidentModal, InvitationModal } from '../components/ActionModals'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import {
  deltaPctTone,
  formatDeltaPct,
  formatPeriod,
  formatShortDate,
  formatXaf,
  formatXafLabel,
  initials,
} from '../lib/format'
import type { Alert, DashboardOverview, Transaction } from '../types/api'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

type Role = 'patron' | 'investisseur' | 'conducteur'

function TopStatCard(props: {
  title: string
  value: string
  delta: string
  deltaTone: 'positive' | 'negative' | 'neutral'
  Icon: LucideIcon
}) {
  const tone = props.deltaTone
  const deltaCls =
    tone === 'positive'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
      : tone === 'negative'
        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  const DeltaIcon = tone === 'negative' ? TrendingDown : TrendingUp

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">{props.title}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{props.value}</div>
          <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${deltaCls}`}>
            <DeltaIcon className="mr-1 h-3 w-3" />
            {props.delta}
          </div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200">
          <props.Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function Tabs(props: { role: Role; onChange: (r: Role) => void }) {
  const tabs: Array<{ id: Role; label: string; icon: LucideIcon }> = [
    { id: 'patron', label: 'Grand Patron', icon: CircleDot },
    { id: 'investisseur', label: 'Investisseur', icon: CreditCard },
    { id: 'conducteur', label: 'Conducteur', icon: Gauge },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const Icon = t.icon
        const active = t.id === props.role
        return (
          <Button
            key={t.id}
            type="button"
            onClick={() => props.onChange(t.id)}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
              active
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Button>
        )
      })}
    </div>
  )
}

function EtatParcDonutCard(props: { fleetStatus: DashboardOverview['fleetStatus']; total: number }) {
  const parc = {
    actif: props.fleetStatus.active,
    vole: props.fleetStatus.stolen,
    panne: props.fleetStatus.broken,
  }
  const total = props.total || parc.actif + parc.vole + parc.panne
  const actifPct = total > 0 ? Math.round((parc.actif / total) * 100) : 0

  const data = useMemo(
    () => [
      { name: 'Actif (En route)', value: parc.actif, color: '#2563eb' },
      { name: 'Volées / Perdues', value: parc.vole, color: '#ef4444' },
      { name: 'En panne', value: parc.panne, color: '#f97316' },
    ],
    [parc.actif, parc.panne, parc.vole],
  )

  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base">État du Parc</CardTitle>
        <div className="mt-1 text-sm font-medium text-slate-500">Suivi en temps réel de {total} motos</div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col items-center gap-4">
          <div className="h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={() => null} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={92}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                  <Label
                    position="center"
                    content={() => (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-slate-50">
                        <tspan fontSize="20" fontWeight="800">
                          {actifPct}% Actif
                        </tspan>
                      </text>
                    )}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-1 text-sm">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="truncate text-slate-700 dark:text-slate-200">{d.name}</span>
                </div>
                <span className="flex-none font-semibold text-slate-900 dark:text-slate-50">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function TresorerieCard(props: { treasury: DashboardOverview['treasuryWeekly'] }) {
  const pct =
    props.treasury.target > 0
      ? Math.round((props.treasury.collected / props.treasury.target) * 100)
      : 0

  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Trésorerie Hebdomadaire</CardTitle>
            <div className="mt-1 text-sm font-medium text-slate-500">
              {formatPeriod(props.treasury.periodStart, props.treasury.periodEnd)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {formatXaf(props.treasury.collected, true)} / {formatXaf(props.treasury.target, true)} XAF
            </div>
            <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">{pct}% Recouvré</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <Progress value={pct} className="h-4" aria-label="Progress trésorerie" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>0 XAF</span>
            <span className="text-slate-600 dark:text-slate-300">
              Objectif: {formatXafLabel(props.treasury.target, true)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertesCard(props: { alerts: Alert[] }) {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">Alertes Critiques</CardTitle>
            </div>
          </div>
          <Badge variant="red" className="px-3 py-1 text-xs">
            {props.alerts.length} Priorité{props.alerts.length !== 1 ? 's' : ''} Haute{props.alerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {props.alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Aucune alerte pour le moment.</p>
        ) : (
          <div className="divide-y divide-slate-200/60">
            {props.alerts.map((a) => (
              <div key={`${a.type}-${a.id}`} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {a.avatarUrl ? (
                      <AvatarImage src={a.avatarUrl} alt={a.driverName} className="h-full w-full rounded-full object-cover" />
                    ) : null}
                    <AvatarFallback>{initials(a.driverName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{a.driverName}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{a.location}</div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                    {a.label}
                  </div>
                  <div className="mt-1 text-xs font-semibold">
                    {a.type === 'INCIDENT' ? (
                      <Button type="button" className="text-blue-600 hover:underline dark:text-blue-300">
                        Voir détails
                      </Button>
                    ) : a.amount !== undefined ? (
                      <span className="text-red-600 dark:text-red-300">{formatXafLabel(a.amount)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionStatusBadge(props: { tx: Transaction }) {
  if (props.tx.type === 'EXPENSE') {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-200">
        Dépense
      </span>
    )
  }
  if (props.tx.status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
        Vérifié
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />
      En attente
    </span>
  )
}

function GrandPatronDashboard(props: {
  overview: DashboardOverview
  alerts: Alert[]
  transactions: Transaction[]
  onOpenPayment: () => void
  onOpenIncident: () => void
  onOpenInvitation: () => void
  onViewAllPayments: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <EtatParcDonutCard fleetStatus={props.overview.fleetStatus} total={props.overview.fleet.total} />
        </div>
        <div className="flex flex-col gap-4">
          <TresorerieCard treasury={props.overview.treasuryWeekly} />
          <AlertesCard alerts={props.alerts} />
        </div>
      </div>

      <div className="pt-1">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Actions Rapides</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            type="button"
            onClick={props.onOpenPayment}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <CreditCard className="h-4 w-4" />
            Saisir Paiement
          </Button>
          <Button
            type="button"
            onClick={props.onOpenIncident}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Signaler Incident
          </Button>
          <Button
            type="button"
            onClick={props.onOpenInvitation}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <Users className="h-4 w-4 text-emerald-600" />
            Inviter Investisseur
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Transactions Récentes</div>
          <Button
            type="button"
            onClick={props.onViewAllPayments}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Tout afficher
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          {props.transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Aucune transaction récente.</p>
          ) : (
            <Table className="min-w-full text-xs">
              <TableHeader className="bg-white dark:bg-slate-900/40">
                <TableRow className="text-left text-slate-500 dark:text-slate-400">
                  <TableHead className="px-5 py-3 font-semibold">CHAUFFEUR</TableHead>
                  <TableHead className="px-5 py-3 font-semibold">DATE</TableHead>
                  <TableHead className="px-5 py-3 font-semibold">STATUT</TableHead>
                  <TableHead className="px-5 py-3 text-right font-semibold">MONTANT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.transactions.map((tx) => {
                  const isExpense = tx.type === 'EXPENSE'
                  const sign = isExpense ? '-' : '+'
                  const amountCls = isExpense
                    ? 'text-red-600 dark:text-red-300'
                    : 'text-emerald-600 dark:text-emerald-300'
                  return (
                    <TableRow key={tx.id} className="border-t border-slate-200 dark:border-slate-800">
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {tx.driver.avatarUrl ? (
                              <AvatarImage
                                src={tx.driver.avatarUrl}
                                alt={tx.driver.fullName}
                                className="h-8 w-8 object-cover"
                              />
                            ) : null}
                            <AvatarFallback>{initials(tx.driver.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {tx.driver.fullName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {formatShortDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <TransactionStatusBadge tx={tx} />
                      </TableCell>
                      <TableCell className={`px-5 py-3 text-right font-semibold ${amountCls}`}>
                        {sign} {formatXaf(tx.amount)} XAF
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}

function InvestorDashboard() {
  const kpi = { invested: '12.5M XAF', recovered: '10.5M XAF', pct: 83 }
  const roiData = [
    { name: 'S1', roi: 4 },
    { name: 'S2', roi: 7 },
    { name: 'S3', roi: 6 },
    { name: 'S4', roi: 10 },
    { name: 'S5', roi: 13 },
    { name: 'S6', roi: 14 },
  ]
  const motos = [
    { id: 'M1', model: 'Mototaxi 125cc', city: 'Douala', progress: 72 },
    { id: 'M2', model: 'Mototaxi 150cc', city: 'Yaounde', progress: 46 },
    { id: 'M3', model: 'Mototaxi 200cc', city: 'Bafoussam', progress: 88 },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base">Portfolio</CardTitle>
          <div className="mt-2 flex items-center justify-between gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500">Montant Investi</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{kpi.invested}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">Montant Récupéré</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{kpi.recovered}</div>
              <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">{kpi.pct}%</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base">Evolution du ROI</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={roiData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={() => null} />
                <Legend />
                <Line type="monotone" dataKey="roi" name="ROI" stroke="#2563eb" strokeWidth={3} dot={false} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {motos.map((m) => (
          <Card key={m.id}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base">{m.model}</CardTitle>
              <div className="mt-1 text-xs font-medium text-slate-500">{m.city}</div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Progress value={m.progress} className="h-3" />
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Financement</span>
                  <span>{m.progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ConducteurDashboard() {
  const ownershipPct = 64
  const status = ownershipPct >= 70 ? 'vert' : ownershipPct >= 40 ? 'orange' : 'rouge'
  const badgeClasses =
    status === 'vert'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
      : status === 'orange'
        ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200'
        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'

  const gaugeData = [
    { name: 'Acquis', value: ownershipPct, color: '#16a34a' },
    { name: 'Reste', value: 100 - ownershipPct, color: '#e2e8f0' },
  ]

  const payments = [
    { id: 'p3', label: 'Paiement #3', amount: '12,500 XAF', date: '24 Oct' },
    { id: 'p2', label: 'Paiement #2', amount: '10,000 XAF', date: '18 Oct' },
    { id: 'p1', label: 'Paiement #1', amount: '8,500 XAF', date: '10 Oct' },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Progression de propriete</CardTitle>
              <div className="mt-1 text-sm font-medium text-slate-500">Reste a payer ci-dessous</div>
            </div>
            <div className={['inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', badgeClasses].join(' ')}>
              Feu Tricolore
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col items-center gap-5 lg:flex-row lg:justify-between">
            <div className="relative h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={() => null} />
                  <Pie data={gaugeData} dataKey="value" startAngle={90} endAngle={-270} innerRadius={70} outerRadius={95} stroke="none">
                    {gaugeData.map((d, idx) => (
                      <Cell key={d.name} fill={idx === 0 ? d.color : '#e2e8f0'} />
                    ))}
                    <Label
                      position="center"
                      content={() => (
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-slate-50">
                          <tspan fontSize="22" fontWeight="900">
                            {ownershipPct}%
                          </tspan>
                          <tspan fontSize="12" fontWeight="600" dy="18">
                            acquis
                          </tspan>
                        </text>
                      )}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                <div className="text-xs font-medium text-slate-500">Reste a payer</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">3,60M XAF</div>
                <div className="mt-2 text-sm font-medium text-slate-500">Objectif: 5,00M XAF</div>
              </div>

              <div className="mt-4 divide-y divide-slate-200/60 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/30">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{p.label}</div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">{p.date}</div>
                    </div>
                    <div className="flex-none text-sm font-bold text-slate-900 dark:text-slate-50">{p.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage(props: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState<Role>('patron')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [invitationOpen, setInvitationOpen] = useState(false)

  const { overview, alerts, transactions, loading, error, refresh } = useAdminDashboard()

  const todayLabel = (() => {
    const d = new Date()
    const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
    const month = d.toLocaleDateString('en-GB', { month: 'short' })
    const year = d.getFullYear()
    return `${day} ${month}, ${year}`
  })()

  return (
    <SpotlightSection>
      <div className="flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={props.theme} onToggleTheme={props.onToggleTheme} />

        <main className="flex-1 p-6">
          <div className="hidden">
            <Tabs role={role} onChange={setRole} />
          </div>

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Aperçu du Tableau de Bord</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Bon retour, Grand Patron. Voici l&apos;activité d&apos;aujourd&apos;hui.
              </p>
            </div>

            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              {todayLabel}
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/50 dark:bg-red-950/40">
              <p className="text-sm font-semibold text-red-700 dark:text-red-200">{error}</p>
              <Button type="button" onClick={() => void refresh()} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
                Réessayer
              </Button>
            </div>
          ) : null}

          {loading && !overview ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <p className="text-sm font-medium text-slate-500">Chargement du tableau de bord…</p>
            </div>
          ) : overview ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <ParticleHover className="rounded-2xl">
                  <TopStatCard
                    title="Parc Total"
                    value={String(overview.fleet.total)}
                    delta={formatDeltaPct(overview.fleet.deltaPct)}
                    deltaTone={deltaPctTone(overview.fleet.deltaPct)}
                    Icon={MapPin}
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <TopStatCard
                    title="Investisseurs Actifs"
                    value={String(overview.activeInvestors.count)}
                    delta={formatDeltaPct(overview.activeInvestors.deltaPct)}
                    deltaTone={deltaPctTone(overview.activeInvestors.deltaPct)}
                    Icon={Users}
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <TopStatCard
                    title="Revenu Mensuel"
                    value={formatXafLabel(overview.monthlyRevenue.amount, true)}
                    delta={formatDeltaPct(overview.monthlyRevenue.deltaPct)}
                    deltaTone={deltaPctTone(overview.monthlyRevenue.deltaPct)}
                    Icon={DollarSign}
                  />
                </ParticleHover>
              </div>

              <div className="mt-5">
                <GrandPatronDashboard
                  overview={overview}
                  alerts={alerts}
                  transactions={transactions}
                  onOpenPayment={() => setPaymentOpen(true)}
                  onOpenIncident={() => setIncidentOpen(true)}
                  onOpenInvitation={() => setInvitationOpen(true)}
                  onViewAllPayments={() => navigate('/paiements')}
                />
                <div className="hidden">
                  <InvestorDashboard />
                  <ConducteurDashboard />
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>

      <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={() => void refresh()} />
      <IncidentModal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} onSuccess={() => void refresh()} />
      <InvitationModal isOpen={invitationOpen} onClose={() => setInvitationOpen(false)} onSuccess={() => void refresh()} />
    </SpotlightSection>
  )
}

