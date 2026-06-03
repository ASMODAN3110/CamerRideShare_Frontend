export type UserRole = 'ADMIN' | 'INVESTOR' | 'DRIVER'

export type User = {
  id: number
  email: string | null
  fullName: string
  role: UserRole
  phoneNumber: string
  createdAt: string
  updatedAt: string
}

export type LoginResponse = {
  access_token: string
  user: User
}

export type LoginBody = {
  phoneNumber: string
  password: string
}

export type RegisterBody = {
  phoneNumber: string
  password: string
  fullName: string
  role: UserRole
  email?: string
}

export type ApiErrorBody = {
  statusCode: number
  message: string | string[]
  error?: string
}

export class ApiError extends Error {
  statusCode: number
  body: ApiErrorBody

  constructor(statusCode: number, body: ApiErrorBody) {
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message
    super(msg || `HTTP ${statusCode}`)
    this.statusCode = statusCode
    this.body = body
  }
}
