import { describe, expect, it } from 'vitest'
import { JWT_SECRET_MIN_LENGTH } from '../constants/auth'
import {
  assertJwtSecret,
  assertProductionBootstrapConfig,
  isBootstrapPasswordAllowed,
  isJwtSecretValid,
} from './secrets'

const validSecret = 'a'.repeat(JWT_SECRET_MIN_LENGTH)

describe('isJwtSecretValid', () => {
  it('rejects empty and short secrets', () => {
    expect(isJwtSecretValid('', false)).toBe(false)
    expect(isJwtSecretValid('short', false)).toBe(false)
  })

  it('accepts secrets of at least min length in development', () => {
    expect(isJwtSecretValid(validSecret, false)).toBe(true)
  })

  it('rejects documented example secret in production', () => {
    expect(isJwtSecretValid('change-me-in-production-min-32-chars', true)).toBe(false)
    expect(isJwtSecretValid('change-me-in-production-min-32-chars', false)).toBe(true)
  })
})

describe('assertJwtSecret', () => {
  it('throws on empty secret', () => {
    expect(() => assertJwtSecret('', false)).toThrow(/NUXT_JWT_SECRET/)
  })

  it('accepts a valid secret', () => {
    expect(() => assertJwtSecret(validSecret, false)).not.toThrow()
  })
})

describe('isBootstrapPasswordAllowed', () => {
  it('rejects short passwords', () => {
    expect(isBootstrapPasswordAllowed('short', false)).toBe(false)
  })

  it('allows documented local default in development', () => {
    expect(isBootstrapPasswordAllowed('admin-change-me', false)).toBe(true)
  })

  it('rejects documented local default in production', () => {
    expect(isBootstrapPasswordAllowed('admin-change-me', true)).toBe(false)
  })
})

describe('assertProductionBootstrapConfig', () => {
  it('allows empty bootstrap password (disabled)', () => {
    expect(() => assertProductionBootstrapConfig('', true)).not.toThrow()
  })

  it('rejects weak production bootstrap password', () => {
    expect(() => assertProductionBootstrapConfig('admin-change-me', true)).toThrow(
      /NUXT_BOOTSTRAP_ADMIN_PASSWORD/,
    )
  })

  it('ignores weak password outside production', () => {
    expect(() => assertProductionBootstrapConfig('admin-change-me', false)).not.toThrow()
  })
})
