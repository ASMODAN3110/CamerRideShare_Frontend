import { useState, useMemo } from 'react'
import {
  AlertCircle,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import { EffectCard, SpotlightSection } from '../components/MagicBento'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvestorStatus = 'actif' | 'inactif' | 'retard'

type Investor = {
  id: string
  nom: string
  avatarUrl?: string
  avatarFallback: string
  zone: string
  montantInvesti: string
  montantRecouvre: string
  recouvrementPct: number
  motos: number
  status: InvestorStatus
  dateEntree: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockInvestors: Investor[] = [
  {
    id: 'i1',
    nom: 'Robert M.',
    avatarUrl: 'https://i.pravatar.cc/100?img=11',
    avatarFallback: 'RM',
    zone: 'Douala',
    montantInvesti: '5.0M XAF',
    montantRecouvre: '4.2M XAF',
    recouvrementPct: 84,
    motos: 4,
    status: 'actif',
    dateEntree: 'Jan 2023',
  },
  {
    id: 'i2',
    nom: 'Céleste N.',
    avatarUrl: 'https://i.pravatar.cc/100?img=20',
    avatarFallback: 'CN',
    zone: 'Yaoundé',
    montantInvesti: '3.5M XAF',
    montantRecouvre: '2.1M XAF',
    recouvrementPct: 60,
    motos: 3,
    status: 'retard',
    dateEntree: 'Mar 2023',
  },
  {
    id: 'i3',
    nom: 'Patrice K.',
    avatarUrl: 'https://i.pravatar.cc/100?img=33',
    avatarFallback: 'PK',
    zone: 'Bafoussam',
    montantInvesti: '2.0M XAF',
    montantRecouvre: '2.0M XAF',
    recouvrementPct: 100,
    motos: 2,
    status: 'actif',
    dateEntree: 'Fév 2023',
  },
  {
    id: 'i4',
    nom: 'Henriette T.',
    avatarFallback: 'HT',
    zone: 'Douala',
    montantInvesti: '1.5M XAF',
    montantRecouvre: '0.6M XAF',
    recouvrementPct: 40,
    motos: 1,
    status: 'inactif',
    dateEntree: 'Avr 2023',
  },
  {
    id: 'i5',
    nom: 'Francis D.',
    avatarUrl: 'https://i.pravatar.cc/100?img=60',
    avatarFallback: 'FD',
    zone: 'Limbé',
    montantInvesti: '4.2M XAF',
    montantRecouvre: '3.8M XAF',
    recouvrementPct: 90,
    motos: 3,
    status: 'actif',
    dateEntree: 'Déc 2022',
  },
]

const roiData = [
  { mois: 'Jan', roi: 5 },
  { mois: 'Fév', roi: 8 },
  { mois: 'Mar', roi: 7 },
  { mois: 'Avr', roi: 11 },
  { mois: 'Mai', roi: 13 },
  { mois: 'Jun', roi: 15 },
  { mois: 'Jul', roi: 14 },
  { mois: 'Aoû', roi: 17 },
]

// ─── Config statuts ───────────────────────────────────────────────────────────

const statusConfig: Record<InvestorStatus, { label: string; variant: 'green' | 'orange' | 'red'; dot: string }> = {
  actif:   { label: 'Actif',       variant: 'green',  dot: 'bg-emerald-500' },
  retard:  { label: 'En retard',   variant: 'orange', dot: 'bg-orange-500'  },
  inactif: { label: 'Inactif',     variant: 'red',    dot: 'bg-red-500'     },
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard(props: {
  label: string
  value: string
  sub?: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  const { label, value, sub, Icon, iconBg, iconColor } = props
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
        <Icon className={['h-5 w-5', iconColor].join(' ')} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
          {sub && <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── InvestorRow ──────────────────────────────────────────────────────────────

function InvestorRow({ investor }: { investor: Investor }) {
  const { label, variant, dot } = statusConfig[investor.status]
  return (
    <tr className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
      {/* Investisseur */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {investor.avatarUrl ? (
              <AvatarImage src={investor.avatarUrl} alt={investor.nom} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{investor.avatarFallback}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-50">{investor.nom}</div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              {investor.zone}
            </div>
          </div>
        </div>
      </td>

      {/* Investi */}
      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-50">{investor.montantInvesti}</td>

      {/* Recouvré */}
      <td className="px-5 py-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{investor.montantRecouvre}</span>
            <span className="font-bold text-blue-600 dark:text-blue-300">{investor.recouvrementPct}%</span>
          </div>
          <Progress value={investor.recouvrementPct} className="h-1.5 w-32" />
        </div>
      </td>

      {/* Motos */}
      <td className="px-5 py-3.5 text-center">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
          {investor.motos}
        </span>
      </td>

      {/* Statut */}
      <td className="px-5 py-3.5">
        <Badge variant={variant} className="gap-1.5 px-2.5 py-1">
          <span className={['h-2 w-2 rounded-full', dot].join(' ')} />
          {label}
        </Badge>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{investor.dateEntree}</td>

      {/* Action */}
      <td className="px-5 py-3.5">
        <Button
          type="button"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
        >
          Voir profil
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  )
}

// ─── InvestisseursPage ────────────────────────────────────────────────────────

type InvestisseursPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function InvestisseursPage({ theme, onToggleTheme }: InvestisseursPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')

  const filteredInvestors = useMemo(
    () =>
      mockInvestors.filter((inv) => {
        const matchSearch =
          search.trim() === '' || inv.nom.toLowerCase().includes(search.toLowerCase()) || inv.zone.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'tous' || inv.status === filterStatus
        return matchSearch && matchStatus
      }),
    [search, filterStatus],
  )

  // Aggregate KPIs
  const totalActifs = mockInvestors.filter((i) => i.status === 'actif').length
  const totalMotos = mockInvestors.reduce((acc, i) => acc + i.motos, 0)

  return (
      <SpotlightSection>
      <div className="flex">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          {/* ── Header ── */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Investisseurs</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gestion et suivi de vos partenaires financiers.
              </p>
            </div>
            <Button
              glare
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Inviter un Investisseur
            </Button>
          </div>

          {/* ── Stat cards ── */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <EffectCard className="rounded-2xl"><StatCard
              label="Capital Total Investi"
              value="16.2M"
              sub="XAF"
              Icon={Wallet}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-300"
            /></EffectCard>
            <EffectCard className="rounded-2xl"><StatCard
              label="Investisseurs Actifs"
              value={String(totalActifs)}
              sub={`/ ${mockInvestors.length}`}
              Icon={Users}
              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-300"
            /></EffectCard>
            <EffectCard className="rounded-2xl"><StatCard
              label="Motos Financées"
              value={String(totalMotos)}
              Icon={TrendingUp}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-300"
            /></EffectCard>
          </div>

          {/* ── Two-col layout: Table + Chart ── */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* ── Tableau investisseurs ── */}
            <EffectCard className="rounded-2xl xl:col-span-2"><Card className="xl:col-span-2">
              <CardHeader className="p-5 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Liste des Investisseurs</CardTitle>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    {filteredInvestors.length} résultats
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Filters */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher par nom ou zone..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  >
                    <option value="tous">Tous</option>
                    <option value="actif">Actif</option>
                    <option value="retard">En retard</option>
                    <option value="inactif">Inactif</option>
                  </select>
                  <Button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Filtres avancés"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
                        {['Investisseur', 'Investi', 'Recouvré', 'Motos', 'Statut', "Entrée", ''].map((col) => (
                          <TableHead
                            key={col}
                            className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-transparent">
                      {filteredInvestors.length > 0 ? (
                        filteredInvestors.map((inv) => <InvestorRow key={inv.id} investor={inv} />)
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-14 text-center">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <AlertCircle className="h-7 w-7" />
                              <p className="text-sm font-semibold">Aucun investisseur trouvé</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Affichage de{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">1</span> à{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredInvestors.length}</span>{' '}
                    sur{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{mockInvestors.length}</span>{' '}
                    investisseurs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Précédent
                    </Button>
                    <Button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800">
                      Suivant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card></EffectCard>

            {/* ── Sidebar: ROI Chart + Top investisseurs ── */}
            <div className="flex flex-col gap-6">
              {/* ROI Chart */}
              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Évolution du ROI Moyen</CardTitle>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">8 derniers mois</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={roiData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}
                          formatter={(v: unknown) => [`${typeof v === 'number' ? v : ''}%`, 'ROI']}
                        />
                        <Line
                          type="monotone"
                          dataKey="roi"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top investisseurs */}
              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Top Contributeurs</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {[...mockInvestors]
                      .sort((a, b) => b.recouvrementPct - a.recouvrementPct)
                      .slice(0, 4)
                      .map((inv, idx) => (
                        <li key={inv.id} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            {idx + 1}
                          </span>
                          <Avatar className="h-8 w-8 shrink-0">
                            {inv.avatarUrl ? (
                              <AvatarImage src={inv.avatarUrl} alt={inv.nom} className="h-full w-full object-cover" />
                            ) : (
                              <AvatarFallback>{inv.avatarFallback}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">{inv.nom}</div>
                            <Progress value={inv.recouvrementPct} className="mt-1 h-1" />
                          </div>
                          <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300">
                            {inv.recouvrementPct}%
                          </span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      </SpotlightSection>
  )
}
