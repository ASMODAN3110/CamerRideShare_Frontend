// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentType = 'PAYMENT' | 'EXPENSE'
export type PaymentStatus = 'VERIFIED' | 'PENDING'
export type AlertType = 'PAYMENT_OVERDUE' | 'INCIDENT'

// ─── Dashboard Overview ───────────────────────────────────────────────────────

export interface DashboardOverview {
  fleet: { total: number; deltaPct: number }
  activeInvestors: { count: number; deltaPct: number }
  monthlyRevenue: { amount: number; currency: 'XAF'; deltaPct: number }
  fleetStatus: { active: number; stolen: number; broken: number }
  treasuryWeekly: {
    collected: number
    target: number
    periodStart: string // YYYY-MM-DD
    periodEnd: string
  }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertPriority = 'high' | 'medium' | 'low'

export interface Alert {
  id: number
  driverName: string
  location: string
  type: AlertType
  label: string
  amount?: number
  avatarUrl?: string | null
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number
  driver: { fullName: string; avatarUrl: string | null }
  createdAt: string
  status: PaymentStatus
  type: PaymentType
  amount: number
}

export interface PaginatedTransactions {
  data: Transaction[]
  meta: PaginationMeta
}

export interface ListTransactionsParams {
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  search?: string
  status?: PaymentStatus
  type?: PaymentType
}

// ─── Payments summary & detail ────────────────────────────────────────────────

export interface PaymentsSummary {
  monthlyCollected: number
  monthlyTarget: number
  recoveryRatePct: number
  pendingCount: number
  currency: 'XAF'
  periodStart: string
  periodEnd: string
}

export interface PaymentDetailDriver {
  id: number
  fullName: string
  avatarUrl: string | null
  phoneNumber: string
}

export interface PaymentDetail {
  id: number
  driverId: number
  driver: PaymentDetailDriver
  amount: number
  type: PaymentType
  status: PaymentStatus
  createdAt: string
}

// ─── Payment creation ─────────────────────────────────────────────────────────

export interface CreatePaymentBody {
  driverId: number
  amount: number
  type: PaymentType
}

/** @deprecated use PaymentDetail */
export type Payment = PaymentDetail

// ─── Incidents ────────────────────────────────────────────────────────────────

export interface CreateIncidentBody {
  driverId: number
  motoId?: number
  type: string
  description: string
}

export interface Incident {
  id: number
  driverId: number
  motoId?: number | null
  type: string
  description: string
  status: 'OPEN' | 'CLOSED'
  createdAt: string
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export interface CreateInvitationBody {
  email: string
  role: 'INVESTOR'
}

export interface Invitation {
  id: number
  email: string
  role: 'INVESTOR'
  status: 'PENDING'
  token: string
  expiresAt: string
}

// ─── Drivers (select pour formulaires) ──────────────────────────────────────

export interface Driver {
  id: number
  email: string
  fullName: string
  role: 'DRIVER'
  phoneNumber: string
  avatarUrl: string | null
  createdAt: string
}

// ─── Fleet / Motos ────────────────────────────────────────────────────────────

export type MotoStatus = 'ACTIVE' | 'BROKEN' | 'STOLEN'

export interface FleetSummary {
  total: number
  available: number
  inMaintenance: number
  incidents: number
}

export interface MotoDriver {
  id: number
  fullName: string
  avatarUrl: string | null
  phoneNumber: string
}

export interface MotoInvestor {
  id: number
  fullName: string
}

export interface MotoListItem {
  id: number
  matricule: string
  model: string
  city: string
  status: MotoStatus
  imageUrl: string | null
  financedAmount: number
  targetAmount: number
  ownershipPct: number
  footerInfo: string | null
  driver: MotoDriver | null
  investor: MotoInvestor | null
}

export interface PaginatedMotos {
  data: MotoListItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MotoFilters {
  cities: string[]
  models: string[]
  statuses: MotoStatus[]
}

export interface MotoDetailIncident {
  id: number
  type: string
  description: string
  status: 'OPEN' | 'RESOLVED'
  createdAt: string
}

export interface MotoDetailPayment {
  id: number
  amount: number
  type: PaymentType
  status: PaymentStatus
  createdAt: string
}

export interface MotoDetail extends MotoListItem {
  lastMaintenanceAt: string | null
  openIncidents: MotoDetailIncident[]
  recentPayments: MotoDetailPayment[]
}

export interface CreateMotoPayload {
  matricule: string
  model: string
  city: string
  targetAmount: number
  driverId?: number
  investorId?: number
  imageUrl?: string
}

export interface UpdateMotoPayload extends Partial<Omit<CreateMotoPayload, 'driverId' | 'investorId'>> {
  status?: MotoStatus
  lastMaintenanceAt?: string | null
  financedAmount?: number
  driverId?: number | null
  investorId?: number | null
}

export interface DeleteMotoResponse {
  id: number
  deletedAt: string
}

/** Raw Prisma shape from GET /motos/available */
export interface MotoAvailable {
  id: number
  matricule: string
  model: string
  city: string
  status: MotoStatus
  financedAmount: number
  targetAmount: number
  imageUrl: string | null
  lastMaintenanceAt: string | null
  driverId: number | null
  investorId: number | null
  createdAt: string
  updatedAt: string
}

export interface ListMotosParams {
  page?: number
  limit?: number
  search?: string
  status?: MotoStatus
  city?: string
  model?: string
}

// ─── Admin investors page ─────────────────────────────────────────────────────

export type AdminInvestorStatus = 'ACTIVE' | 'LATE' | 'INACTIVE'

export interface TopContributor {
  id: number
  fullName: string
  avatarUrl: string | null
  recoveryRatePct: number
}

export interface InvestorsSummary {
  totalCapitalInvested: number
  activeInvestorsCount: number
  totalInvestorsCount: number
  financedMotosCount: number
  currency: 'XAF'
  topContributors: TopContributor[]
}

export interface AdminInvestorListItem {
  id: number
  fullName: string
  avatarUrl: string | null
  zone: string | null
  amountInvested: number
  amountRecovered: number
  recoveryRatePct: number
  motosCount: number
  status: AdminInvestorStatus
  joinedAt: string
}

export interface PaginatedAdminInvestors {
  data: AdminInvestorListItem[]
  meta: PaginationMeta
}

export interface ListAdminInvestorsParams {
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  search?: string
  status?: AdminInvestorStatus
}

export interface RoiTrendPoint {
  period: string
  label: string
  avgRoiPct: number
}

export interface InvestorsRoiTrend {
  points: RoiTrendPoint[]
}

// ─── Investors (select pour formulaires) ─────────────────────────────────────

export interface Investor {
  id: number
  email: string
  fullName: string
  role: 'INVESTOR'
  phoneNumber: string
  avatarUrl: string | null
  createdAt: string
}
