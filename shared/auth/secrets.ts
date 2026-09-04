import {
  BOOTSTRAP_PASSWORD_MIN_LENGTH,
  JWT_SECRET_MIN_LENGTH,
  PRODUCTION_FORBIDDEN_BOOTSTRAP_PASSWORDS,
  PRODUCTION_FORBIDDEN_JWT_SECRETS,
} from '../constants/auth'

export function isJwtSecretValid(secret: string, isProduction: boolean): boolean {
  if (secret.length < JWT_SECRET_MIN_LENGTH) return false
  if (isProduction && (PRODUCTION_FORBIDDEN_JWT_SECRETS as readonly string[]).includes(secret)) {
    return false
  }
  return true
}

export function assertJwtSecret(secret: unknown, isProduction = process.env.NODE_ENV === 'production'): asserts secret is string {
  if (typeof secret !== 'string' || !isJwtSecretValid(secret, isProduction)) {
    throw new Error(
      `NUXT_JWT_SECRET must be set, at least ${JWT_SECRET_MIN_LENGTH} characters, and unique in production`,
    )
  }
}

export function isBootstrapPasswordAllowed(password: string, isProduction: boolean): boolean {
  if (password.length < BOOTSTRAP_PASSWORD_MIN_LENGTH) return false
  if (
    isProduction &&
    (PRODUCTION_FORBIDDEN_BOOTSTRAP_PASSWORDS as readonly string[]).includes(password)
  ) {
    return false
  }
  return true
}

export function assertProductionBootstrapConfig(
  password: unknown,
  isProduction: boolean,
): void {
  if (!isProduction) return
  if (typeof password !== 'string' || !password.trim()) return
  if (!isBootstrapPasswordAllowed(password, true)) {
    throw new Error(
      `NUXT_BOOTSTRAP_ADMIN_PASSWORD must be at least ${BOOTSTRAP_PASSWORD_MIN_LENGTH} characters and not a known default in production`,
    )
  }
}
