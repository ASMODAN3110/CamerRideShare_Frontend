import { useState } from 'react'
import {
  Banknote,
  ChevronRight,
  CreditCard,
  Filter,
  Search,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = 'valide' | 'attente' | 'echec'
type PaymentMode = 'mobile' | 'especes' | 'virement'

type Transaction = {
  id: string
  chauffeur: string
  avatarUrl?: string
  avatarFallback: string
  dateHeure: string
  mode: PaymentMode
  montant: string
  montantNegatif?: boolean
  status: PaymentStatus
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockTransactions: Transaction[] = [
  {
    id: 't1',
    chauffeur: 'Emmanuel K.',
    avatarUrl: 'https://i.pravatar.cc/100?img=1',
    avatarFallback: 'EK',
    dateHeure: '24 Oct, 2023 - 14:42',
    mode: 'mobile',
    montant: '+ 15,000 XAF',
    status: 'valide',
  },
  {
    id: 't2',
    chauffeur: 'Sarah M.',
    avatarUrl: 'https://i.pravatar.cc/100?img=2',
    avatarFallback: 'SM',
    dateHeure: '24 Oct, 2023 - 10:15',
    mode: 'mobile',
    montant: '+ 15,000 XAF',
    status: 'attente',
  },
  {
    id: 't3',
    chauffeur: 'Jean-Paul N.',
    avatarFallback: 'JN',
    dateHeure: '23 Oct, 2023 - 18:30',
    mode: 'virement',
    montant: '+ 25,000 XAF',
    status: 'valide',
  },
  {
    id: 't4',
    chauffeur: 'Alain B.',
    avatarFallback: 'AB',
    dateHeure: '23 Oct, 2023 - 09:12',
    mode: 'especes',
    montant: '+ 15,000 XAF',
    montantNegatif: true,
    status: 'echec',
  },
]

// ─── Config statuts ───────────────────────────────────────────────────────────

const statusConfig: Record<PaymentStatus, { label: string; variant: 'green' | 'orange' | 'red'; dot: string }> = {
  valide:  { label: 'Validé',     variant: 'green',  dot: 'bg-emerald-500' },
  attente: { label: 'En attente', variant: 'orange', dot: 'bg-orange-500'  },
  echec:   { label: 'Échec',      variant: 'red',    dot: 'bg-red-500'     },
}

// ─── Config mode paiement ─────────────────────────────────────────────────────

function ModeIcon({ mode }: { mode: PaymentMode }) {
  if (mode === 'mobile')
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        <Smartphone className="h-4 w-4" />
      </span>
    )
  if (mode === 'especes')
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Banknote className="h-4 w-4" />
      </span>
    )
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
      <CreditCard className="h-4 w-4" />
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard(props: {
  label: string
  value: string
  sub?: string
  iconBg: string
  iconColor: string
  Icon: React.ElementType
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
          {sub && <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── PaiementsPage ────────────────────────────────────────────────────────────

type PaiementsPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function PaiementsPage({ theme, onToggleTheme }: PaiementsPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')

  const filteredTx = mockTransactions.filter((t) => {
    const matchSearch =
      search.trim() === '' ||
      t.chauffeur.toLowerCase().includes(search.toLowerCase()) ||
      t.montant.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'tous' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Gestion des Paiements</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Suivi et administration des flux financiers.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Wallet className="h-4 w-4" />
              Saisir un Paiement
            </button>
          </div>

          {/* ── Stat cards ── */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Collecté (Mois)"
              value="4.2M"
              sub="XAF"
              Icon={TrendingUp}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-300"
            />
            <StatCard
              label="Paiements en Attente"
              value="12"
              Icon={Wallet}
              iconBg="bg-orange-50 dark:bg-orange-950/40"
              iconColor="text-orange-600 dark:text-orange-300"
            />
            <StatCard
              label="Taux de Recouvrement"
              value="92%"
              Icon={TrendingUp}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-300"
            />
          </div>

          {/* ── Main Card : Historique ── */}
          <Card>
            <CardHeader className="p-5 pb-4">
              <CardTitle className="text-base">Historique des Transactions</CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un chauffeur ou un montant..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="valide">Validé</option>
                  <option value="attente">En attente</option>
                  <option value="echec">Échec</option>
                </select>

                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Filtres avancés"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                <table className="min-w-full text-sm">
                  {/* Head */}
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
                      {['Chauffeur', 'Date / Heure', 'Mode', 'Montant', 'Statut', 'Action'].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-transparent">
                    {filteredTx.length > 0 ? (
                      filteredTx.map((tx) => {
                        const { label, variant, dot } = statusConfig[tx.status]
                        return (
                          <tr
                            key={tx.id}
                            className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
                          >
                            {/* Chauffeur */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 shrink-0">
                                  {tx.avatarUrl ? (
                                    <AvatarImage
                                      src={tx.avatarUrl}
                                      alt={tx.chauffeur}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <AvatarFallback>{tx.avatarFallback}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="font-semibold text-slate-900 dark:text-slate-50">
                                  {tx.chauffeur}
                                </span>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{tx.dateHeure}</td>

                            {/* Mode */}
                            <td className="px-5 py-3.5">
                              <ModeIcon mode={tx.mode} />
                            </td>

                            {/* Montant */}
                            <td className="px-5 py-3.5">
                              <span
                                className={[
                                  'font-bold',
                                  tx.montantNegatif
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-900 dark:text-slate-50',
                                ].join(' ')}
                              >
                                {tx.montant}
                              </span>
                            </td>

                            {/* Statut */}
                            <td className="px-5 py-3.5">
                              <Badge variant={variant} className="gap-1.5 px-2.5 py-1">
                                <span className={['h-2 w-2 rounded-full', dot].join(' ')} />
                                {label}
                              </Badge>
                            </td>

                            {/* Action */}
                            <td className="px-5 py-3.5">
                              <button
                                type="button"
                                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                              >
                                Détails
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Search className="h-7 w-7" />
                            <p className="text-sm font-semibold">Aucune transaction trouvée</p>
                            <p className="text-xs">Modifiez vos critères de recherche.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Affichage de{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">1</span> à{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredTx.length}</span> sur{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">158</span> transactions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 transition dark:border-slate-700 dark:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
