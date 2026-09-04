export function isTrustProxyEnabled(trustProxy: unknown): boolean {
  return trustProxy === true || trustProxy === 'true'
}

export function resolveClientIp(input: {
  trustProxy: boolean
  forwardedFor: string | undefined
  remoteAddress: string | undefined
}): string {
  if (input.trustProxy) {
    const first = input.forwardedFor?.split(',')[0]?.trim()
    if (first) return first
  }
  const remote = input.remoteAddress?.trim()
  return remote && remote.length > 0 ? remote : 'unknown'
}
