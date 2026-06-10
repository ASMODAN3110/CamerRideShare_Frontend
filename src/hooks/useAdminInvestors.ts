import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getInvestorsRoiTrend,
  getInvestorsSummary,
  listAdminInvestors,
} from '../services/investorsService'
import { ApiError } from '../types/auth'
import type {
  AdminInvestorListItem,
  AdminInvestorStatus,
  InvestorsRoiTrend,
  InvestorsSummary,
  ListAdminInvestorsParams,
  PaginationMeta,
} from '../types/api'

const PAGE_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300
const ROI_MONTHS = 8

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Impossible de charger les investisseurs.'
}

export type AdminInvestorsFilters = {
  page: number
  search: string
  status: AdminInvestorStatus | ''
}

const defaultFilters: AdminInvestorsFilters = {
  page: 1,
  search: '',
  status: '',
}

function toListParams(filters: AdminInvestorsFilters): ListAdminInvestorsParams {
  return {
    page: filters.page,
    limit: PAGE_LIMIT,
    sort: 'desc',
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
  }
}

export function useAdminInvestors() {
  const [summary, setSummary] = useState<InvestorsSummary | null>(null)
  const [investors, setInvestors] = useState<AdminInvestorListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [roiTrend, setRoiTrend] = useState<InvestorsRoiTrend | null>(null)
  const [filters, setFilters] = useState<AdminInvestorsFilters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const refreshList = useCallback(async (nextFilters?: AdminInvestorsFilters) => {
    const active = nextFilters ?? filtersRef.current
    setListLoading(true)
    try {
      const result = await listAdminInvestors(toListParams(active))
      setInvestors(result.data)
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
      const [nextSummary, result, nextRoi] = await Promise.all([
        getInvestorsSummary(),
        listAdminInvestors(toListParams(active)),
        getInvestorsRoiTrend(ROI_MONTHS),
      ])
      setSummary(nextSummary)
      setInvestors(result.data)
      setMeta(result.meta)
      setRoiTrend(nextRoi)
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
    (status: AdminInvestorStatus | '') => {
      const next = { ...filtersRef.current, status, page: 1 }
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
    investors,
    meta,
    roiTrend,
    filters,
    loading,
    listLoading,
    error,
    refresh,
    refreshList,
    setPage,
    setSearch,
    setStatusFilter,
  }
}
