import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Download,
  TrendingUp,
  Wallet,
  PiggyBank,
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

import { Button } from '../../components/ui/button'
import { ParticleHover, SpotlightSection } from '../../components/MagicBento'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import InvestorSidebar from '../../components/InvestorSidebar'

type RoiPoint = {
  semaine: string
  roiMilliers: number
}

type FlotteMoto = {
  id: string
  chauffeur: string
  plaque: string
  tag: 'Investisseur' | 'Patron Invest'
  status: 'actif' | 'panne'
  avatarUrl?: string
  avatarFallback: string
  semaineAcquise: number
  semaineTotal: number
  calendrierLabel: string
  cetteSemaineMontant: string
}

function StatCard(props: {
  title: string
  value: string
  subLabel: string
  deltaLabel?: string
  Icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{props.title}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{props.value}</div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            {props.subLabel}
            {props.deltaLabel ? <span className="ml-2 text-blue-600 dark:text-blue-300">{props.deltaLabel}</span> : null}
          </div>
        </div>
        <div className={['inline-flex h-10 w-10 items-center justify-center rounded-xl', props.iconBg, props.iconColor].join(' ')}>
          <props.Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function FlotteMotoCard({ moto }: { moto: FlotteMoto }) {
  const progressPct = Math.round((moto.semaineAcquise / moto.semaineTotal) * 100)

  return (
    <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10">
              {moto.avatarUrl ? (
                <AvatarImage src={moto.avatarUrl} alt={moto.chauffeur} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback>{moto.avatarFallback}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{moto.chauffeur}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{moto.plaque}</div>
            </div>
          </div>
          <Badge variant={moto.status === 'actif' ? 'green' : 'orange'} className="shrink-0">
            {moto.tag}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500">{`Semaine ${moto.semaineAcquise} / ${moto.semaineTotal}`}</div>
            <div className="text-xs font-semibold text-slate-500">{progressPct}%</div>
          </div>
          <Progress value={progressPct} className="h-2" aria-label={`Progression ${moto.chauffeur}`} />

          <div className="pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{moto.calendrierLabel}</div>
          <div className="flex items-start justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500">CETTE SEMAINE</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{moto.cetteSemaineMontant}</div>
          </div>
        </div>
      </CardContent>
    </Card></ParticleHover>
  )
}

export default function InvestorDashboard() {
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

  const statCards = useMemo(
    () => [
      {
        title: 'TOTAL INVESTI',
        value: 'XAF 5,000,000',
        subLabel: 'Capital Initial',
        deltaLabel: undefined,
        Icon: Wallet,
        iconBg: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: 'text-blue-600 dark:text-blue-300',
      },
      {
        title: 'TOTAL RÉCUPÉRÉ',
        value: 'XAF 1,200,000',
        subLabel: 'Montant récupéré',
        deltaLabel: '+12.5%',
        Icon: PiggyBank,
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-700 dark:text-emerald-200',
      },
      {
        title: 'SOLDE NET',
        value: 'XAF 3,800,000',
        subLabel: 'ROI Global',
        deltaLabel: '+8.3%',
        Icon: TrendingUp,
        iconBg: 'bg-slate-50 dark:bg-slate-900/40',
        iconColor: 'text-slate-700 dark:text-slate-200',
      },
    ],
    [],
  )

  const roiData = useMemo<RoiPoint[]>(
    () => [
      { semaine: 'S1', roiMilliers: 120 },
      { semaine: 'S2', roiMilliers: 135 },
      { semaine: 'S3', roiMilliers: 150 },
      { semaine: 'S4', roiMilliers: 180 },
      { semaine: 'S5', roiMilliers: 210 },
      { semaine: 'S6', roiMilliers: 250 },
      { semaine: 'S7', roiMilliers: 300 },
      { semaine: 'S8', roiMilliers: 370 },
      { semaine: 'S9', roiMilliers: 450 },
      { semaine: 'S10', roiMilliers: 550 },
      { semaine: 'S11', roiMilliers: 680 },
      { semaine: 'S12', roiMilliers: 820 },
    ],
    [],
  )

  const flotilles = useMemo<FlotteMoto[]>(
    () => [
      {
        id: 'm1',
        chauffeur: 'Jean-Paul K.',
        plaque: 'LT 402 AB',
        tag: 'Investisseur',
        status: 'actif',
        avatarUrl: 'https://i.pravatar.cc/100?img=1',
        avatarFallback: 'JP',
        semaineAcquise: 12,
        semaineTotal: 32,
        calendrierLabel: 'Calendrier de Remboursement',
        cetteSemaineMontant: 'XAF 45,000',
      },
      {
        id: 'm2',
        chauffeur: 'Ahmed B.',
        plaque: 'LT 281 BB',
        tag: 'Patron Invest',
        status: 'panne',
        avatarUrl: 'https://i.pravatar.cc/100?img=2',
        avatarFallback: 'AB',
        semaineAcquise: 9,
        semaineTotal: 32,
        calendrierLabel: 'Calendrier de Remboursement',
        cetteSemaineMontant: 'XAF 12,000',
      },
      {
        id: 'm3',
        chauffeur: 'Samuel E.',
        plaque: 'LT 109 CC',
        tag: 'Investisseur',
        status: 'actif',
        avatarUrl: 'https://i.pravatar.cc/100?img=3',
        avatarFallback: 'SE',
        semaineAcquise: 24,
        semaineTotal: 32,
        calendrierLabel: 'Calendrier de Remboursement',
        cetteSemaineMontant: 'XAF 48,500',
      },
    ],
    [],
  )

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <InvestorSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Bon retour, Patron</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Voici l&apos;état actuel de votre parc de motos aujourd&apos;hui.</p>
              </div>
              <div className="sm:pt-1">
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  <Download className="h-4 w-4" />
                  Télécharger Relevé PDF
                </Button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {statCards.map((s) => (
                <ParticleHover key={s.title} className="rounded-2xl"><StatCard {...s} /></ParticleHover>
              ))}
            </div>

            {/* ROI Chart */}
            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base">Performance des Revenus Hebdomadaires</CardTitle>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Évolution du Retour sur Investissement (ROI) sur les 12 dernières semaines
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={roiData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="semaine" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis
                        domain={[0, 1000]}
                        ticks={[0, 250, 500, 750, 1000]}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          padding: '10px',
                        }}
                        formatter={(v: unknown) => [`${typeof v === 'number' ? v : ''}k`, 'ROI']}
                        labelFormatter={(l) => `Semaine ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="roiMilliers"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card></ParticleHover>

            {/* Portfolio */}
            <div className="flex items-end justify-between gap-4">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">Votre Portefeuille de Flotte</div>
              <Button type="button" className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300">
                Voir Tout →
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {flotilles.map((m) => (
                <FlotteMotoCard key={m.id} moto={m} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}

