import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { ParticleHover, SpotlightSection } from '../components/MagicBento'
import { CreateMotoModal, MotoDetailModal } from '../components/FleetModals'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { useFleetParc } from '../hooks/useFleetParc'
import { DEFAULT_MOTO_IMAGE, STATUS_UI } from '../lib/fleet'
import { initials } from '../lib/format'
import type { MotoListItem } from '../types/api'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard(props: {
  label: string
  value: number | string
  Icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  const { label, value, Icon, iconBg, iconColor } = props
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
        <Icon className={['h-5 w-5', iconColor].join(' ')} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

function MotoCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-44 animate-pulse bg-slate-200 dark:bg-slate-700" />
      <CardContent className="space-y-3 px-4 pb-4 pt-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-2 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </CardContent>
    </Card>
  )
}

// ─── MotoCard ─────────────────────────────────────────────────────────────────

function MotoCard({ moto, onDetails }: { moto: MotoListItem; onDetails: (id: number) => void }) {
  const { label, variant } = STATUS_UI[moto.status]
  const driverName = moto.driver?.fullName ?? 'Non assigné'
  const avatarFallback = moto.driver ? initials(moto.driver.fullName) : '?'

  return (
    <Card className="overflow-hidden">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={moto.imageUrl ?? DEFAULT_MOTO_IMAGE}
          alt={`Moto ${moto.matricule}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = DEFAULT_MOTO_IMAGE
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute right-3 top-3">
          <Badge variant={variant} className="shadow-sm">
            {label}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            # {moto.matricule}
          </span>
        </div>
      </div>

      <CardContent className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{driverName}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{moto.city}</span>
            </div>
          </div>
          {moto.driver ? (
            <Avatar className="h-9 w-9 shrink-0">
              {moto.driver.avatarUrl ? (
                <AvatarImage
                  src={moto.driver.avatarUrl}
                  alt={moto.driver.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              )}
            </Avatar>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-400 dark:bg-slate-800">
              ?
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Progression Propriété</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{moto.ownershipPct}%</span>
          </div>
          <Progress value={moto.ownershipPct} className="h-2" aria-label={`Progression ${driverName}`} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
          {moto.footerInfo ? (
            <span className="truncate text-xs text-slate-400 dark:text-slate-500">{moto.footerInfo}</span>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={() => onDetails(moto.id)}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
          >
            Détails
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── ParcPage ─────────────────────────────────────────────────────────────────

type ParcPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function ParcPage({ theme, onToggleTheme }: ParcPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailMotoId, setDetailMotoId] = useState<number | null>(null)

  const {
    summary,
    filterOptions,
    motos,
    meta,
    filters,
    loading,
    listLoading,
    error,
    refresh,
    setPage,
    setSearch,
    setStatusFilter,
    setCityFilter,
    setModelFilter,
  } = useFleetParc()

  const handleMutationSuccess = () => {
    void refresh()
  }

  const displayCount = motos.length
  const totalCount = meta?.total ?? summary?.total ?? 0
  const currentPage = meta?.page ?? filters.page
  const totalPages = meta?.totalPages ?? 1

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
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Gestion du Parc</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Supervision et maintenance de votre flotte de motos-taxis.
              </p>
            </div>
            <Button
              glare
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Ajouter une moto
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

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Total Motos"
                    value={summary?.total ?? '—'}
                    Icon={Bike}
                    iconBg="bg-blue-50 dark:bg-blue-950/40"
                    iconColor="text-blue-600 dark:text-blue-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Disponibles"
                    value={summary?.available ?? '—'}
                    Icon={CheckCircle2}
                    iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                    iconColor="text-emerald-600 dark:text-emerald-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="En Maintenance"
                    value={summary?.inMaintenance ?? '—'}
                    Icon={Wrench}
                    iconBg="bg-orange-50 dark:bg-orange-950/40"
                    iconColor="text-orange-600 dark:text-orange-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Incidents"
                    value={summary?.incidents ?? '—'}
                    Icon={AlertTriangle}
                    iconBg="bg-red-50 dark:bg-red-950/40"
                    iconColor="text-red-600 dark:text-red-300"
                  />
                </ParticleHover>
              </>
            )}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par matricule ou chauffeur..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setStatusFilter(e.target.value as '' | 'ACTIVE' | 'BROKEN' | 'STOLEN')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="">Statut: Tous</option>
              <option value="ACTIVE">Actif</option>
              <option value="BROKEN">En panne</option>
              <option value="STOLEN">Indisponible</option>
            </select>

            <select
              value={filters.city}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="">Zone: Toutes</option>
              {(filterOptions?.cities ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filters.model}
              onChange={(e) => setModelFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="">Type: Tous</option>
              {(filterOptions?.models ?? []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {loading || listLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MotoCardSkeleton key={i} />
              ))}
            </div>
          ) : motos.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {motos.map((moto) => (
                <ParticleHover key={moto.id} className="rounded-2xl">
                  <MotoCard moto={moto} onDetails={setDetailMotoId} />
                </ParticleHover>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <Search className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucune moto trouvée</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Essayez de modifier vos filtres.</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Affichage de{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{displayCount}</span> sur{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span> motos
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
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
              >
                Suivant
              </Button>
            </div>
          </div>
        </main>
      </div>

      <CreateMotoModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleMutationSuccess}
        filterOptions={filterOptions}
      />

      <MotoDetailModal
        motoId={detailMotoId}
        onClose={() => setDetailMotoId(null)}
        onSuccess={handleMutationSuccess}
        filterOptions={filterOptions}
      />
    </SpotlightSection>
  )
}
