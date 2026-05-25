import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CircleDot,
  CreditCard,
  Gauge,
  MapPin,
  DollarSign,
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
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

type Role = 'patron' | 'investisseur' | 'conducteur'

function TopStatCard(props: { title: string; value: string; delta: string; Icon: LucideIcon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">{props.title}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{props.value}</div>
          <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
            <TrendingUp className="mr-1 h-3 w-3" />
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

function EtatParcDonutCard() {
  const parc = { actif: 105, vole: 12, panne: 7 }
  const total = parc.actif + parc.vole + parc.panne
  const actifPct = Math.round((parc.actif / total) * 100)

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

function TresorerieCard() {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Trésorerie Hebdomadaire</CardTitle>
            <div className="mt-1 text-sm font-medium text-slate-500">20 Oct - 26 Oct</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-50">2.5M / 3.0M XAF</div>
            <div className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">83% Recouvré</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <Progress value={83} className="h-4" aria-label="Progress trésorerie" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>0 XAF</span>
            <span className="text-slate-600 dark:text-slate-300">Objectif: 3.0M XAF</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertesCard() {
  const alertes = [
    {
      name: 'Jean-Paul N.',
      location: 'Douala Zone B',
      badge: '3 semaines de retard',
      amount: '-45,000 XAF',
      avatar: 'https://i.pravatar.cc/100?img=3',
      isLink: false,
    },
    {
      name: 'Michel T.',
      location: 'Yaoundé Central',
      badge: '2 semaines de retard',
      amount: '-30,000 XAF',
      avatar: 'https://i.pravatar.cc/100?img=5',
      isLink: false,
    },
    {
      name: 'Alain B.',
      location: 'Bafoussam Ouest',
      badge: 'Incident Signale',
      amount: 'Voir details',
      avatarFallback: 'AB',
      isLink: true,
    },
  ]

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
            3 Priorités Hautes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y divide-slate-200/60">
          {alertes.map((a) => (
            <div key={a.name} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {a.avatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={a.avatar} alt={a.name} className="h-full w-full rounded-full object-cover" />
                  </Avatar>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{a.avatarFallback}</AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{a.name}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{a.location}</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  {a.badge}
                </div>
                <div className="mt-1 text-xs font-semibold">
                  {a.isLink ? (
                    <Button type="button" className="text-blue-600 hover:underline dark:text-blue-300">
                      {a.amount}
                    </Button>
                  ) : (
                    <span className="text-red-600 dark:text-red-300">{a.amount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GrandPatronDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <EtatParcDonutCard />
        </div>
        <div className="flex flex-col gap-4">
          <TresorerieCard />
          <AlertesCard />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="pt-1">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Actions Rapides</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <CreditCard className="h-4 w-4" />
            Saisir Paiement
          </Button>
          <Button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Signaler Incident
          </Button>
          <Button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <Users className="h-4 w-4 text-emerald-600" />
            Inviter Investisseur
          </Button>
        </div>
      </div>

      {/* Transactions récentes */}
      <Card className="rounded-2xl">
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Transactions Récentes</div>
          <Button type="button" className="text-xs font-semibold text-blue-600 hover:underline">
            Tout afficher
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <Table className="min-w-full text-xs">
            <TableHeader className="bg-white dark:bg-slate-900/40">
              <TableRow className="text-left text-slate-500 dark:text-slate-400">
                <TableHead className="px-5 py-3 font-semibold">CHAUFFEUR</TableHead>
                <TableHead className="px-5 py-3 font-semibold">DATE</TableHead>
                <TableHead className="px-5 py-3 font-semibold">STATUT</TableHead>
                <TableHead className="px-5 py-3 font-semibold text-right">MONTANT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-t border-slate-200 dark:border-slate-800">
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://i.pravatar.cc/100?img=1" alt="Emanuel K." className="h-8 w-8 object-cover" />
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Emanuel K.</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3 text-slate-500 dark:text-slate-400">24 Oct, 2023 - 10:42</TableCell>
                <TableCell className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Vérifié
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-300">+ 15,000 XAF</TableCell>
              </TableRow>

              <TableRow className="border-t border-slate-200 dark:border-slate-800">
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://i.pravatar.cc/100?img=2" alt="Sarah M." className="h-8 w-8 object-cover" />
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Sarah M.</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3 text-slate-500 dark:text-slate-400">24 Oct, 2023 - 09:15</TableCell>
                <TableCell className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />
                    En attente
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-300">+ 15,000 XAF</TableCell>
              </TableRow>

              <TableRow className="border-t border-slate-200 dark:border-slate-800">
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Journal Maintenance</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3 text-slate-500 dark:text-slate-400">23 Oct, 2023 - 16:30</TableCell>
                <TableCell className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-200">
                    Dépense
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-semibold text-red-600 dark:text-red-300">- 4,500 XAF</TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState<Role>('patron')

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
          {/* Hidden tabs: only Grand Patron workspace */}
          <div className="hidden">
            <Tabs role={role} onChange={setRole} />
          </div>

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Aperçu du Tableau de Bord</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bon retour, Grand Patron. Voici l&apos;activité d&apos;aujourd&apos;hui.</p>
            </div>

            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              {todayLabel}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ParticleHover className="rounded-2xl"><TopStatCard title="Parc Total" value="124" delta="+12%" Icon={MapPin} /></ParticleHover>
            <ParticleHover className="rounded-2xl"><TopStatCard title="Investisseurs Actifs" value="42" delta="+5%" Icon={Users} /></ParticleHover>
            <ParticleHover className="rounded-2xl"><TopStatCard title="Revenu Mensuel" value="12.5M XAF" delta="+8%" Icon={DollarSign} /></ParticleHover>
          </div>

          <div className="mt-5">
            <GrandPatronDashboard />
            <div className="hidden">
              <InvestorDashboard />
              <ConducteurDashboard />
            </div>
          </div>
        </main>
      </div>
      </SpotlightSection>
  )
}

