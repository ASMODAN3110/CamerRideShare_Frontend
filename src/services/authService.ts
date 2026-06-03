import { apiRequest } from '../lib/apiClient'
import type { LoginBody, LoginResponse, RegisterBody, User } from '../types/auth'

export function login(body: LoginBody) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function register(body: RegisterBody) {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
