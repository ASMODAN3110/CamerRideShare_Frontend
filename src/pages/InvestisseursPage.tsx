import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  ChevronRight,
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
import { ParticleHover, SpotlightSection } from '../components/MagicBento'
import { InvitationModal } from '../components/ActionModals'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useAdminInvestors } from '../hooks/useAdminInvestors'
import { formatJoinedAt, INVESTOR_STATUS_UI } from '../lib/investors'
import { formatXafLabel, initials } from '../lib/format'
import type { AdminInvestorListItem, AdminInvestorStatus } from '../types/api'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard(props: {
  label: string
  value: string
  sub?: string
  Icon: LucideIcon
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
          {sub ? <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{sub}</span> : null}
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── InvestorRow ──────────────────────────────────────────────────────────────

function InvestorRow({ investor }: { investor: AdminInvestorListItem }) {
  const { label, variant, dot } = INVESTOR_STATUS_UI[investor.status]
  return (
    <TableRow className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
      <TableCell className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {investor.avatarUrl ? (
              <AvatarImage
                src={investor.avatarUrl}
                alt={investor.fullName}
                className="h-full w-full object-cover"
              />
            ) : null}
            <AvatarFallback>{initials(investor.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-50">{investor.fullName}</div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              {investor.zone ?? '—'}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-50">
        {formatXafLabel(investor.amountInvested, true)}
      </TableCell>

      <TableCell className="px-5 py-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {formatXafLabel(investor.amountRecovered, true)}
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-300">{investor.recoveryRatePct}%</span>
          </div>
          <Progress value={investor.recoveryRatePct} className="h-1.5 w-32" />
        </div>
      </TableCell>

      <TableCell className="px-5 py-3.5 text-center">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
          {investor.motosCount}
        </span>
      </TableCell>

      <TableCell className="px-5 py-3.5">
        <Badge variant={variant} className="gap-1.5 px-2.5 py-1">
          <span className={['h-2 w-2 rounded-full', dot].join(' ')} />
          {label}
        </Badge>
      </TableCell>

      <TableCell className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
        {formatJoinedAt(investor.joinedAt)}
      </TableCell>

      <TableCell className="px-5 py-3.5">
        <Button
          type="button"
          disabled
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400"
          title="Profil détaillé non disponible"
        >
          Voir profil
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// ─── InvestisseursPage ────────────────────────────────────────────────────────

type InvestisseursPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function InvestisseursPage({ theme, onToggleTheme }: InvestisseursPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const {
    summary,
    investors,
    meta,
    roiTrend,
    filters,
    loading,
    listLoading,
    error,
    refresh,
    setPage,
    setSearch,
    setStatusFilter,
  } = useAdminInvestors()

  const roiChartData = useMemo(
    () => roiTrend?.points.map((p) => ({ mois: p.label, roi: p.avgRoiPct })) ?? [],
    [roiTrend],
  )

  const topContributors = summary?.topContributors ?? []

  const currentPage = meta?.page ?? filters.page
  const totalPages = meta?.totalPages ?? 1
  const totalCount = meta?.total ?? 0
  const limit = meta?.limit ?? 20
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1
  const rangeEnd = Math.min(currentPage * limit, totalCount)

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
              onClick={() => setInviteOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Inviter un Investisseur
            </Button>
          </div>

          {error ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
              <span>{error}</span>
              <Button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
              >
                Réessayer
              </Button>
            </div>
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Capital Total Investi"
                    value={summary ? formatXafLabel(summary.totalCapitalInvested, true) : '—'}
                    Icon={Wallet}
                    iconBg="bg-blue-50 dark:bg-blue-950/40"
                    iconColor="text-blue-600 dark:text-blue-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Investisseurs Actifs"
                    value={summary != null ? String(summary.activeInvestorsCount) : '—'}
                    sub={summary != null ? `/ ${summary.totalInvestorsCount}` : undefined}
                    Icon={Users}
                    iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                    iconColor="text-emerald-600 dark:text-emerald-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Motos Financées"
                    value={summary != null ? String(summary.financedMotosCount) : '—'}
                    Icon={TrendingUp}
                    iconBg="bg-blue-50 dark:bg-blue-950/40"
                    iconColor="text-blue-600 dark:text-blue-300"
                  />
                </ParticleHover>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ParticleHover className="rounded-2xl xl:col-span-2">
              <Card className="xl:col-span-2">
                <CardHeader className="p-5 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">Liste des Investisseurs</CardTitle>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      {totalCount} résultat{totalCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={filters.search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <select
                      value={filters.status}
                      onChange={(e) => setStatusFilter(e.target.value as AdminInvestorStatus | '')}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="LATE">En retard</option>
                      <option value="INACTIVE">Inactif</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <Table className="min-w-full text-sm">
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
                          {['Investisseur', 'Investi', 'Recouvré', 'Motos', 'Statut', 'Entrée', ''].map((col) => (
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
                        {listLoading && investors.length === 0 ? (
                          <>
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                            <TableRowSkeleton />
                          </>
                        ) : investors.length > 0 ? (
                          investors.map((inv) => <InvestorRow key={inv.id} investor={inv} />)
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

                  <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Affichage de{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{rangeStart}</span> à{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{rangeEnd}</span> sur{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span>{' '}
                      investisseur{totalCount !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        disabled={currentPage <= 1 || listLoading}
                        onClick={() => setPage(currentPage - 1)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-slate-500">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        disabled={currentPage >= totalPages || listLoading}
                        onClick={() => setPage(currentPage + 1)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ParticleHover>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Évolution du ROI Moyen</CardTitle>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">8 derniers mois</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-48 w-full">
                    {loading ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Chargement…
                      </div>
                    ) : roiChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={roiChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Aucune donnée ROI
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base">Top Contributeurs</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <p className="py-4 text-center text-sm text-slate-400">Chargement…</p>
                  ) : topContributors.length > 0 ? (
                    <ul className="space-y-3">
                      {topContributors.map((inv, idx) => (
                        <li key={inv.id} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            {idx + 1}
                          </span>
                          <Avatar className="h-8 w-8 shrink-0">
                            {inv.avatarUrl ? (
                              <AvatarImage
                                src={inv.avatarUrl}
                                alt={inv.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                            <AvatarFallback>{initials(inv.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
                              {inv.fullName}
                            </div>
                            <Progress value={inv.recoveryRatePct} className="mt-1 h-1" />
                          </div>
                          <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300">
                            {inv.recoveryRatePct}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-4 text-center text-sm text-slate-400">Aucun contributeur</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <InvitationModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => void refresh()}
      />
    </SpotlightSection>
  )
}
