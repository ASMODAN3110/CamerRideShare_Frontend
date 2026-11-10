import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Bike, CheckCircle2, ChevronRight, MapPin, Plus, Search, Wrench } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { CreateMotoModal, MotoDetailModal } from '@/components/FleetModals'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetParc } from '@/hooks/useFleetParc'
import { DEFAULT_MOTO_IMAGE, STATUS_UI } from '@/lib/fleet'
import { initials } from '@/lib/format'
import { VEHICLE_TYPE_LABEL, vehicleDescription } from '@/lib/vehicles'
import type { MotoListItem } from '@/types/api'

const ALL = 'all'

function StatCard(props: { label: string; value: number | string; Icon: LucideIcon; tone: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${props.tone}`}>
          <props.Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardDescription className="leading-tight">{props.label}</CardDescription>
          <CardTitle className="text-2xl font-extrabold tabular-nums">{props.value}</CardTitle>
        </div>
      </CardContent>
    </Card>
  )
}

function MotoCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <Skeleton className="h-44 rounded-none" />
      <CardContent className="space-y-3 py-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}

function MotoCard({ moto, onDetails }: { moto: MotoListItem; onDetails: (id: number) => void }) {
  const { label, variant } = STATUS_UI[moto.status]
  const driverName = moto.driver?.fullName ?? 'Non assigné'

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        <img
          src={moto.imageUrl ?? DEFAULT_MOTO_IMAGE}
          alt={`${VEHICLE_TYPE_LABEL[moto.vehicleType]} ${moto.matricule}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = DEFAULT_MOTO_IMAGE
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <Badge variant={`solid-${variant}`} className="absolute right-3 top-3">
          {label}
        </Badge>
        <Badge variant="solid-green" className="absolute left-3 top-3">
          {VEHICLE_TYPE_LABEL[moto.vehicleType]}
        </Badge>
        <Badge className="absolute bottom-3 left-3 bg-foreground text-background">#{moto.matricule}</Badge>
      </div>

      <CardContent className="space-y-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{driverName}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {moto.city}
                {vehicleDescription(moto) ? ` · ${vehicleDescription(moto)}` : ''}
              </span>
            </div>
          </div>
          <Avatar className="size-9 shrink-0">
            {moto.driver?.avatarUrl ? <AvatarImage src={moto.driver.avatarUrl} alt={driverName} /> : null}
            <AvatarFallback className="text-xs">{moto.driver ? initials(moto.driver.fullName) : '?'}</AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progression propriété</span>
            <span className="font-bold text-success-foreground">{moto.ownershipPct}%</span>
          </div>
          <Progress value={moto.ownershipPct} className="h-2" aria-label={`Progression ${driverName}`} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="truncate text-xs text-muted-foreground">{moto.footerInfo ?? ''}</span>
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onDetails(moto.id)}>
            Détails
            <ChevronRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterSelect(props: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: string[]
  allLabel: string
  label: string
}) {
  return (
    <Select value={props.value || ALL} onValueChange={(v) => props.onChange(v === ALL ? '' : v)}>
      <SelectTrigger className="w-full sm:w-44" aria-label={props.label}>
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{props.allLabel}</SelectItem>
        {props.options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type ParcPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function ParcPage({ theme, onToggleTheme }: ParcPageProps) {
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
    setVehicleTypeFilter,
    setDriverFilter,
  } = useFleetParc()

  const totalCount = meta?.total ?? summary?.total ?? 0
  const currentPage = meta?.page ?? filters.page
  const totalPages = meta?.totalPages ?? 1

  return (
    <AdminLayout
      title="Gestion du parc"
      description="Supervision et maintenance de votre flotte de motos et de taxis."
      theme={theme}
      onToggleTheme={onToggleTheme}
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Ajouter un véhicule
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
        ) : (
          <>
            <StatCard label="Total véhicules" value={summary?.total ?? '—'} Icon={Bike} tone="bg-secondary text-secondary-foreground" />
            <StatCard label="Disponibles" value={summary?.available ?? '—'} Icon={CheckCircle2} tone="bg-success/12 text-success-foreground" />
            <StatCard label="En maintenance" value={summary?.inMaintenance ?? '—'} Icon={Wrench} tone="bg-warning/25 text-warning-foreground" />
            <StatCard label="Incidents" value={summary?.incidents ?? '—'} Icon={AlertTriangle} tone="bg-destructive/10 text-danger-foreground" />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Immatriculation, marque ou conducteur…"
            aria-label="Rechercher un véhicule"
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status || ALL}
          onValueChange={(v) => setStatusFilter((v === ALL ? '' : v) as '' | 'ACTIVE' | 'BROKEN' | 'STOLEN')}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Statut : tous</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="BROKEN">En panne</SelectItem>
            <SelectItem value="STOLEN">Indisponible</SelectItem>
          </SelectContent>
        </Select>

        <FilterSelect
          value={filters.city}
          onChange={setCityFilter}
          placeholder="Zone"
          allLabel="Zone : toutes"
          label="Filtrer par zone"
          options={filterOptions?.cities ?? []}
        />

        <Select value={filters.vehicleType || ALL} onValueChange={(v) => setVehicleTypeFilter(v === ALL ? '' : (v as 'MOTO' | 'TAXI'))}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par type de véhicule">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Type : tous</SelectItem>
            <SelectItem value="MOTO">Motos</SelectItem>
            <SelectItem value="TAXI">Taxis</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.driver || ALL} onValueChange={(v) => setDriverFilter(v === ALL ? '' : v)}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrer par chauffeur">
            <SelectValue placeholder="Chauffeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Chauffeur : tous</SelectItem>
            <SelectItem value="none">Sans chauffeur</SelectItem>
            {(filterOptions?.drivers ?? []).map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading || listLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MotoCardSkeleton key={i} />
          ))}
        </div>
      ) : motos.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {motos.map((moto) => (
            <MotoCard key={moto.id} moto={moto} onDetails={setDetailMotoId} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Search className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-semibold">Aucun véhicule trouvé</p>
            <p className="mt-1 text-xs text-muted-foreground">Essayez de modifier vos filtres.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Affichage de <span className="font-semibold text-foreground">{motos.length}</span> sur{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> véhicules
        </p>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
          <Button type="button" variant="outline" disabled={currentPage <= 1 || listLoading} onClick={() => setPage(currentPage - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button type="button" disabled={currentPage >= totalPages || listLoading} onClick={() => setPage(currentPage + 1)}>
            Suivant
          </Button>
        </div>
      </div>

      <CreateMotoModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void refresh()}
        filterOptions={filterOptions}
      />
      <MotoDetailModal
        motoId={detailMotoId}
        onClose={() => setDetailMotoId(null)}
        onSuccess={() => void refresh()}
        filterOptions={filterOptions}
      />
    </AdminLayout>
  )
}
