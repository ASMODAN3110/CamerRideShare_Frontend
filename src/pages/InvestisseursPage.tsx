import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, AlertTriangle, ChevronRight, MapPin, Plus, Search, TrendingUp, Users, Wallet } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import AdminLayout from '@/components/admin/AdminLayout'
import { InvitationModal } from '@/components/ActionModals'
import { InvestorProfileModal } from '@/components/InvestorProfileModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminInvestors } from '@/hooks/useAdminInvestors'
import { formatJoinedAt, INVESTOR_STATUS_UI } from '@/lib/investors'
import { formatXafLabel, initials } from '@/lib/format'
import type { AdminInvestorListItem, AdminInvestorStatus } from '@/types/api'

const ALL = 'all'

const roiChartConfig = {
  roi: { label: 'ROI moyen', color: 'var(--chart-1)' },
} satisfies ChartConfig

function StatCard(props: { label: string; value: string; sub?: string; Icon: LucideIcon; tone: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col items-start gap-3 xl:flex-row xl:items-center xl:gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${props.tone}`}>
          <props.Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardDescription>{props.label}</CardDescription>
          <div className="flex items-baseline gap-1.5">
            <CardTitle className="text-2xl font-extrabold tabular-nums">{props.value}</CardTitle>
            {props.sub ? <span className="text-sm font-semibold text-muted-foreground">{props.sub}</span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i} className={i === 3 || i === 6 ? 'hidden lg:table-cell' : i === 5 ? 'hidden xl:table-cell' : undefined}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function InvestorRow({ investor, onOpen }: { investor: AdminInvestorListItem; onOpen: () => void }) {
  const { label, variant } = INVESTOR_STATUS_UI[investor.status]
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="hidden size-9 shrink-0 lg:flex">
            {investor.avatarUrl ? <AvatarImage src={investor.avatarUrl} alt={investor.fullName} /> : null}
            <AvatarFallback className="text-xs">{initials(investor.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <button type="button" onClick={onOpen} className="text-left font-semibold hover:underline focus-visible:underline focus-visible:outline-none">
              {investor.fullName}
            </button>
            <div className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {investor.zone ?? '—'}
              <span className="lg:hidden">· {investor.motosCount} véhicule{investor.motosCount !== 1 ? 's' : ''}</span>
              <span className="hidden lg:inline xl:hidden">· {formatJoinedAt(investor.joinedAt)}</span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap font-semibold tabular-nums">{formatXafLabel(investor.amountInvested, true)}</TableCell>
      <TableCell>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground tabular-nums">{formatXafLabel(investor.amountRecovered, true)}</span>
            <span className="font-bold text-success-foreground">{investor.recoveryRatePct}%</span>
          </div>
          <Progress value={investor.recoveryRatePct} className="h-1.5 w-20 lg:w-32" />
        </div>
      </TableCell>
      <TableCell className="hidden text-center lg:table-cell">
        <Badge variant="blue" className="size-7 justify-center rounded-full p-0">
          {investor.motosCount}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={variant}>{label}</Badge>
      </TableCell>
      <TableCell className="hidden text-muted-foreground xl:table-cell">{formatJoinedAt(investor.joinedAt)}</TableCell>
      <TableCell className="hidden lg:table-cell">
        <Button type="button" variant="ghost" size="sm" onClick={onOpen} aria-label={`Voir le profil de ${investor.fullName}`}>
          <span className="hidden xl:inline">Voir profil</span>
          <ChevronRight />
        </Button>
      </TableCell>
    </TableRow>
  )
}

type InvestisseursPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function InvestisseursPage({ theme, onToggleTheme }: InvestisseursPageProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [profileId, setProfileId] = useState<number | null>(null)

  const { summary, investors, meta, roiTrend, filters, loading, listLoading, error, refresh, setPage, setSearch, setStatusFilter } =
    useAdminInvestors()

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
    <AdminLayout
      title="Investisseurs"
      description="Gestion et suivi de vos partenaires financiers."
      theme={theme}
      onToggleTheme={onToggleTheme}
      actions={
        <Button type="button" onClick={() => setInviteOpen(true)}>
          <Plus />
          Ajouter un utilisateur
        </Button>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*:last-child:nth-child(odd)]:sm:col-span-2 [&>*:last-child:nth-child(odd)]:lg:col-span-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
        ) : (
          <>
            <StatCard
              label="Capital total investi"
              value={summary ? formatXafLabel(summary.totalCapitalInvested, true) : '—'}
              Icon={Wallet}
              tone="bg-secondary text-secondary-foreground"
            />
            <StatCard
              label="Investisseurs actifs"
              value={summary != null ? String(summary.activeInvestorsCount) : '—'}
              sub={summary != null ? `/ ${summary.totalInvestorsCount}` : undefined}
              Icon={Users}
              tone="bg-success/12 text-success-foreground"
            />
            <StatCard
              label="Véhicules financés"
              value={summary != null ? String(summary.financedMotosCount) : '—'}
              Icon={TrendingUp}
              tone="bg-warning/25 text-warning-foreground"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-3">
        <Card className="2xl:col-span-2">
          <CardHeader>
            <CardTitle>Liste des investisseurs</CardTitle>
            <CardDescription>
              {totalCount} résultat{totalCount !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-52">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  aria-label="Rechercher un investisseur"
                  className="pl-9"
                />
              </div>
              <Select
                value={filters.status || ALL}
                onValueChange={(v) => setStatusFilter((v === ALL ? '' : v) as AdminInvestorStatus | '')}
              >
                <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par statut">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    {[
                      { label: 'Investisseur', hide: '' },
                      { label: 'Investi', hide: '' },
                      { label: 'Recouvré', hide: '' },
                      { label: 'Véhicules', hide: 'hidden lg:table-cell' },
                      { label: 'Statut', hide: '' },
                      { label: 'Entrée', hide: 'hidden xl:table-cell' },
                      { label: '', hide: 'hidden lg:table-cell' },
                    ].map((col, i) => (
                      <TableHead key={`${col.label}-${i}`} className={`text-xs font-semibold uppercase tracking-wider ${col.hide}`}>
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading && investors.length === 0 ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : investors.length > 0 ? (
                    investors.map((inv) => <InvestorRow key={inv.id} investor={inv} onOpen={() => setProfileId(inv.id)} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-14 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="size-7" />
                          <p className="text-sm font-semibold">Aucun investisseur trouvé</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Affichage de <span className="font-semibold text-foreground">{rangeStart}</span> à{' '}
                <span className="font-semibold text-foreground">{rangeEnd}</span> sur{' '}
                <span className="font-semibold text-foreground">{totalCount}</span> investisseur{totalCount !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1 || listLoading} onClick={() => setPage(currentPage - 1)}>
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages || listLoading} onClick={() => setPage(currentPage + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du ROI moyen</CardTitle>
              <CardDescription>8 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : roiChartData.length > 0 ? (
                <ChartContainer config={roiChartConfig} className="aspect-auto h-48 w-full">
                  <LineChart data={roiChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="mois" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} unit="%" />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Line
                      type="monotone"
                      dataKey="roi"
                      stroke="var(--color-roi)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'var(--color-roi)', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Aucune donnée ROI</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top contributeurs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : topContributors.length > 0 ? (
                <ul className="space-y-3">
                  {topContributors.map((inv, idx) => (
                    <li key={inv.id} className="flex items-center gap-3">
                      <Badge variant="secondary" className="size-6 justify-center rounded-full p-0">
                        {idx + 1}
                      </Badge>
                      <Avatar className="size-8 shrink-0">
                        {inv.avatarUrl ? <AvatarImage src={inv.avatarUrl} alt={inv.fullName} /> : null}
                        <AvatarFallback className="text-xs">{initials(inv.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{inv.fullName}</div>
                        <Progress value={inv.recoveryRatePct} className="mt-1 h-1" />
                      </div>
                      <span className="shrink-0 text-xs font-bold text-success-foreground">{inv.recoveryRatePct}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Aucun contributeur</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InvestorProfileModal investorId={profileId} onClose={() => setProfileId(null)} />
      <InvitationModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={() => void refresh()} />
    </AdminLayout>
  )
}
