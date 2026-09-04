import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { isTrustProxyEnabled, resolveClientIp } from '../../shared/auth/clientIp'

export function getClientIp(event: H3Event): string {
  const config = useRuntimeConfig()
  return resolveClientIp({
    trustProxy: isTrustProxyEnabled(config.trustProxy),
    forwardedFor: getHeader(event, 'x-forwarded-for'),
    remoteAddress: event.node.req.socket.remoteAddress,
  })
}
