import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Download, Printer } from 'lucide-react'

import InvestorSidebar from '../../components/InvestorSidebar'
import { Button } from '../../components/ui/button'
import { ParticleHover, SpotlightSection } from '../../components/MagicBento'
import { Card, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

type PeriodKey = 'month' | 'quarter' | 'year' | 'custom'

type ChartPoint = {
  label: string
  revenus: number
  depenses: number
}

type RentabilityRow = {
  moto: string
  chauffeur: string
  periodeLabel: string
  revenusXaf: number
  roiPct: number
}

function formatXaf(value: number) {
  return value.toLocaleString('fr-FR')
}

function roiStatus(roiPct: number): { label: string; variant: 'green' | 'orange' } {
  if (roiPct >= 7) return { label: 'Performant', variant: 'green' }
  return { label: 'À surveiller', variant: 'orange' }
}

function normalizeToPercent(value: number, max: number) {
  if (!Number.isFinite(max) || max <= 0) return 0
  return Math.max(0, Math.min(100, (value / max) * 100))
}

function ComparisonBars({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.revenus, d.depenses)), 1)

  const revenusColor = '#2563eb' // bleu
  const depensesColor = '#ef4444' // rouge

  return (
    <div className="mt-4 w-full">
      <div className="flex h-56 items-end justify-between gap-3 px-2">
        {data.map((d) => {
          const revenusH = normalizeToPercent(d.revenus, max)
          const depensesH = normalizeToPercent(d.depenses, max)

          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <div className="flex w-full items-end justify-center gap-1.5">
                <div
                  aria-label={`Revenus ${d.label}`}
                  className="w-3 rounded-md"
                  style={{ height: `${revenuePctToHeight(revenusH)}%`, background: revenusColor }}
                />
                <div
                  aria-label={`Dépenses ${d.label}`}
                  className="w-3 rounded-md"
                  style={{ height: `${revenuePctToHeight(depensesH)}%`, background: depensesColor }}
                />
              </div>
              <div className="pb-1 text-[11px] font-semibold text-slate-500">{d.label}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: revenusColor }} />
          Revenus
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: depensesColor }} />
          Dépenses
        </span>
        <span className="ml-auto text-slate-400">Échelle: 0 → {formatXaf(max)} XAF</span>
      </div>
    </div>
  )
}

function revenuePctToHeight(pct: number) {
  // Petite marge visuelle pour éviter que la barre touche trop le haut.
  return Math.max(0, Math.min(100, pct * 0.98))
}

function buildConicGradient(parts: Array<{ value: number; color: string }>) {
  const total = parts.reduce((acc, p) => acc + p.value, 0) || 1

  return parts
    .reduce<{ acc: number; segments: string[] }>(
      (state, p) => {
        const start = (state.acc / total) * 100
        const nextAcc = state.acc + p.value
        const end = (nextAcc / total) * 100
        return {
          acc: nextAcc,
          segments: [...state.segments, `${p.color} ${start}% ${end}%`],
        }
      },
      { acc: 0, segments: [] },
    )
    .segments.join(', ')
}

function DonutChart({
  parts,
}: {
  parts: Array<{ label: string; value: number; color: string }>
}) {
  const segments = buildConicGradient(parts)

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-6">
      <div className="relative h-44 w-44">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${segments})`,
          }}
        />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-950/50" />
      </div>

      <div className="w-full sm:w-56 space-y-2">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.label}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{p.value}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breadcrumb() {
  return (
    <div className="text-xs text-slate-500 dark:text-slate-400">
      <span className="font-semibold text-slate-700 dark:text-slate-200">Accueil</span>
      <span className="mx-2">›</span>
      <span className="font-semibold">Rapports &amp; Analyses</span>
    </div>
  )
}

function PeriodFilter({
  activePeriod,
  setActivePeriod,
}: {
  activePeriod: PeriodKey
  setActivePeriod: (p: PeriodKey) => void
}) {
  const items: Array<{ key: PeriodKey; label: string }> = [
    { key: 'month', label: 'Mois' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Année' },
    { key: 'custom', label: 'Personnalisé' },
  ]

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start sm:gap-3">
      {items.map((item) => {
        const isActive = activePeriod === item.key
        return (
          <Button
            key={item.key}
            type="button"
            onClick={() => setActivePeriod(item.key)}
            className={[
              'h-9 rounded-xl px-4 text-sm font-semibold transition',
              isActive
                ? 'border border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            {item.label}
          </Button>
        )
      })}
    </div>
  )
}

function RentabilityTable({ rows }: { rows: RentabilityRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              MOTO / CHAUFFEUR
            </TableHead>
            <TableHead className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              PÉRIODE
            </TableHead>
            <TableHead className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              REVENUS (XAF)
            </TableHead>
            <TableHead className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              ROI
            </TableHead>
            <TableHead className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              STATUT
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const status = roiStatus(r.roiPct)
            return (
              <TableRow key={r.moto} className="border-b border-slate-100 dark:border-slate-800">
                <TableCell className="px-5 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{r.moto}</span>
                    <span className="text-xs font-semibold text-slate-500">{r.chauffeur}</span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {r.periodeLabel}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-50">
                  {formatXaf(r.revenusXaf)} XAF
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{r.roiPct.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Badge variant={status.variant} className="rounded-xl">
                    {status.label}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function InvestorReports() {
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

  const [activePeriod, setActivePeriod] = useState<PeriodKey>('month')

  const comparisonData = useMemo<ChartPoint[]>(
    () => [
      { label: 'Jui', revenus: 220000, depenses: 120000 },
      { label: 'Fév', revenus: 260000, depenses: 150000 },
      { label: 'Mars', revenus: 240000, depenses: 170000 },
      { label: 'Avr', revenus: 310000, depenses: 180000 },
      { label: 'Mai', revenus: 380000, depenses: 210000 },
      { label: 'Juin', revenus: 420000, depenses: 250000 },
    ],
    [],
  )

  const rentabilityRows = useMemo<RentabilityRow[]>(
    () => [
      { moto: 'LT 402', chauffeur: 'Jean-Paul K.', periodeLabel: 'Mois act.', revenusXaf: 180000, roiPct: 8.2 },
      { moto: 'LT 109 CC', chauffeur: 'Samuel E.', periodeLabel: 'Mois act.', revenusXaf: 172500, roiPct: 7.8 },
      { moto: 'CE 881 XZ', chauffeur: 'Ahmed B.', periodeLabel: 'Mois act.', revenusXaf: 48000, roiPct: 3.2 },
    ],
    [],
  )

  const costParts = useMemo(
    () => [
      { label: 'Montantes', value: 45, color: '#2563eb' },
      { label: 'Assurances', value: 30, color: '#f97316' },
      { label: 'Frais admin', value: 25, color: '#ef4444' },
    ],
    [],
  )

  const onPrint = () => window.print()

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0">
      <style>
        {`
          @media print {
            .screen-only { display: none !important; }
            .print-only { display: block !important; }
            .no-print { display: none !important; }
            body { background: white !important; }
          }
          .print-only { display: none; }
        `}
      </style>

      <div className="flex">
        <div className="no-print">
          <InvestorSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        </div>

        <main className="flex-1 p-6">
          <div className="space-y-5">
            <Breadcrumb />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  Rapports &amp; Analyses
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Consultez les performances détaillées de votre investissement.</p>
              </div>

              <div className="screen-only flex items-center gap-2">
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70"
                >
                  <Download className="h-4 w-4" />
                  Exporter PDF/Excel
                </Button>
                <Button
                  type="button"
                  onClick={onPrint}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            </div>

            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-50">Filtre de période</CardTitle>
                <div className="mt-2">
                  <PeriodFilter activePeriod={activePeriod} setActivePeriod={setActivePeriod} />
                </div>
              </CardHeader>
            </Card></ParticleHover>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Comparaison Revenus vs Dépenses */}
              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-50">Comparaison Revenus vs Dépenses</CardTitle>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Données mensuelles sur les 6 derniers mois</div>
                </CardHeader>

                <ComparisonBars data={comparisonData} />
              </Card></ParticleHover>

              {/* Prévisions */}
              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-50">Prévisions</CardTitle>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Estimation des revenus pour le mois prochain basée sur les performances historiques.
                  </div>
                </CardHeader>

                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-blue-600/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-200">ESTIMATION REVENUS</div>
                    <div className="mt-2 text-2xl font-extrabold text-blue-700 dark:text-blue-200">XAF 425 000</div>
                    <div className="mt-2 text-sm font-semibold text-blue-700/90 dark:text-blue-200/90">+/- 5% du chiffre d'affaires annuel</div>
                  </div>

                  <div className="rounded-2xl bg-emerald-600/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">ROI ESTIVAL</div>
                    <div className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-200">8.9%</div>
                    <div className="mt-2 text-sm font-semibold text-emerald-700/90 dark:text-emerald-200/90">Projection sur 30 jours</div>
                  </div>

                  <Button
                    type="button"
                    className="w-full rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900/70"
                  >
                    Analyser des scénarios
                  </Button>
                </div>
              </Card></ParticleHover>

              {/* Rentabilité par Moto */}
              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-50">Rentabilité par Moto</CardTitle>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Classement basé sur le ROI spécifique</div>
                </CardHeader>
                <RentabilityTable rows={rentabilityRows} />
              </Card></ParticleHover>

              {/* Répartition des Coûts */}
              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-50">Répartition des Coûts</CardTitle>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Visualisation des charges principales</div>
                </CardHeader>

                <div className="mt-3">
                  <DonutChart parts={costParts} />
                </div>
              </Card></ParticleHover>
            </div>

            <footer className="pt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Patron Invest – Investisseur
            </footer>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}

