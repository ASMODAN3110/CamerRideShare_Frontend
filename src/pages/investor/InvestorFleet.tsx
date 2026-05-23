import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Filter, Search, ShieldAlert, Wrench } from 'lucide-react'

import InvestorSidebar from '../../components/InvestorSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { EffectCard, SpotlightSection } from '../../components/MagicBento'

type MotoStatus = 'actif' | 'panne' | 'indisponible'

type Moto = {
  id: string
  chauffeur: string
  plaque: string
  status: MotoStatus
  semaineAcquise: number
  semaineTotal: number
  revenuMois: number // XAF
  avatarUrl?: string
  avatarFallback: string
  zone?: string
  isRecent?: boolean
}

type TabKey = 'all' | 'circulation' | 'maintenance'

type TabDef = {
  key: TabKey
  label: string
  count: number
  Icon: LucideIcon
}

function formatXaf(value: number) {
  return value.toLocaleString('fr-FR')
}

function statusPillClasses(status: MotoStatus) {
  if (status === 'actif') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
  if (status === 'panne') return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
}

function statusProgressClasses(status: MotoStatus) {
  if (status === 'actif') return 'bg-emerald-600'
  if (status === 'panne') return 'bg-orange-500'
  return 'bg-slate-400'
}

function MotoProgress({ status, value }: { status: MotoStatus; value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/50">
      <div className={`h-full ${statusProgressClasses(status)}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

function MotoCard({ moto }: { moto: Moto }) {
  const progressPct = Math.round((moto.semaineAcquise / moto.semaineTotal) * 100)
  const statusVariant: 'actif' | 'panne' | 'indisponible' = moto.status
  const label = statusVariant === 'actif' ? 'Actif' : statusVariant === 'panne' ? 'En panne' : 'Indisponible'

  const statusIcon =
    moto.status === 'actif' ? <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" /> : moto.status === 'panne' ? <Wrench className="h-3.5 w-3.5 text-orange-600" /> : null

  return (
    <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {moto.avatarUrl ? (
                <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback>{moto.avatarFallback}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{moto.chauffeur}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{`Plaque: ${moto.plaque}`}</div>
            </div>
          </div>

          <Badge variant={moto.status === 'actif' ? 'green' : moto.status === 'panne' ? 'orange' : 'default'} className="shrink-0">
            <span className="mr-1 inline-flex align-middle">{statusIcon}</span>
            {label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500">{`Semaine ${moto.semaineAcquise} / ${moto.semaineTotal}`}</div>
            <div className="text-xs font-semibold text-slate-500">{progressPct}%</div>
          </div>

          {/* Bar custom pour matcher le code couleur de l'image */}
          <MotoProgress status={moto.status} value={progressPct} />

          <div className="pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Remboursement</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{moto.zone ? `Zone: ${moto.zone}` : 'Calendrier de Remboursement'}</div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revenu du mois</div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-50">{`XAF ${formatXaf(moto.revenuMois)}`}</div>
            </div>
            <div className="flex-none text-slate-500">
              <ChevronRight className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InvestorFleet() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const motos = useMemo<Moto[]>(
    () => [
      {
        id: 'm1',
        chauffeur: 'Jean-Paul K.',
        plaque: 'LT 402 AB',
        status: 'actif',
        semaineAcquise: 12,
        semaineTotal: 32,
        revenuMois: 185000,
        avatarUrl: 'https://i.pravatar.cc/100?img=10',
        avatarFallback: 'JP',
        zone: 'Douala',
      },
      {
        id: 'm2',
        chauffeur: 'Ahmed B.',
        plaque: 'CE 881 XZ',
        status: 'panne',
        semaineAcquise: 8,
        semaineTotal: 32,
        revenuMois: 92000,
        avatarUrl: 'https://i.pravatar.cc/100?img=11',
        avatarFallback: 'AB',
        zone: 'Yaoundé',
        isRecent: true,
      },
      {
        id: 'm3',
        chauffeur: 'Samuel E.',
        plaque: 'LT 109 CC',
        status: 'actif',
        semaineAcquise: 24,
        semaineTotal: 32,
        revenuMois: 210500,
        avatarUrl: 'https://i.pravatar.cc/100?img=12',
        avatarFallback: 'SE',
        zone: 'Bafoussam',
      },
      {
        id: 'm4',
        chauffeur: 'Marc O.',
        plaque: 'LT 992 ZZ',
        status: 'actif',
        semaineAcquise: 20,
        semaineTotal: 32,
        revenuMois: 45000,
        avatarUrl: 'https://i.pravatar.cc/100?img=13',
        avatarFallback: 'MO',
        zone: 'Douala',
        isRecent: true,
      },
      {
        id: 'm5',
        chauffeur: 'Hervé T.',
        plaque: 'CE 002 AB',
        status: 'actif',
        semaineAcquise: 30,
        semaineTotal: 32,
        revenuMois: 172000,
        avatarUrl: 'https://i.pravatar.cc/100?img=14',
        avatarFallback: 'HT',
        zone: 'Yaoundé',
      },
      {
        id: 'm6',
        chauffeur: 'Sophie M.',
        plaque: 'LT 410 MN',
        status: 'panne',
        semaineAcquise: 14,
        semaineTotal: 32,
        revenuMois: 35000,
        avatarUrl: 'https://i.pravatar.cc/100?img=15',
        avatarFallback: 'SM',
        zone: 'Bafoussam',
      },
    ],
    [],
  )

  const counts = useMemo(() => {
    const total = motos.length
    const circulation = motos.filter((m) => m.status === 'actif').length
    const maintenance = motos.filter((m) => m.status === 'panne' || m.status === 'indisponible').length
    return { total, circulation, maintenance }
  }, [motos])

  const [activeTab, setActiveTab] = useState<TabKey>('circulation')

  const filteredMotos = useMemo(() => {
    if (activeTab === 'all') return motos
    if (activeTab === 'circulation') return motos.filter((m) => m.status === 'actif')
    return motos.filter((m) => m.status === 'panne' || m.status === 'indisponible')
  }, [activeTab, motos])

  const [search, setSearch] = useState('')
  const searchedMotos = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return filteredMotos
    return filteredMotos.filter((m) => m.plaque.toLowerCase().includes(q) || m.chauffeur.toLowerCase().includes(q))
  }, [filteredMotos, search])

  const tabDefs: TabDef[] = useMemo(() => {
    // Icônes légères : on garde la cohérence UI (pas besoin d'exact mapping)
    return [
      { key: 'all', label: 'MOTOS TOTAL', count: counts.total, Icon: Filter },
      { key: 'circulation', label: 'EN CIRCULATION', count: counts.circulation, Icon: ShieldAlert },
      { key: 'maintenance', label: 'EN MAINTENANCE', count: counts.maintenance, Icon: Wrench },
    ]
  }, [counts])

  const allStatuses = motos.slice(0, 3)
  const plusRecent = motos.filter((m) => m.isRecent).slice(0, 2)
  const byZone = motos.slice(3, 5)

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <InvestorSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} onToggleTheme={onToggleTheme} />

        <main className="flex-1 p-6">
          <div className="space-y-5">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Mon Parc Automobile</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Suivi détaillé de vos investissements en circulation.</p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tabDefs.map((t) => {
                const active = t.key === activeTab
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={[
                      'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800/60',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-widest opacity-90">{t.label}</div>
                      <div className="mt-1 text-lg font-bold">{t.count.toString().padStart(2, '0')}</div>
                    </div>
                    <t.Icon className={active ? 'h-5 w-5 text-white' : 'h-5 w-5 text-blue-600 dark:text-blue-300'} />
                  </button>
                )
              })}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column: summaries */}
              <div className="space-y-4 lg:col-span-1">
                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Tous les statuts</CardTitle>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">2-3 motos sélectionnées</div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {allStatuses.map((m) => {
                        const pct = Math.round((m.semaineAcquise / m.semaineTotal) * 100)
                        return (
                          <div key={m.id} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.chauffeur} /> : <AvatarFallback>{m.avatarFallback}</AvatarFallback>}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{m.chauffeur}</div>
                              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{m.plaque}</div>
                              <MotoProgress status={m.status} value={pct} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card></EffectCard>

                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Plus récents</CardTitle>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Dernières mises à jour</div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {plusRecent.map((m) => (
                        <div key={m.id} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.chauffeur} /> : <AvatarFallback>{m.avatarFallback}</AvatarFallback>}
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{m.chauffeur}</div>
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{m.plaque}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card></EffectCard>

                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Zone géographique</CardTitle>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Par zones</div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {byZone.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{m.chauffeur}</div>
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{m.zone}</div>
                          </div>
                          <div className={['shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', statusPillClasses(m.status)].join(' ')}>
                            {m.status === 'actif' ? 'Actif' : m.status === 'panne' ? 'En panne' : 'Indispo.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card></EffectCard>
              </div>

              {/* Right column: list */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {activeTab === 'all' ? 'Tous les statuts' : activeTab === 'circulation' ? 'En circulation' : 'En maintenance'}
                  </div>
                  <div className="relative min-w-0 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      type="search"
                      placeholder="Rechercher une plaque..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {searchedMotos.map((m) => (
                    <EffectCard key={m.id} className="rounded-2xl"><MotoCard moto={m} /></EffectCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}

