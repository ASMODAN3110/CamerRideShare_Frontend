import { useEffect, useMemo, useState } from 'react'
import { Download, CheckCircle, Printer, Search } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { ParticleHover, SpotlightSection } from '../../components/MagicBento'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import InvestorSidebar from '../../components/InvestorSidebar'

type MethodCode = 'OM' | 'MTN'

type TransactionStatus = 'Orange Money' | 'Montant' | 'Confirmé'

export type Transaction = {
  id: string
  date: Date
  driverName: string
  plate: string
  amountXaf: number // Montant en XAF (positif dans ce MVP)
  method: MethodCode
  status: TransactionStatus
}

function normalizeForSearch(input: string) {
  // Insensible à la casse et aux accents
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatDateTime(d: Date) {
  // Format proche de l'existant (ex: "24 Oct, 2023 - 10:42")
  const day = d.toLocaleDateString('en-GB', { day: '2-digit' })
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  const year = d.getFullYear()
  const hh = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day} ${month}, ${year} - ${hh}`
}

function formatXafSigned(amount: number) {
  const sign = amount >= 0 ? '+' : '-'
  const abs = Math.abs(amount)
  return `${sign} ${abs.toLocaleString('fr-FR')}`
}

function methodLabel(method: MethodCode) {
  if (method === 'OM') return 'Orange Money'
  return 'MTN MoMo'
}

function statusVariant(status: TransactionStatus): 'green' | 'orange' | 'red' | 'default' {
  if (status === 'Confirmé') return 'green'
  if (status === 'Orange Money') return 'orange'
  return 'default'
}

function statusBadgeLabel(status: TransactionStatus) {
  // Dans l’image c’est ambigu; on respecte les libellés demandés.
  return status
}

function downloadCsv(filename: string, rows: string[][]) {
  const escapeCell = (cell: string) => {
    const s = cell ?? ''
    // CSV basic quoting
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  // Use ';' separator for better compatibility with FR locales
  const csv = rows.map((r) => r.map((c) => escapeCell(c)).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function mockTransactions(): Transaction[] {
  const base: Array<Omit<Transaction, 'id'>> = [
    {
      date: new Date(2024, 4, 12, 14, 30),
      driverName: 'Jean-Paul K.',
      plate: 'LT 482 AB',
      amountXaf: 45000,
      method: 'OM',
      status: 'Orange Money',
    },
    {
      date: new Date(2024, 4, 11, 9, 15),
      driverName: 'Samuel E.',
      plate: 'LT 189 CC',
      amountXaf: 48500,
      method: 'MTN',
      status: 'Confirmé',
    },
    {
      date: new Date(2024, 4, 10, 18, 5),
      driverName: 'Ahmed B.',
      plate: 'CE 881 XZ',
      amountXaf: 92000,
      method: 'OM',
      status: 'Montant',
    },
    {
      date: new Date(2024, 4, 9, 7, 45),
      driverName: 'Marc O.',
      plate: 'LT 992 ZZ',
      amountXaf: 45000,
      method: 'MTN',
      status: 'Confirmé',
    },
    {
      date: new Date(2024, 4, 8, 12, 30),
      driverName: 'Hervé T.',
      plate: 'CE 002 AB',
      amountXaf: 172000,
      method: 'OM',
      status: 'Montant',
    },
    {
      date: new Date(2024, 4, 7, 15, 10),
      driverName: 'Sophie M.',
      plate: 'LT 410 MN',
      amountXaf: 35000,
      method: 'MTN',
      status: 'Orange Money',
    },
  ]

  // Generate enough rows to test pagination + export (48 lines)
  const generated: Transaction[] = Array.from({ length: 48 }, (_, i) => {
    const pick = base[i % base.length]
    const date = new Date(pick.date)
    date.setDate(date.getDate() - i)
    date.setHours(pick.date.getHours(), pick.date.getMinutes())

    const amountJitter = (i % 7) * 5000
    return {
      id: `tx_${i + 1}`,
      date,
      driverName: pick.driverName,
      plate: pick.plate,
      amountXaf: pick.amountXaf + amountJitter,
      method: pick.method,
      status: pick.status,
    }
  })

  return generated
}

function RevenueHistoryTable(props: { rows: Transaction[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
            <TableHead className="px-5 py-3">DATE ET HEURE</TableHead>
            <TableHead className="px-5 py-3">NOM DU CHAUFFEUR</TableHead>
            <TableHead className="px-5 py-3">MATRICULE</TableHead>
            <TableHead className="px-5 py-3 text-right">MONTANT</TableHead>
            <TableHead className="px-5 py-3">MÉTHODE</TableHead>
            <TableHead className="px-5 py-3">STATUT</TableHead>
            <TableHead className="px-5 py-3 text-right">ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-transparent">
          {props.rows.map((tx) => {
            const signed = formatXafSigned(tx.amountXaf)
            const variant = statusVariant(tx.status)
            const statusBadgeVariant = variant === 'default' ? undefined : variant
            const badgeColor = statusBadgeVariant ?? 'default'

            return (
              <TableRow
                key={tx.id}
                className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
              >
                <TableCell className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDateTime(tx.date)}</TableCell>
                <TableCell className="px-5 py-3.5">
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{tx.driverName}</span>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{tx.plate}</TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-300">{signed}</span>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <span className="text-slate-600 dark:text-slate-200">{methodLabel(tx.method)}</span>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Badge variant={badgeColor as any} className="gap-1.5 px-2.5 py-1">
                    {statusBadgeLabel(tx.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  <Button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-500 opacity-80 dark:bg-slate-800/50 dark:text-slate-300"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirme
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function RevenueHistory() {
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

  const allRows = useMemo(() => mockTransactions(), [])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 3

  const filtered = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    if (!q) return allRows

    return allRows.filter((tx) => {
      const driver = normalizeForSearch(tx.driverName)
      const plate = normalizeForSearch(tx.plate)
      return driver.includes(q) || plate.includes(q)
    })
  }, [allRows, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const currentPage = Math.min(page, totalPages)

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [currentPage, filtered])

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = total === 0 ? 0 : Math.min(currentPage * pageSize, total)

  const avgPerMoto = 35000

  const onExportCsv = () => {
    const header = ['DATE ET HEURE', 'NOM DU CHAUFFEUR', 'MATRICULE', 'MONTANT', 'MÉTHODE', 'STATUT', 'ACTION']

    const rows: string[][] = filtered.map((tx) => [
      formatDateTime(tx.date),
      tx.driverName,
      tx.plate,
      `+ ${tx.amountXaf.toLocaleString('fr-FR')} XAF`,
      methodLabel(tx.method),
      statusBadgeLabel(tx.status),
      'Confirme',
    ])

    downloadCsv('revenue-history.csv', [header, ...rows])
  }

  const onPrint = () => {
    window.print()
  }

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950 p-0">
      {/* Print rules */}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Historique des Revenus</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Filtrez, exportez et imprimez votre historique (données mockées).
              </p>
            </div>
            <div className="no-print flex items-center gap-2">
              <Button type="button" onClick={onExportCsv} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200">
                <Printer className="h-4 w-4" />
                Imprimer Relevé
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl p-5">
              <CardHeader className="p-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">REVENU TOTAL DU MOIS</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">285 000 XAF</div>
              </CardContent>
            </Card></ParticleHover>

            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl p-5">
              <CardHeader className="p-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">DERNIER VERSEMENT</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">+48 500 XAF</div>
                <div className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">Tendance positive</div>
              </CardContent>
            </Card></ParticleHover>

            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl p-5">
              <CardHeader className="p-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">MOYENNE PAR MOTO</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{avgPerMoto.toLocaleString('fr-FR')} XAF</div>
              </CardContent>
            </Card></ParticleHover>
          </div>

          {/* Search & Pagination - screen only */}
          <div className="screen-only space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  type="search"
                  placeholder="Filtre par chauffeur ou plaque…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50"
                />
              </div>

              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Affichage de {rangeStart}-{rangeEnd} sur {total} transactions
              </div>
            </div>

            <ParticleHover className="rounded-2xl"><div className="relative overflow-hidden rounded-2xl"><RevenueHistoryTable rows={pageRows} /></div></ParticleHover>

            <div className="flex items-center justify-between gap-3">
              <div />
              <div className="flex items-center gap-2 no-print">
                <Button
                  type="button"
                  disabled={currentPage <= 1}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>

          {/* Print-only table (all filtered rows, not just current page) */}
          <div className="print-only">
            <ParticleHover className="rounded-2xl"><div className="relative overflow-hidden rounded-2xl"><RevenueHistoryTable rows={filtered} /></div></ParticleHover>
          </div>

          {/* Footer identity (visible in print and screen) */}
          <div className="flex items-center justify-between gap-3 pt-6">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Patron Invest – Investisseur
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 no-print">CamerRideShare</div>
          </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}

