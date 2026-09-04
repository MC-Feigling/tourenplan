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

export const CHANGE_PASSWORD_MIN_LENGTH = 8

export const AUTH_MESSAGES = {
  changePasswordSuccess: 'Passwort geändert',
  wrongCurrentPassword: 'Aktuelles Passwort ist falsch',
  passwordTooShort: 'Neues Passwort zu kurz',
  passwordUnchanged: 'Neues Passwort muss sich unterscheiden',
  passwordMismatch: 'Passwörter stimmen nicht überein',
  changePasswordFailed: 'Passwort konnte nicht geändert werden',
} as const
