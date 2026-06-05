import { apiRequest } from '../lib/apiClient'
import type { User } from '../types/auth'
import type { Driver } from '../types/api'

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

export function listUsers() {
  return apiRequest<User[]>('/users')
}

/**
 * GET /users/drivers
 * Returns all users with role DRIVER (passwordHash excluded).
 * Used to populate the driver select in payment/incident forms.
 */
export function listDrivers(): Promise<Driver[]> {
  return apiRequest<Driver[]>('/users/drivers')
}

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
