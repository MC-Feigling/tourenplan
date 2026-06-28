import type { H3Event } from 'h3'
import { getHeader } from 'h3'

export function getClientIp(event: H3Event): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }
  return event.node.req.socket.remoteAddress ?? 'unknown'
}
