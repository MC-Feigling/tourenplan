export const JWT_SECRET_MIN_LENGTH = 32
export const BOOTSTRAP_PASSWORD_MIN_LENGTH = 12

/** PostgreSQL advisory lock key for first-admin bootstrap (xact-scoped). */
export const BOOTSTRAP_ADVISORY_LOCK_ID = 87123401

export const PRODUCTION_FORBIDDEN_JWT_SECRETS = [
  'change-me-in-production-min-32-chars',
] as const

export const PRODUCTION_FORBIDDEN_BOOTSTRAP_PASSWORDS = [
  'admin-change-me',
  'password',
  'changeme',
  'admin',
] as const
