import { apiRequest } from '../lib/apiClient'
import { ApiError } from '../types/auth'
import type { User } from '../types/auth'
import type { Driver, Investor } from '../types/api'

/** Raw user from GET /users — may include passwordHash (never expose in UI). */
type UserFromApi = User & { passwordHash?: string; activeMoto?: Driver['activeMoto'] }

export type CreateUserBody = {
  phoneNumber: string
  password: string
  fullName: string
  role: User['role']
  email?: string
}

export type UpdateUserBody = Partial<{
  phoneNumber: string
  password: string
  fullName: string
  role: User['role']
  email: string | null
}>

function mapDriver(u: UserFromApi): Driver {
  return {
    id: u.id,
    email: u.email ?? '',
    fullName: u.fullName,
    role: 'DRIVER',
    phoneNumber: u.phoneNumber,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt,
    activeMoto: u.activeMoto ?? null,
  }
}

function mapInvestor(u: UserFromApi): Investor {
  return {
    id: u.id,
    email: u.email ?? '',
    fullName: u.fullName,
    role: 'INVESTOR',
    phoneNumber: u.phoneNumber,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt,
  }
}

export function userSelectErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 403) return 'Accès refusé. Réservé aux administrateurs.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Erreur chargement des utilisateurs.'
}

export function listUsers() {
  return apiRequest<UserFromApi[]>('/users')
}

export interface UserPickerParams {
  /** Recherche (nom ou téléphone) appliquée par le serveur. */
  search?: string
  limit?: number
}

function pickerQuery(params: UserPickerParams & { withActiveMoto?: boolean }) {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.withActiveMoto) qs.set('withActiveMoto', 'true')
  const str = qs.toString()
  return str ? `?${str}` : ''
}

/**
 * GET /users/drivers — JWT + ADMIN, flat array without passwordHash.
 * `withActiveMoto` : le backend ne renvoie que les chauffeurs ayant une moto en cours de paiement.
 */
export async function listDriversFromApi(params: UserPickerParams & { withActiveMoto?: boolean } = {}): Promise<Driver[]> {
  const users = await apiRequest<UserFromApi[]>(`/users/drivers${pickerQuery(params)}`)
  return users.map(mapDriver)
}

/** GET /users/investors — JWT + ADMIN, flat array without passwordHash. */
export async function listInvestorsFromApi(params: UserPickerParams = {}): Promise<Investor[]> {
  const users = await apiRequest<UserFromApi[]>(`/users/investors${pickerQuery(params)}`)
  return users.map(mapInvestor)
}

/** @deprecated alias — use listDriversFromApi */
export const listDrivers = listDriversFromApi

/** @deprecated alias — use listInvestorsFromApi */
export const listInvestors = listInvestorsFromApi

export function getUser(id: number) {
  return apiRequest<User>(`/users/${id}`)
}

/** `emailSent` : identifiants envoyés par email (false : échec d'envoi, null : aucune adresse renseignée). */
export function createUser(body: CreateUserBody) {
  return apiRequest<User & { emailSent: boolean | null }>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateUser(id: number, body: UpdateUserBody) {
  return apiRequest<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteUser(id: number) {
  return apiRequest<void>(`/users/${id}`, {
    method: 'DELETE',
  })
}
