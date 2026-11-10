import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ChevronRight, Filter, RefreshCw, Search, ShieldAlert, Wrench } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Skeleton } from '../../components/ui/skeleton'
import PortalLayout from '../../components/admin/AdminLayout'
import InvestorMotoDetailModal from '../../components/InvestorMotoDetailModal'
import InvestorPartContract from '../../components/InvestorPartContract'
import { formatXafLabel } from '../../lib/format'
import { VEHICLE_TYPE_LABEL } from '../../lib/vehicles'
import { getInvestorFleet } from '../../services/investorService'
import type { InvestorFleetItem, InvestorFleetResponse, InvestorMotoStatus } from '../../types/api'

type TabKey = 'all' | 'circulation' | 'maintenance'

type TabDef = {
  key: TabKey
  label: string
  count: number
  Icon: LucideIcon
}

const STATUS_LABEL: Record<InvestorMotoStatus, string> = { actif: 'Actif', panne: 'En panne', indisponible: 'Indisponible' }

/** Couleur de la barre d'avancement selon l'état du véhicule (composant Progress de shadcn). */
const STATUS_BAR: Record<InvestorMotoStatus, string> = {
  actif: '[&>[data-slot=progress-indicator]]:bg-primary',
  panne: '[&>[data-slot=progress-indicator]]:bg-warning',
  indisponible: '[&>[data-slot=progress-indicator]]:bg-muted-foreground/30',
}

function MotoProgress({ status, value }: { status: InvestorMotoStatus; value: number }) {
  return <Progress value={Math.max(0, Math.min(100, value))} className={`h-2 bg-muted ${STATUS_BAR[status]}`} />
}

const progressOf = (m: InvestorFleetItem) => (m.semaineTotal > 0 ? Math.round((m.semaineAcquise / m.semaineTotal) * 100) : 0)
const driverName = (m: InvestorFleetItem) => (m.chauffeur === 'Non assigné' ? 'Sans conducteur' : m.chauffeur)

function MotoCard({ moto, onOpen }: { moto: InvestorFleetItem; onOpen: (id: string) => void }) {
  const progressPct = progressOf(moto)
  const statusIcon =
    moto.status === 'actif' ? <ShieldAlert className="h-3.5 w-3.5 text-success-foreground" /> : moto.status === 'panne' ? <Wrench className="h-3.5 w-3.5 text-warning-foreground" /> : null

  // toute la carte ouvre la fiche, sauf les boutons qu'elle contient (contrats)
  const openFromCard = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return
    onOpen(moto.id)
  }

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={openFromCard} data-testid="fleet-card">
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {moto.avatarUrl ? <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} className="h-full w-full object-cover" /> : <AvatarFallback>{moto.avatarFallback}</AvatarFallback>}
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{driverName(moto)}</div>
              <div className="truncate text-xs text-muted-foreground">{`${VEHICLE_TYPE_LABEL[moto.vehicleType]} · ${moto.plaque}`}</div>
            </div>
          </div>

          <Badge variant={moto.status === 'actif' ? 'green' : moto.status === 'panne' ? 'orange' : 'default'} className="shrink-0">
            <span className="mr-1 inline-flex align-middle">{statusIcon}</span>
            {STATUS_LABEL[moto.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-muted-foreground">{`Semaine ${moto.semaineAcquise} / ${moto.semaineTotal}`}</div>
            <div className="text-xs font-semibold text-muted-foreground">{progressPct}%</div>
          </div>

          <MotoProgress status={moto.status} value={progressPct} />

          <div className="pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Remboursement</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">{`Zone : ${moto.zone}`}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">{`Vos parts : ${moto.parts}`}</div>
            {moto.partList.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {moto.partList.map((part) => (
                  <InvestorPartContract key={part.id} part={part} />
                ))}
              </div>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              {`Investi ${formatXafLabel(moto.investi)} · retour attendu ${formatXafLabel(moto.retourAttendu)} (${formatXafLabel(moto.parSemaine)} par semaine)`}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Revenu du mois</div>
              <div className="mt-1 text-sm font-bold text-foreground">{formatXafLabel(moto.revenuMois)}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 text-primary" onClick={() => onOpen(moto.id)} aria-label={`Voir le détail du véhicule ${moto.plaque}`}>
              Détails
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Élément cliquable des encarts de gauche : ouvre la fiche du véhicule. */
function SideItem(props: { moto: InvestorFleetItem; onOpen: (id: string) => void; withProgress?: boolean; size?: 'sm' | 'md' }) {
  const { moto } = props
  return (
    <button
      type="button"
      onClick={() => props.onOpen(moto.id)}
      aria-label={`Voir le détail du véhicule ${moto.plaque}`}
      className="flex w-full items-center gap-3 rounded-md p-1 text-left outline-hidden transition-colors hover:bg-accent focus-visible:bg-accent"
    >
      <Avatar className={props.size === 'sm' ? 'h-9 w-9 shrink-0' : 'h-10 w-10 shrink-0'}>
        {moto.avatarUrl ? <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} /> : <AvatarFallback>{moto.avatarFallback}</AvatarFallback>}
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{driverName(moto)}</div>
        <div className="truncate text-xs text-muted-foreground">{moto.plaque}</div>
        {props.withProgress ? <MotoProgress status={moto.status} value={progressOf(moto)} /> : null}
      </div>
    </button>
  )
}

interface Loaded {
  key: string
  data: InvestorFleetResponse | null
  error: string | null
}

export default function InvestorFleet() {
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

  const [activeTab, setActiveTab] = useState<TabKey>('circulation')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [zone, setZone] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  // résultat rattaché à sa requête : changer de filtre n'affiche jamais l'ancienne liste
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  // les zones et les compteurs restent affichés pendant qu'un filtre se recharge
  const [lastData, setLastData] = useState<InvestorFleetResponse | null>(null)
  const requestKey = `${activeTab}|${debouncedSearch}|${zone}|${reloadKey}`

  // Recherche différée : le filtre est appliqué par le serveur.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    getInvestorFleet({ group: activeTab, search: debouncedSearch || undefined, zone: zone || undefined })
      .then((res) => {
        if (cancelled) return
        setLoaded({ key: requestKey, data: res, error: null })
        setLastData(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key: requestKey, data: null, error: err instanceof Error ? err.message : 'Impossible de charger votre parc.' })
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, debouncedSearch, zone, requestKey])

  const current = loaded && loaded.key === requestKey ? loaded : null
  const loading = current === null
  const display = current?.data ?? lastData
  const motos: InvestorFleetItem[] = current?.data?.items ?? []
  const counts = useMemo(() => display?.counts ?? { total: 0, circulation: 0, maintenance: 0 }, [display])
  const zones = display?.zones ?? []
  const filtered = activeTab !== 'circulation' || debouncedSearch !== '' || zone !== ''

  const tabDefs: TabDef[] = useMemo(
    () => [
      { key: 'all', label: 'VÉHICULES TOTAL', count: counts.total, Icon: Filter },
      { key: 'circulation', label: 'EN CIRCULATION', count: counts.circulation, Icon: ShieldAlert },
      { key: 'maintenance', label: 'EN MAINTENANCE', count: counts.maintenance, Icon: Wrench },
    ],
    [counts],
  )

  const allStatuses = display?.overview ?? []
  const plusRecent = display?.recent ?? []

  const resetFilters = () => {
    setActiveTab('circulation')
    setSearch('')
    setDebouncedSearch('')
    setZone('')
  }

  return (
    <PortalLayout portal="investor" title="Mon parc" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
      <div className="flex-1 p-4 sm:p-6">
        <div className="@container/page space-y-5">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mon Parc Automobile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Suivi détaillé de vos investissements en circulation.</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-1 gap-3 @xl:grid-cols-3">
            {tabDefs.map((t) => {
              const active = t.key === activeTab
              return (
                <Button
                  key={t.key}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  aria-pressed={active}
                  onClick={() => setActiveTab(t.key)}
                  className="h-auto justify-between gap-3 rounded-lg px-4 py-2.5 text-left @xl:py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 @xl:block">
                    <div className="text-[11px] font-semibold uppercase tracking-widest opacity-90">{t.label}</div>
                    <div className="text-lg font-bold @xl:mt-1">{t.count.toString().padStart(2, '0')}</div>
                  </div>
                  <t.Icon className={active ? 'h-5 w-5 text-white' : 'h-5 w-5 text-primary'} />
                </Button>
              )
            })}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 gap-6 @4xl:grid-cols-3">
            {/* Left column: summaries */}
            <div className="order-2 space-y-4 @4xl:order-1 @4xl:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tous les statuts</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {allStatuses.length > 0 ? `${allStatuses.length} véhicule${allStatuses.length > 1 ? 's' : ''} sur ${counts.total}` : 'Aucun véhicule'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allStatuses.length === 0 && loading ? <Skeleton className="h-12 w-full" /> : null}
                    {allStatuses.map((m) => (
                      <SideItem key={m.id} moto={m} onOpen={setOpenId} withProgress />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plus récents</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">Parts prises ces 60 derniers jours</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plusRecent.length === 0 && !loading ? <p className="text-xs text-muted-foreground">Aucune part récente.</p> : null}
                    {plusRecent.map((m) => (
                      <SideItem key={m.id} moto={m} onOpen={setOpenId} size="sm" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="hidden @4xl:block">
                <CardHeader>
                  <CardTitle className="text-base">Zone géographique</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">Filtrer par zone</div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant={zone === '' ? 'default' : 'outline'} aria-pressed={zone === ''} onClick={() => setZone('')}>
                      Toutes
                    </Button>
                    {zones.map((z) => (
                      <Button key={z} type="button" size="sm" variant={zone === z ? 'default' : 'outline'} aria-pressed={zone === z} onClick={() => setZone(z)}>
                        {z}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: list */}
            <div className="@container order-1 min-w-0 @4xl:order-2 @4xl:col-span-2">
              <div className="mb-4 flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {activeTab === 'all' ? 'Tous les statuts' : activeTab === 'circulation' ? 'En circulation' : 'En maintenance'}
                  {current?.data ? ` · ${motos.length} véhicule${motos.length > 1 ? 's' : ''}` : ''}
                </div>
                <div className="relative min-w-0 @xl:max-w-sm @xl:flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type="search"
                    aria-label="Rechercher une plaque ou un chauffeur"
                    placeholder="Plaque, chauffeur…"
                    className="pl-10"
                  />
                </div>
              </div>

              {zones.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 @4xl/page:hidden" role="group" aria-label="Filtrer par zone">
                  <Button type="button" size="sm" variant={zone === '' ? 'default' : 'outline'} aria-pressed={zone === ''} onClick={() => setZone('')}>
                    Toutes
                  </Button>
                  {zones.map((z) => (
                    <Button key={z} type="button" size="sm" variant={zone === z ? 'default' : 'outline'} aria-pressed={zone === z} onClick={() => setZone(z)}>
                      {z}
                    </Button>
                  ))}
                </div>
              ) : null}

              {current?.error ? (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                    <span>{current.error}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                      <RefreshCw />
                      Réessayer
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : loading ? (
                <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : motos.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {counts.total === 0 && !filtered ? (
                    <>
                      Vous n&apos;avez pas encore de part dans un véhicule.{' '}
                      <Link to="/investor-market" className="font-semibold text-primary hover:underline">
                        Découvrir le marché des parts
                      </Link>
                    </>
                  ) : (
                    <>
                      <p>Aucun véhicule ne correspond à ces filtres.</p>
                      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
                  {motos.map((m) => (
                    <MotoCard key={m.id} moto={m} onOpen={setOpenId} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <InvestorMotoDetailModal motoId={openId} onClose={() => setOpenId(null)} />
    </PortalLayout>
  )
}
