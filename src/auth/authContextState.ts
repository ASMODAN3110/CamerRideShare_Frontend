import { createContext } from 'react'
import type { User } from '../types/auth'

export type AuthContextValue = {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrating: boolean
  login: (accessToken: string, user: User) => void
  logout: () => void
  /** Met à jour l'utilisateur connecté (nom, e-mail, photo) après une modification de profil. */
  updateUser: (patch: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
