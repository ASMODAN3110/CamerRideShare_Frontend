import { createContext } from 'react'
import type { User } from '../types/auth'

export type AuthContextValue = {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrating: boolean
  login: (accessToken: string, user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
