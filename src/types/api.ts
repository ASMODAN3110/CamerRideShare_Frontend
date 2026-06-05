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

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number
  driver: { fullName: string; avatarUrl: string | null }
  createdAt: string
  status: PaymentStatus
  type: PaymentType
  amount: number
}

// ─── Payment creation ─────────────────────────────────────────────────────────

export interface CreatePaymentBody {
  driverId: number
  amount: number
  type: PaymentType
}

export interface Payment {
  id: number
  driverId: number
  amount: number
  type: PaymentType
  status: PaymentStatus
  createdAt: string
}

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

// ─── Motos (select pour formulaires) ─────────────────────────────────────────

export interface Moto {
  id: number
  model: string
  city: string
  status: 'ACTIVE' | 'STOLEN' | 'BROKEN'
  financedAmount: number
  targetAmount: number
  driverId: number | null
  investorId: number | null
  driver: {
    id: number
    fullName: string
    phoneNumber: string
  } | null
  investor: {
    id: number
    fullName: string
    phoneNumber: string
  } | null
}
