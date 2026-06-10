import { useCallback, useEffect, useRef, useState } from 'react'
import { getPaymentsSummary } from '../services/paymentsService'
import { listTransactions } from '../services/transactionsService'
import { ApiError } from '../types/auth'
import type {
  ListTransactionsParams,
  PaginationMeta,
  PaymentStatus,
  PaymentType,
  PaymentsSummary,
  Transaction,
} from '../types/api'

const PAGE_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Impossible de charger les paiements.'
}

export type AdminPaymentsFilters = {
  page: number
  search: string
  status: PaymentStatus | ''
  type: PaymentType | ''
}

const defaultFilters: AdminPaymentsFilters = {
  page: 1,
  search: '',
  status: '',
  type: '',
}

function toListParams(filters: AdminPaymentsFilters): ListTransactionsParams {
  return {
    page: filters.page,
    limit: PAGE_LIMIT,
    sort: 'desc',
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    type: filters.type || undefined,
  }
}

export function useAdminPayments() {
  const [summary, setSummary] = useState<PaymentsSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [filters, setFilters] = useState<AdminPaymentsFilters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const refreshSummary = useCallback(async () => {
    const next = await getPaymentsSummary()
    setSummary(next)
  }, [])

  const refreshList = useCallback(async (nextFilters?: AdminPaymentsFilters) => {
    const active = nextFilters ?? filtersRef.current
    setListLoading(true)
    try {
      const result = await listTransactions(toListParams(active))
      setTransactions(result.data)
      setMeta(result.meta)
    } finally {
      setListLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const active = filtersRef.current
      const [nextSummary, result] = await Promise.all([
        getPaymentsSummary(),
        listTransactions(toListParams(active)),
      ])
      setSummary(nextSummary)
      setTransactions(result.data)
      setMeta(result.meta)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setLoading(false)
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setPage = useCallback(
    (page: number) => {
      const next = { ...filtersRef.current, page }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const setStatusFilter = useCallback(
    (status: PaymentStatus | '') => {
      const next = { ...filtersRef.current, status, page: 1 }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const setTypeFilter = useCallback(
    (type: PaymentType | '') => {
      const next = { ...filtersRef.current, type, page: 1 }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const searchDebounceReady = useRef(false)
  useEffect(() => {
    if (!searchDebounceReady.current) {
      searchDebounceReady.current = true
      return
    }
    const timer = window.setTimeout(() => {
      void refreshList(filtersRef.current)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [filters.search, refreshList])

  return {
    summary,
    transactions,
    meta,
    filters,
    loading,
    listLoading,
    error,
    refresh,
    refreshSummary,
    refreshList,
    setPage,
    setSearch,
    setStatusFilter,
    setTypeFilter,
  }
}
