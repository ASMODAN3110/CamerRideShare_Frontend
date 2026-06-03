import { ApiError, type ApiErrorBody } from '../types/auth'

type AuthHandlers = {
  getToken: () => string | null
  onUnauthorized: () => void
}

let authHandlers: AuthHandlers = {
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
}

export function setApiAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers
}

function getBaseUrl() {
  const url = import.meta.env.VITE_API_URL
  if (typeof url === 'string' && url.length > 0) {
    return url.replace(/\/$/, '')
  }
  return ''
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let body: ApiErrorBody = {
    statusCode: res.status,
    message: res.statusText || 'Request failed',
  }

  try {
    const json = (await res.json()) as ApiErrorBody
    body = { ...body, ...json, statusCode: json.statusCode ?? res.status }
  } catch {
    // ignore JSON parse errors
  }

  return new ApiError(res.status, body)
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authHandlers.getToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    authHandlers.onUnauthorized()
    throw await parseErrorResponse(res)
  }

  if (!res.ok) {
    throw await parseErrorResponse(res)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}
