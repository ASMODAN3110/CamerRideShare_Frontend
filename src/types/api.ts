// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentType = 'PAYMENT' | 'EXPENSE'
export type PaymentStatus = 'VERIFIED' | 'PENDING' | 'REJECTED'
/** Les trois moyens de paiement du système (liste fixe). */
export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MONEY' | 'CASH'
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
  /** Retard de paiement : « critical » une fois le seuil critique des paramètres dépassé. */
  severity?: 'warning' | 'critical'
  /** Jours de retard, comptés depuis le lundi du retard (ce lundi = jour 1). */
  daysLate?: number
  amount?: number
  avatarUrl?: string | null
  /** Renseignés pour les alertes de type INCIDENT. */
  incidentType?: string
  description?: string
  photoUrl?: string | null
  motoMatricule?: string | null
  createdAt?: string
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
  /** Moyen de paiement ; vide pour un versement enregistré avant son introduction. */
  method: PaymentMethod | null
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
  method?: PaymentMethod
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
  method: PaymentMethod | null
  /** Preuve de paiement jointe par le chauffeur (image), le cas échéant. */
  proofUrl: string | null
  /** Motif du refus communiqué au chauffeur. */
  note: string | null
  createdAt: string
  /** Répartition du versement : reversement aux investisseurs + commission de l'admin. */
  distribution: PaymentDistribution | null
}

export interface PaymentDistribution {
  weekStatus: 'PAID' | 'PARTIAL' | null
  /** Clause Rahim : le versement ne couvrait pas le dû des investisseurs → 100 % pour eux. */
  rahimApplied: boolean
  investors: Array<{ investorId: number | null; fullName: string; amount: number }>
  commission: number
}

// ─── Payment creation ─────────────────────────────────────────────────────────

export interface CreatePaymentBody {
  driverId: number
  amount: number
  type: PaymentType
  method: PaymentMethod
  motoId?: number
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
  role: 'INVESTOR' | 'DRIVER'
}

export interface Invitation {
  id: number
  email: string
  role: 'INVESTOR' | 'DRIVER'
  status: 'PENDING'
  token: string
  expiresAt: string
  emailSent: boolean
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
  /** Moto active en cours de paiement à laquelle le chauffeur est rattaché. */
  activeMoto: DriverActiveMoto | null
}

export interface DriverActiveMoto {
  id: number
  matricule: string
  city: string
  targetAmount: number
  financedAmount: number
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

/** Une part d'une moto : l'apport d'un investisseur (minimum 50 000 XAF). Un investisseur peut en avoir plusieurs. */
/** Motif de résiliation d'un contrat (conducteur ou investisseur). */
export type TerminationReason = 'BREACH' | 'VEHICLE_ISSUE' | 'MUTUAL' | 'LOSS' | 'OTHER'

export interface MotoInvestor {
  /** Identifiant de la part. */
  id: number
  investorId: number
  fullName: string
  amount: number
  /** Part du prix d'achat financée par cet apport. */
  pct: number
  createdAt: string
  /** Part résiliée : elle ne reçoit plus de versements. */
  closedAt: string | null
  closeReason: TerminationReason | null
  /** Capital libéré par la résiliation (remboursé ou réaffecté) : il ne compte plus comme financé. */
  releasedAmount: number
}

export interface DriverTerminationResult {
  id: number
  motoId: number
  matricule: string
  driver: { id: number; fullName: string }
  terminatedAt: string
  reason: TerminationReason
  paidAmount: number
  lateWeeks: number
  arrearsAmount: number
  /** Reste à financer sur le véhicule : la tournée du prochain conducteur. */
  remainingAmount: number
}

/** Un conducteur dont le contrat a été résilié sur un véhicule. */
export interface DriverTerminationRow {
  id: number
  driver: { id: number; fullName: string }
  startedAt: string | null
  terminatedAt: string
  reason: TerminationReason
  note: string | null
  paidAmount: number
  lateWeeks: number
  arrearsAmount: number
  remainingAmount: number
}

export interface InvestorTerminationResult {
  id: number
  motoId: number
  investor: { id: number; fullName: string }
  amount: number
  closedAt: string
  reason: TerminationReason
  receivedAtClose: number
  refundedAmount: number
  transferredAmount: number
  /** Nouvelle part créée sur un autre véhicule quand l'admin a réaffecté le capital. */
  transfer: { investmentId: number; motoId: number; matricule: string; amount: number } | null
  /** Capital non récupéré, classé en perte quand le véhicule est perdu. */
  loss: number
}

/** Ce que l'admin doit savoir avant de résilier une part. */
export interface InvestorTerminationPreview {
  id: number
  matricule: string
  investor: { id: number; fullName: string }
  amount: number
  received: number
  /** Capital non récupéré : proposé par défaut comme remboursement ou réaffectation, mais libre. */
  unrecovered: number
  closedAt: string | null
}

/** Options libres de l'admin à la résiliation d'une part. */
export interface InvestorTerminationOptions {
  reason: TerminationReason
  note?: string
  /** Capital rendu à l'investisseur ; 0 ou absent : aucun remboursement. */
  refundAmount?: number
  /** Réaffectation du capital à un autre véhicule (nouvelle part). */
  transfer?: { motoId: number; amount: number }
}

/** Une créance : ce qu'un conducteur résilié devait encore au moment de la résiliation. */
export interface Receivable {
  id: number
  driver: { id: number; fullName: string; avatarUrl: string | null }
  moto: { id: number; matricule: string }
  terminatedAt: string
  lateWeeks: number
  arrearsAmount: number
  repaidAmount: number
  writtenOffAmount: number
  outstandingAmount: number
  status: 'OPEN' | 'CLOSED'
  entries: Array<{ kind: 'REPAYMENT' | 'WRITE_OFF'; amount: number; note: string | null; createdAt: string }>
}

export interface ReceivablesResponse {
  data: Receivable[]
  total: number
  page: number
  limit: number
  summary: { open: number; outstandingAmount: number; repaidAmount: number; writtenOffAmount: number }
}

export interface DriverReceivables {
  driverId: number
  outstandingAmount: number
  items: Array<{ id: number; matricule: string; outstandingAmount: number; terminatedAt: string }>
}

export interface ClassifyLossResult {
  motoId: number
  driverTerminated: boolean
  partsClosed: number
  lossTotal: number
}

export interface MotoPartInput {
  /** Identifiant de la part existante ; absent pour une nouvelle part. */
  id?: number
  investorId: number
  amount: number
}

/** La plateforme gère des motos et des taxis. */
export type VehicleType = 'MOTO' | 'TAXI'

export interface MotoListItem {
  id: number
  matricule: string
  city: string
  status: MotoStatus
  vehicleType: VehicleType
  brand: string | null
  model: string | null
  year: number | null
  imageUrl: string | null
  financedAmount: number
  targetAmount: number
  /** Versement hebdomadaire du chauffeur, fixé par l'admin. */
  weeklyAmount: number
  ownershipPct: number
  footerInfo: string | null
  driver: MotoDriver | null
  purchasePrice: number
  /** Capital déjà financé par les parts des investisseurs. */
  fundedAmount: number
  /** Capital qu'il reste à financer. */
  availableAmount: number
  /** Calendrier glissant : semaines ajoutées au contrat suite à des versements partiels. */
  extraWeeks: number
  /** Durée de base du contrat, déduite de la cible et du versement hebdomadaire. */
  baseWeeks: number
  plannedWeeks: number
  investors: MotoInvestor[]
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
  drivers: Array<{ id: number; fullName: string }>
  statuses: MotoStatus[]
  vehicleTypes: VehicleType[]
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
  city: string
  vehicleType?: VehicleType
  brand?: string
  model?: string
  year?: number
  targetAmount: number
  /** Versement hebdomadaire ; la durée du contrat en est déduite. Par défaut : cible ÷ 32. */
  weeklyAmount?: number
  driverId?: number
  investors?: MotoPartInput[]
  imageUrl?: string | null
}

export interface UpdateMotoPayload extends Partial<Omit<CreateMotoPayload, 'driverId'>> {
  status?: MotoStatus
  lastMaintenanceAt?: string | null
  financedAmount?: number
  driverId?: number | null
}

export interface DeleteMotoResponse {
  id: number
  deletedAt: string
}

/** Raw Prisma shape from GET /motos/available */
export interface MotoAvailable {
  id: number
  matricule: string
  city: string
  status: MotoStatus
  financedAmount: number
  targetAmount: number
  imageUrl: string | null
  lastMaintenanceAt: string | null
  driverId: number | null
  createdAt: string
  updatedAt: string
}

export interface ListMotosParams {
  page?: number
  limit?: number
  search?: string
  status?: MotoStatus
  city?: string
  vehicleType?: VehicleType
  /** Identifiant du chauffeur, ou « none » pour les véhicules sans chauffeur. */
  driver?: string
}

// ─── Admin investors page ─────────────────────────────────────────────────────

export type AdminInvestorStatus = 'ACTIVE' | 'INACTIVE'

/** GET /admin/investors/:id : profil complet d'un investisseur. */
export interface AdminInvestorProfile {
  id: number
  fullName: string
  email: string | null
  phoneNumber: string
  avatarUrl: string | null
  joinedAt: string
  payoutFrequency: PayoutFrequency
  status: AdminInvestorStatus
  summary: {
    amountInvested: number
    /** Retour contractuel : 160 % de la mise. */
    expectedReturn: number
    amountReceived: number
    amountPaidOut: number
    /** Perçu mais pas encore reversé à l'investisseur. */
    amountToPayOut: number
    recoveryRatePct: number
    motosCount: number
    partsCount: number
  }
  /** Une ligne par part : un investisseur peut en avoir plusieurs sur la même moto. */
  parts: Array<{
    id: number
    motoId: number
    matricule: string
    city: string
    status: MotoStatus
    driverName: string | null
    sharePct: number
    invested: number
    expectedReturn: number
    received: number
    recoveryRatePct: number
    catchUpTotal: number
    motoProgressPct: number
    contractWeeks: number
    enteredAt: string
    closedAt: string | null
    closeReason: TerminationReason | null
    /** Capital non récupéré si le véhicule est perdu. */
    loss: number
    refundedAmount: number
    transferredAmount: number
    transferredToMatricule: string | null
  }>
  recentPayouts: Array<{ id: number; amount: number; frequency: PayoutFrequency; paidAt: string }>
  payoutsCount: number
}

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

// ─── Driver dashboard ─────────────────────────────────────────────────────

export interface DriverProgress {
  proprietePct: number
  resteAPayer: number
  /** Jours restants avant le lundi qui rend le versement de la semaine en retard. */
  prochainPaiementJours: number
  estAJour: boolean
  /** Semaines de versements manquantes (le retard commence le lundi suivant la semaine due). */
  retardSemaines: number
  retardMontant: number
  /** Semaines de retard enregistrées (même régularisées) : elles s'ajoutent à la fin du calendrier. */
  semainesAjoutees: number
}

export interface DriverPayment {
  id: string
  libelle: string
  date: string
  montant: number
  paye: boolean
}

export interface CreateReportBody {
  description: string
}

export interface ReportResponse {
  id: number
  status: 'OPEN'
  /** true : photo enregistrée ; false : le stockage a échoué (le signalement est parti sans photo) ; null : aucune photo jointe. */
  photoSaved: boolean | null
}

// ─── Paramètres de l'espace conducteur ───────────────────────────────────────

export interface DriverNotificationPrefs {
  /** Suivi de ses paiements : enregistré, validé, refusé ou remis en attente. */
  paymentAlerts: boolean
  /** Rappel du vendredi quand le versement de la semaine n'est pas réglé. */
  paymentReminders: boolean
}

export interface DriverSettingsResponse {
  profile: {
    id: number
    fullName: string
    email: string | null
    phoneNumber: string
    avatarUrl: string | null
    memberSince: string
    /** Date du dernier changement de mot de passe par le conducteur ; null s'il ne l'a jamais changé. */
    passwordChangedAt: string | null
  }
  notifications: DriverNotificationPrefs
  /** Véhicule actuellement affecté au conducteur ; null s'il n'en a pas. */
  vehicle: { matricule: string; vehicleType: VehicleType; brand: string | null; model: string | null; assignedAt: string | null } | null
}

/** Coordonnées du support, définies par l'administrateur (vides tant qu'elles ne sont pas renseignées). */
export interface SupportConfig {
  phone: string
  /** Numéro WhatsApp sans espaces ni « + », prêt pour wa.me. */
  whatsapp: string
  whatsappDisplay: string
  hours: string
}

/** Un signalement du conducteur et son état de traitement. */
export interface DriverReport {
  id: number
  categorie: string
  description: string
  photoUrl: string | null
  status: 'OPEN' | 'RESOLVED'
  vehicle: string | null
  createdAt: string
  resolvedAt: string | null
}

// ─── Driver payments ─────────────────────────────────────────────────────

export interface PaymentSummary {
  totalPaye: number
  totalDu: number
  /** Versement hebdomadaire attendu pour la moto du chauffeur. */
  weeklyAmount: number | null
  resteAPayer: number
  /** Versements déclarés et pas encore validés : ils ne comptent pas encore dans le total payé. */
  enAttente: { count: number; amount: number }
  /** Un véhicule actif non soldé est affecté au conducteur : il peut déclarer un versement. */
  canDeclare: boolean
  dernierVersement: {
    montant: number
    date: string
  } | null
}

/** Filtre de statut de l'historique des versements du conducteur. */
export type DriverPaymentFilter = 'VERIFIED' | 'PENDING' | 'REJECTED'

export interface DriverPaymentRow {
  id: string
  date: string
  type: 'PAYMENT' | 'EXPENSE'
  method: PaymentMethod | null
  /** Hebdomadaire, partiel, exceptionnel ou dépense. */
  libelle: string
  montant: number
  status: 'Validé' | 'En attente' | 'Refusé'
  /** Preuve de paiement jointe (image), le cas échéant. */
  proofUrl: string | null
  note: string | null
}

export interface DeclarePaymentResponse {
  id: number
  status: string
  proofSaved: boolean | null
}

export interface PaginatedDriverPayments {
  data: DriverPaymentRow[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─── Driver support ─────────────────────────────────────────────────────

export type ReportCategorie = 'Panne mécanique' | 'Accident' | 'Retard de paiement' | 'Autre'

export interface FaqItem {
  id: number
  question: string
  answer: string
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'INCIDENT' | 'PAYMENT' | 'MOTO' | 'ACCOUNT'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface NotificationsResponse {
  unreadCount: number
  items: AppNotification[]
}

// ─── Espace investisseur ─────────────────────────────────────────────────────

export type InvestorMotoStatus = 'actif' | 'panne' | 'indisponible'
export type InvestorFleetGroup = 'all' | 'circulation' | 'maintenance'

export interface InvestorFleetItem {
  id: string
  chauffeur: string
  plaque: string
  status: InvestorMotoStatus
  semaineAcquise: number
  semaineTotal: number
  revenuMois: number
  avatarUrl: string | null
  avatarFallback: string
  zone: string
  vehicleType: VehicleType
  brand: string | null
  model: string | null
  isRecent: boolean
  parts: number
  /** Une ligne par part : chacune a son contrat téléchargeable. */
  partList: Array<{ id: number; amount: number; createdAt: string; closedAt: string | null; closeReason: TerminationReason | null; loss: number; refundedAmount: number; transferredAmount: number }>
  investi: number
  retourAttendu: number
  parSemaine: number
}

export interface InvestorFleetResponse {
  counts: { total: number; circulation: number; maintenance: number }
  zones: string[]
  items: InvestorFleetItem[]
  /** Quelques motos de la liste filtrée pour l'encart « Tous les statuts ». */
  overview: InvestorFleetItem[]
  /** Motos récentes de la liste filtrée pour l'encart « Plus récents ». */
  recent: InvestorFleetItem[]
}

/** Tableau de bord de l'investisseur : synthèse et sommes perçues semaine par semaine. */
export interface InvestorDashboardResponse {
  summary: {
    invested: number
    received: number
    /** Retour attendu : 160 % pour une part en cours, ce qui a été perçu pour une part résiliée. */
    expected: number
    recoveryPct: number
    /** Perçu moins investi : négatif tant que le capital n'est pas récupéré. */
    net: number
    roiPct: number
    /** Capital non récupéré des parts classées en perte. */
    loss: number
    partsCount: number
    openPartsCount: number
    motosCount: number
  }
  weekly: Array<{ weekStart: string; amount: number; cumulative: number }>
  /** Véhicules à surveiller (panne, indisponible, retard du conducteur, sans conducteur), les plus graves d'abord. */
  attention: DashboardAttention[]
}

export type DashboardAttentionKind = 'LATE' | 'NO_DRIVER' | 'BROKEN' | 'UNAVAILABLE'

export interface DashboardAttention {
  motoId: number
  plate: string
  kind: DashboardAttentionKind
  lateWeeks: number
  lateAmount: number
}

/** Périodes de la courbe du tableau de bord, en semaines : 1 mois, 3 mois, 6 mois, 1 an. */
export type DashboardWeeks = 4 | 12 | 26 | 52

/** Fiche d'un véhicule de l'investisseur. */
export interface InvestorFleetDetail {
  id: number
  plaque: string
  vehicleType: VehicleType
  brand: string | null
  model: string | null
  year: number | null
  zone: string
  status: InvestorMotoStatus
  imageUrl: string | null
  chauffeur: { name: string; avatarUrl: string | null } | null
  progress: { financedAmount: number; targetAmount: number; pct: number; semaineAcquise: number; semaineTotal: number; extraWeeks: number }
  /** Où en sont les versements du conducteur. */
  driverPayments: { state: 'UP_TO_DATE' | 'LATE' | 'NO_DRIVER' | 'COMPLETED'; lateWeeks: number; lateAmount: number }
  totals: { invested: number; received: number; expected: number; receivedMonth: number; weeklyShare: number }
  parts: Array<{
    id: number
    amount: number
    createdAt: string
    sharePct: number
    received: number
    expected: number
    recoveryPct: number
    catchUpTotal: number
    closedAt: string | null
    closeReason: TerminationReason | null
    loss: number
    refundedAmount: number
    transferredAmount: number
  }>
  recent: Array<{
    id: number
    date: string
    amount: number
    source: string
    catchUp: number
    rahimApplied: boolean
    settlement: boolean
    paidOutAt: string | null
  }>
  /** Nombre total de sommes perçues sur ce véhicule (la fiche en liste les plus récentes). */
  recentCount: number
}

/** Situation d'un véhicule dans le rapport : performant, à surveiller (conducteur en retard), à l'arrêt, ou contrat résilié. */
export type VehicleStanding = 'PERFORMING' | 'WATCH' | 'STOPPED' | 'CLOSED'

export type ForecastScenarioKey = 'CONTRACTUAL' | 'OBSERVED' | 'PRUDENT'

/** Rapport de performance de l'investisseur sur une période. */
export interface InvestorReport {
  period: { from: string; to: string; granularity: 'WEEK' | 'MONTH'; bounded: boolean }
  summary: {
    received: number
    previousReceived: number
    /** Écart avec la période précédente de même durée, en % ; null si elle n'a rien rapporté. */
    deltaPct: number | null
    invested: number
    investedInPeriod: number
    receivedTotal: number
    expectedTotal: number
    recoveryPct: number
    /** Revenus de la période rapportés au capital investi. */
    roiPeriodPct: number
    net: number
    loss: number
    partsCount: number
    vehiclesCount: number
  }
  series: Array<{ start: string; received: number; invested: number }>
  vehicles: Array<{
    motoId: number
    plate: string
    vehicleType: VehicleType
    driverName: string | null
    invested: number
    receivedPeriod: number
    receivedTotal: number
    expected: number
    roiPeriodPct: number
    recoveryPct: number
    sharePct: number
    standing: VehicleStanding
    lateWeeks: number
  }>
  forecast: {
    openInvested: number
    capitalToRecover: number
    scenarios: Array<{ key: ForecastScenarioKey; monthly: number; roi30Pct: number; monthsToRecover: number | null }>
    observedMonths: number
  }
}

export interface InvestorRevenueItem {
  id: string
  date: string
  driverName: string
  plate: string
  /** Véhicule concerné : ouvre sa fiche. */
  motoId: number | null
  amountXaf: number
  rahimApplied: boolean
  /** Échéance du Grand Patron : le contrat du conducteur est terminé, celui de l'investisseur continue. */
  settlement: boolean
  /** Part de la somme qui est du rattrapage (entrée en cours de contrat). */
  catchUpXaf: number
  paidOutAt: string | null
}

/** Synthèse des revenus, calculée sur tout l'historique (indépendante des filtres de la liste). */
export interface InvestorRevenueSummary {
  monthAmount: number
  previousMonthAmount: number
  /** Écart avec le mois précédent, en % ; null s'il n'y a rien eu le mois précédent. */
  trendPct: number | null
  monthVehicles: number
  avgPerVehicle: number
  last: { amount: number; date: string; plate: string } | null
  totalAmount: number
  count: number
}

export interface InvestorRevenuesResponse {
  items: InvestorRevenueItem[]
  /** `totalAmount` : somme de toutes les lignes correspondant aux filtres, pas seulement de la page. */
  meta: PaginationMeta & { totalAmount: number }
  summary: InvestorRevenueSummary
}

// ─── Demandes de parts ───────────────────────────────────────────────────────

export type ShareRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

/** Entrée d'un investisseur en cours de contrat : plafond de 50 % du reste à produire et rattrapage des semaines passées. */
export interface LateEntry {
  isLate: boolean
  weeksElapsed: number
  collected: number
  remaining: number
  cap: number
  returnAmount: number
  allowed: boolean
  maxInvestment: number
  arrears: number
  spreadWeeks: number
  perWeek: number
}

export interface ShareRequestItem {
  id: number
  status: ShareRequestStatus
  /** Montant de l'apport demandé. */
  amount: number
  note: string | null
  createdAt: string
  resolvedAt: string | null
  lateEntry: LateEntry | null
  investor: { id: number; fullName: string }
  moto: {
    id: number
    matricule: string
    city: string
    /** Capital qu'il reste à financer sur la moto. */
    availableAmount: number | null
  }
}

export interface ShareRequestsResponse {
  pendingCount: number
  items: ShareRequestItem[]
  meta: PaginationMeta
}

export interface MarketplaceItem {
  id: number
  matricule: string
  vehicleType: VehicleType
  brand: string | null
  model: string | null
  city: string
  imageUrl: string | null
  targetAmount: number
  purchasePrice: number
  /** Versement hebdomadaire du chauffeur : sert à calculer le revenu hebdomadaire d'un apport. */
  weeklyAmount: number
  /** Durée du contrat de la moto, en semaines. */
  weeks: number
  /** Capital qu'il reste à financer. */
  availableAmount: number
  /** Apport maximal souscriptible (plafonné quand la moto est déjà en cours de contrat). */
  maxAmount: number
  weeksElapsed: number
  remainingToProduce: number
  /** Avancement du remboursement du véhicule par son conducteur. */
  progressPct: number
  /** Versements du conducteur : sans conducteur, en retard, ou à jour. */
  driverState: 'UP_TO_DATE' | 'LATE' | 'NO_DRIVER'
  driverLateWeeks: number
  /** Total déjà investi par l'investisseur sur cette moto, et nombre de ses parts. */
  myInvested: number
  myParts: number
  pendingRequest: { id: number; amount: number } | null
}

/** Tri de la liste : ajoutés récemment, plus de capital à financer, plus avancés. */
export type MarketplaceSort = 'recent' | 'available' | 'progress'

export interface MarketplaceResponse {
  zones: string[]
  rules: { returnPct: number; minInvestment: number }
  items: MarketplaceItem[]
}

// ─── Reversements aux investisseurs ──────────────────────────────────────────

export type PayoutFrequency = 'WEEKLY' | 'MONTHLY'

export interface PayoutInvestorItem {
  id: number
  fullName: string
  frequency: PayoutFrequency
  /** Gains des périodes terminées, exigibles. */
  dueNow: number
  /** Début du retard de l'admin (lundi de la semaine suivante pour un versement hebdomadaire) ; null si rien n'est dû. */
  lateSince: string | null
  /** Gains de la période en cours (pas encore exigibles). */
  currentPeriod: number
  nextDueDate: string
  lastPayout: { amount: number; paidAt: string } | null
}

export interface PayoutInvestorsResponse {
  totalDue: number
  items: PayoutInvestorItem[]
  meta: PaginationMeta
}

export interface PayoutItem {
  id: number
  investor: { id: number; fullName: string }
  amount: number
  frequency: PayoutFrequency
  periodStart: string
  periodEnd: string
  paidAt: string
}

export interface PayoutsResponse {
  items: PayoutItem[]
  meta: PaginationMeta
}

export interface InvestorPayoutSummary {
  frequency: PayoutFrequency
  received: number
  dueNow: number
  currentPeriod: number
  nextPayoutDate: string
  lastPayout: { amount: number; paidAt: string } | null
}

// ─── Paramètres de l'espace admin ────────────────────────────────────────────

export interface AdminSettings {
  profile: {
    id: number
    fullName: string
    email: string | null
    phoneNumber: string
    avatarUrl: string | null
  }
  platform: {
    /** Versement hebdomadaire proposé pour un nouveau véhicule ; 0 = cible répartie sur 32 semaines. */
    defaultWeeklyAmount: number
    currency: 'XAF'
  }
  /** Société qui figure dans les contrats. */
  company: CompanyInfo
  /** Commission réelle de l'admin : capital non financé et excédents des versements validés. */
  commission: { total: number; thisMonth: number; collected: number; ratePct: number }
  /** Coordonnées du support affichées aux conducteurs. */
  support: { phone: string; whatsapp: string; hours: string }
  alerts: { lateWarningDays: number; lateCriticalDays: number }
  notifications: { weeklyReportEmail: boolean; maintenanceAlerts: boolean; investorAlerts: boolean }
}

export interface CompanyInfo {
  companyName: string
  companyAddress: string
  companyRegistration: string
  companyRepresentative: string
  companyRepresentativeTitle: string
  signatureCity: string
}

export interface UpdateAdminSettingsBody {
  platform?: { defaultWeeklyAmount?: number }
  company?: Partial<CompanyInfo>
  support?: Partial<AdminSettings['support']>
  alerts?: { lateWarningDays?: number; lateCriticalDays?: number }
  notifications?: Partial<AdminSettings['notifications']>
}

// ─── Paramètres de l'espace investisseur ────────────────────────────────────

export interface InvestorNotificationPrefs {
  weeklyReportEmail: boolean
  revenueAlerts: boolean
  vehicleAlerts: boolean
}

export interface InvestorSettings {
  profile: {
    id: number
    fullName: string
    email: string | null
    phoneNumber: string
    avatarUrl: string | null
    memberSince: string
    /** Date du dernier changement de mot de passe par l'investisseur ; null s'il ne l'a jamais changé. */
    passwordChangedAt: string | null
  }
  /** Mode de versement fixé par l'administrateur (consultation seulement). */
  payout: { frequency: PayoutFrequency }
  portfolio: { partsCount: number; vehiclesCount: number }
  notifications: InvestorNotificationPrefs
}

export interface InvestorWeeklyReportResult {
  emailSent: boolean
}

export interface UpdateAdminProfileBody {
  fullName?: string
  email?: string
  phoneNumber?: string
}

export interface AdminAccessItem {
  id: number
  fullName: string
  email: string | null
  phoneNumber: string
  avatarUrl: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  isMe: boolean
}

export interface CreateAdminBody {
  fullName: string
  phoneNumber: string
  email?: string
  password: string
}

// ─── Calendrier des échéances ────────────────────────────────────────────────

export type CalendarStatus = 'PAID' | 'UPCOMING' | 'LATE'

/** Une échéance : versement hebdomadaire d'un chauffeur ou reversement dû à un investisseur. */
export interface CalendarEvent {
  id: string
  /** Jour de l'échéance, `AAAA-MM-JJ`. */
  date: string
  kind: 'DRIVER_PAYMENT' | 'INVESTOR_PAYOUT'
  personId: number
  personName: string
  avatarUrl: string | null
  amount: number
  paidAmount: number
  status: CalendarStatus
  motoMatricule: string | null
  frequency: PayoutFrequency | null
  /** Montant d'une période pas encore terminée : il peut encore augmenter. */
  estimated: boolean
  /** Semaine ajoutée à la fin du calendrier d'un chauffeur pour une semaine de retard (non comptée dans les totaux). */
  extension: boolean
  /** Dernière échéance du calendrier de ce chauffeur. */
  final: boolean
  /** Échéance finale avancée : la cible a été soldée avant la date initialement prévue. */
  settledEarly: boolean
  /** Semaines gagnées sur la fin prévue (cible soldée en avance, ou avance sur le rythme hebdomadaire) ; portée par l'échéance finale. */
  weeksSaved: number
}

/** Une semaine de versement restée impayée à son échéance (dimanche soir). */
export interface LatePayment {
  id: number
  /** Dimanche de la semaine concernée, `AAAA-MM-JJ`. */
  dueDate: string
  /** Premier jour de retard (lundi), `AAAA-MM-JJ`. */
  lateSince: string
  amountDue: number
  /** Reste à verser sur cette semaine (0 une fois régularisée). */
  missingAmount: number
  settledAt: string | null
  status: 'OPEN' | 'SETTLED'
  daysLate: number
  moto: { id: number; matricule: string }
  driver: { id: number; fullName: string; avatarUrl: string | null }
}

export interface LatePaymentsParams {
  page?: number
  limit?: number
  status?: 'OPEN' | 'SETTLED'
  search?: string
}

export interface LatePaymentsResponse {
  data: LatePayment[]
  total: number
  page: number
  limit: number
  summary: { open: number; openAmount: number; settled: number }
}

export interface CalendarResponse {
  from: string
  to: string
  events: CalendarEvent[]
  summary: Record<'late' | 'upcoming' | 'paid', { count: number; amount: number }>
}

export interface CalendarParams {
  from: string
  to: string
  type?: 'DRIVER_PAYMENT' | 'INVESTOR_PAYOUT'
  status?: CalendarStatus
  search?: string
}
