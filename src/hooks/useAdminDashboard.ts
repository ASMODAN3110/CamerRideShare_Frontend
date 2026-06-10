import { useCallback, useEffect, useState } from 'react'
import { getAlerts, getDashboardOverview } from '../services/dashboardService'
import { listTransactions } from '../services/transactionsService'
import { ApiError } from '../types/auth'
import type { Alert, DashboardOverview, Transaction } from '../types/api'

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Impossible de charger le tableau de bord.'
}

export function useAdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextOverview, nextAlerts, nextTransactions] = await Promise.all([
        getDashboardOverview(),
        getAlerts('high'),
        listTransactions({ limit: 10, sort: 'desc' }),
      ])
      setOverview(nextOverview)
      setAlerts(nextAlerts)
      setTransactions(nextTransactions)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { overview, alerts, transactions, loading, error, refresh }
}
