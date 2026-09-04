import { describe, expect, it } from 'vitest'
import { changePasswordBodySchema } from './auth'

describe('changePasswordBodySchema', () => {
  it('accepts valid payload', () => {
    const parsed = changePasswordBodySchema.parse({
      currentPassword: 'old-secret',
      newPassword: 'new-secret1',
    })
    expect(parsed.newPassword).toBe('new-secret1')
  })

  it('rejects short new password', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'old-secret',
        newPassword: 'short',
      }),
    ).toThrow()
  })

  it('rejects when new equals current', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'same-pass',
        newPassword: 'same-pass',
      }),
    ).toThrow()
  })
})
