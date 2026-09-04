import { describe, expect, it } from 'vitest'
import { isTrustProxyEnabled, resolveClientIp } from './clientIp'

describe('isTrustProxyEnabled', () => {
  it('is true only for explicit true values', () => {
    expect(isTrustProxyEnabled(true)).toBe(true)
    expect(isTrustProxyEnabled('true')).toBe(true)
    expect(isTrustProxyEnabled(false)).toBe(false)
    expect(isTrustProxyEnabled('false')).toBe(false)
    expect(isTrustProxyEnabled(undefined)).toBe(false)
  })
})

describe('resolveClientIp', () => {
  it('ignores X-Forwarded-For when proxy is not trusted', () => {
    expect(
      resolveClientIp({
        trustProxy: false,
        forwardedFor: '1.2.3.4, 10.0.0.1',
        remoteAddress: '127.0.0.1',
      }),
    ).toBe('127.0.0.1')
  })

  it('uses first forwarded hop when proxy is trusted', () => {
    expect(
      resolveClientIp({
        trustProxy: true,
        forwardedFor: '  203.0.113.9, 10.0.0.1',
        remoteAddress: '10.0.0.1',
      }),
    ).toBe('203.0.113.9')
  })

  it('falls back to remote address when forwarded header is empty', () => {
    expect(
      resolveClientIp({
        trustProxy: true,
        forwardedFor: undefined,
        remoteAddress: '10.0.0.1',
      }),
    ).toBe('10.0.0.1')
  })

  it('returns unknown when no address is available', () => {
    expect(
      resolveClientIp({
        trustProxy: false,
        forwardedFor: '1.2.3.4',
        remoteAddress: undefined,
      }),
    ).toBe('unknown')
  })
})
