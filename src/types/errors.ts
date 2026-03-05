import type { Job } from '../domain'

/**
 * Standardized error and result types for better error handling throughout the app
 */

export interface ValidationError {
  field: keyof Job | string
  message: string
}

export interface OperationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
  error?: Error | ValidationError
}

export interface StorageResult {
  jobs: Job[]
  didLoad: boolean
  error?: string
}
