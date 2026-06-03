import type { UserRole } from '../types/auth'

export type JwtPayload = {
  sub: number
  phoneNumber: string
  role: UserRole
  iat?: number
  exp?: number
}

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const json = decodeBase64Url(parts[1])
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, skewSeconds = 30) {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now + skewSeconds
}
