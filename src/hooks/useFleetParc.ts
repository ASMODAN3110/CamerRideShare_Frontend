import { useCallback, useEffect, useRef, useState } from 'react'
import { getFleetSummary, getMotoFilters, listMotos } from '../services/fleetService'
import { ApiError } from '../types/auth'
import type {
  FleetSummary,
  ListMotosParams,
  MotoFilters,
  MotoListItem,
  MotoStatus,
  PaginatedMotos,
  VehicleType,
} from '../types/api'

const PAGE_LIMIT = 12
const SEARCH_DEBOUNCE_MS = 300

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Impossible de charger le parc.'
}

export type FleetParcFilters = {
  page: number
  search: string
  status: MotoStatus | ''
  city: string
  vehicleType: VehicleType | ''
  /** '' = tous, 'none' = sans chauffeur, sinon identifiant du chauffeur. */
  driver: string
}

const defaultFilters: FleetParcFilters = {
  page: 1,
  search: '',
  status: '',
  city: '',
  vehicleType: '',
  driver: '',
}

function toListParams(filters: FleetParcFilters): ListMotosParams {
  return {
    page: filters.page,
    limit: PAGE_LIMIT,
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    city: filters.city || undefined,
    vehicleType: filters.vehicleType || undefined,
    driver: filters.driver || undefined,
  }
}

export function useFleetParc() {
  const [summary, setSummary] = useState<FleetSummary | null>(null)
  const [filterOptions, setFilterOptions] = useState<MotoFilters | null>(null)
  const [motos, setMotos] = useState<MotoListItem[]>([])
  const [meta, setMeta] = useState<PaginatedMotos['meta'] | null>(null)
  const [filters, setFilters] = useState<FleetParcFilters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const refreshSummary = useCallback(async () => {
    const nextSummary = await getFleetSummary()
    setSummary(nextSummary)
  }, [])

  const refreshList = useCallback(async (nextFilters?: FleetParcFilters) => {
    const active = nextFilters ?? filtersRef.current
    setListLoading(true)
    try {
      const result = await listMotos(toListParams(active))
      setMotos(result.data ?? [])
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
      const [nextSummary, nextFilters, result] = await Promise.all([
        getFleetSummary(),
        getMotoFilters(),
        listMotos(toListParams(active)),
      ])
      setSummary(nextSummary)
      setFilterOptions(nextFilters)
      setMotos(result.data ?? [])
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
    (status: MotoStatus | '') => {
      const next = { ...filtersRef.current, status, page: 1 }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const setCityFilter = useCallback(
    (city: string) => {
      const next = { ...filtersRef.current, city, page: 1 }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const setVehicleTypeFilter = useCallback(
    (vehicleType: VehicleType | '') => {
      const next = { ...filtersRef.current, vehicleType, page: 1 }
      setFilters(next)
      void refreshList(next)
    },
    [refreshList],
  )

  const setDriverFilter = useCallback(
    (driver: string) => {
      const next = { ...filtersRef.current, driver, page: 1 }
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
    filterOptions,
    motos,
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
    setCityFilter,
    setVehicleTypeFilter,
    setDriverFilter,
  }
}
