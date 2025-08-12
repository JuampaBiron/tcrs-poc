import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types'
import { ERROR_MESSAGES } from '@/constants'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.VALIDATION) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404)
  }
}

export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NETWORK) {
    super(message, 503)
  }
}

export function createErrorResponse<T = never>(
  error: string | Error | AppError,
  statusCode?: number
): NextResponse<ApiResponse<T>> {
  let message: string
  let status: number

  if (error instanceof AppError) {
    message = error.message
    status = error.statusCode
    console.error(`AppError (${status}):`, message, error.stack)
  } else if (error instanceof Error) {
    message = process.env.NODE_ENV === 'development' ? error.message : ERROR_MESSAGES.GENERIC
    status = statusCode || 500
    console.error('Error:', message, error.stack)
  } else {
    message = error
    status = statusCode || 500
    console.error('Error:', message)
  }

  return NextResponse.json({
    success: false,
    error: message
  }, { status })
}

export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  })
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    return createErrorResponse(error)
  }

  if (error instanceof Error) {
    // Log unexpected errors
    console.error('Unexpected error:', error.stack)
    return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, 500)
  }

  return createErrorResponse(ERROR_MESSAGES.GENERIC, 500)
}

// Client-side error handling utilities
export function handleClientError(error: unknown): string {
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ERROR_MESSAGES.NETWORK
    }
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return ERROR_MESSAGES.GENERIC
}

export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as ApiResponse<T>).success === 'boolean'
  )
}

export async function safeApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await apiCall()
    const result = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: isApiResponse(result) ? result.error || ERROR_MESSAGES.GENERIC : ERROR_MESSAGES.GENERIC
      }
    }

    if (isApiResponse<T>(result) && result.success) {
      return {
        data: result.data || null,
        error: null
      }
    }

    return {
      data: result as T,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: handleClientError(error)
    }
  }
}