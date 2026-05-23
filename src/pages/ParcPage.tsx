import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { EffectCard, SpotlightSection } from '../components/MagicBento'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'

// ─── Types ────────────────────────────────────────────────────────────────────

type MotoStatus = 'actif' | 'panne' | 'indisponible'

type Moto = {
  id: string
  matricule: string
  chauffeur: string
  zone: string
  status: MotoStatus
  progression: number
  info: string
  avatarUrl?: string
  avatarFallback: string
  imageUrl: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockMotos: Moto[] = [
  {
    id: 'm1',
    matricule: 'LT 1234 A',
    chauffeur: 'Jean-Paul N.',
    zone: 'Douala V',
    status: 'actif',
    progression: 79,
    info: 'Dernier entretien: 17 Oct',
    avatarUrl: 'https://i.pravatar.cc/100?img=3',
    avatarFallback: 'JP',
    imageUrl: 'https://i.pravatar.cc/400?img=50',
  },
  {
    id: 'm2',
    matricule: 'LT 8820 C',
    chauffeur: 'Michel T.',
    zone: 'Yaoundé I',
    status: 'panne',
    progression: 42,
    info: 'Problème moteur signalé',
    avatarUrl: 'https://i.pravatar.cc/100?img=5',
    avatarFallback: 'MT',
    imageUrl: 'https://i.pravatar.cc/400?img=51',
  },
  {
    id: 'm3',
    matricule: 'SW 4421 B',
    chauffeur: 'Alain B.',
    zone: 'Bafoussam Ouest',
    status: 'indisponible',
    progression: 90,
    info: 'Suspendu (Incident)',
    avatarFallback: 'AB',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'm4',
    matricule: 'LT 0058 G',
    chauffeur: 'Emmanuel K.',
    zone: 'Douala V',
    status: 'actif',
    progression: 18,
    info: 'Nouvelle moto (Semaine 3)',
    avatarUrl: 'https://i.pravatar.cc/100?img=1',
    avatarFallback: 'EK',
    imageUrl: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400&q=80',
  },
]

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

// ─── Status badge config ───────────────────────────────────────────────────────

const statusConfig: Record<MotoStatus, { label: string; variant: 'green' | 'orange' | 'red' }> = {
  actif: { label: 'Actif', variant: 'green' },
  panne: { label: 'En panne', variant: 'orange' },
  indisponible: { label: 'Indisponible', variant: 'red' },
}

// ─── MotoCard ─────────────────────────────────────────────────────────────────

function MotoCard({ moto }: { moto: Moto }) {
  const { label, variant } = statusConfig[moto.status]

  return (
    <Card className="overflow-hidden">
      {/* Image section */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={moto.imageUrl}
          alt={`Moto ${moto.matricule}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Status badge — top right */}
        <div className="absolute right-3 top-3">
          <Badge variant={variant} className="shadow-sm">
            {label}
          </Badge>
        </div>

        {/* Matricule badge — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            # {moto.matricule}
          </span>
        </div>
      </div>

      {/* Body */}
      <CardContent className="px-4 pb-4 pt-3">
        {/* Chauffeur row */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{moto.chauffeur}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{moto.zone}</span>
            </div>
          </div>
          <Avatar className="h-9 w-9 shrink-0">
            {moto.avatarUrl ? (
              <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{moto.avatarFallback}</AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Progression */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Progression Propriété</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{moto.progression}%</span>
          </div>
          <Progress value={moto.progression} className="h-2" aria-label={`Progression ${moto.chauffeur}`} />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
          <span className="truncate text-xs text-slate-400 dark:text-slate-500">{moto.info}</span>
          <Button
            type="button"
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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [filterZone, setFilterZone] = useState('toutes')
  const [filterType, setFilterType] = useState('tous')

  // Filter motos based on search + status
  const filteredMotos = mockMotos.filter((m) => {
    const matchSearch =
      search.trim() === '' ||
      m.matricule.toLowerCase().includes(search.toLowerCase()) ||
      m.chauffeur.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'tous' || m.status === filterStatus
    return matchSearch && matchStatus
  })

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
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Gestion du Parc</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Supervision et maintenance de votre flotte de motos-taxis.
              </p>
            </div>
            <Button
              glare
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Ajouter une moto
            </Button>
          </div>

          {/* ── Stat cards ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <EffectCard className="rounded-2xl"><StatCard
              label="Total Motos"
              value={124}
              Icon={Bike}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-300"
            /></EffectCard>
            <EffectCard className="rounded-2xl"><StatCard
              label="Disponibles"
              value={105}
              Icon={CheckCircle2}
              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-300"
            /></EffectCard>
            <EffectCard className="rounded-2xl"><StatCard
              label="En Maintenance"
              value={7}
              Icon={Wrench}
              iconBg="bg-orange-50 dark:bg-orange-950/40"
              iconColor="text-orange-600 dark:text-orange-300"
            /></EffectCard>
            <EffectCard className="rounded-2xl"><StatCard
              label="Incidents"
              value={12}
              Icon={AlertTriangle}
              iconBg="bg-red-50 dark:bg-red-950/40"
              iconColor="text-red-600 dark:text-red-300"
            /></EffectCard>
          </div>

          {/* ── Search & Filters ── */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par matricule ou chauffeur..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="tous">Statut: Tous</option>
              <option value="actif">Actif</option>
              <option value="panne">En panne</option>
              <option value="indisponible">Indisponible</option>
            </select>

            {/* Zone filter */}
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="toutes">Zone: Toutes</option>
              <option value="douala">Douala</option>
              <option value="yaounde">Yaoundé</option>
              <option value="bafoussam">Bafoussam</option>
            </select>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
            >
              <option value="tous">Type: Tous</option>
              <option value="125cc">125cc</option>
              <option value="150cc">150cc</option>
              <option value="200cc">200cc</option>
            </select>

            {/* Advanced filter button */}
            <Button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Filtres avancés"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Moto Grid ── */}
          {filteredMotos.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMotos.map((moto) => (
                <EffectCard key={moto.id} className="rounded-2xl"><MotoCard moto={moto} /></EffectCard>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <Search className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Aucune moto trouvée</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Essayez de modifier vos filtres.</p>
            </div>
          )}

          {/* ── Pagination ── */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Affichage de{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredMotos.length}</span> sur{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">124</span> motos
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Précédent
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                Suivant
              </Button>
            </div>
          </div>
        </main>
      </div>
      </SpotlightSection>
  )
}
