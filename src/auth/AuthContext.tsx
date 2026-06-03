import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setApiAuthHandlers } from '../lib/apiClient'
import type { User } from '../types/auth'
import { isTokenExpired } from './jwt'
import { AuthContext, type AuthContextValue } from './authContextState'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function loadAuthFromStorage() {
  const token = localStorage.getItem(TOKEN_KEY)
  const storedUser = readStoredUser()

  if (!token || !storedUser || isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { accessToken: null as string | null, user: null as User | null }
  }

  return { accessToken: token, user: storedUser }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadAuthFromStorage()
  const [accessToken, setAccessToken] = useState<string | null>(initial.accessToken)
  const [user, setUser] = useState<User | null>(initial.user)
  const isHydrating = false

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAccessToken(null)
    setUser(null)
  }, [])

  const login = useCallback((token: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setAccessToken(token)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    setApiAuthHandlers({
      getToken: () => localStorage.getItem(TOKEN_KEY),
      onUnauthorized: () => {
        logout()
        const path = window.location.pathname
        if (path !== '/connexion' && path !== '/inscription') {
          window.location.assign('/connexion')
        }
      },
    })
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isHydrating,
      login,
      logout,
    }),
    [accessToken, user, isHydrating, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
