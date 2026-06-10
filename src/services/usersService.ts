import { apiRequest } from '../lib/apiClient'
import { ApiError } from '../types/auth'
import type { User } from '../types/auth'
import type { Driver, Investor } from '../types/api'

/** Raw user from GET /users — may include passwordHash (never expose in UI). */
type UserFromApi = User & { passwordHash?: string }

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

/** GET /users/drivers — JWT + ADMIN, flat array without passwordHash. */
export async function listDriversFromApi(): Promise<Driver[]> {
  const users = await apiRequest<UserFromApi[]>('/users/drivers')
  return users.map(mapDriver)
}

/** GET /users/investors — JWT + ADMIN, flat array without passwordHash. */
export async function listInvestorsFromApi(): Promise<Investor[]> {
  const users = await apiRequest<UserFromApi[]>('/users/investors')
  return users.map(mapInvestor)
}

/** @deprecated alias — use listDriversFromApi */
export const listDrivers = listDriversFromApi

/** @deprecated alias — use listInvestorsFromApi */
export const listInvestors = listInvestorsFromApi

export function getUser(id: number) {
  return apiRequest<User>(`/users/${id}`)
}

export function createUser(body: CreateUserBody) {
  return apiRequest<User>('/users', {
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
