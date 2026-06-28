import { RATE_LIMIT_BUCKETS } from '../../shared/constants/roles'

type BucketState = { count: number; resetAt: number }

const buckets = new Map<string, BucketState>()

export function rateLimitAllow(bucket: keyof typeof RATE_LIMIT_BUCKETS, key: string): boolean {
  const config = RATE_LIMIT_BUCKETS[bucket]
  const now = Date.now()
  const mapKey = `${bucket}:${key}`
  const existing = buckets.get(mapKey)

  if (!existing || now >= existing.resetAt) {
    buckets.set(mapKey, { count: 1, resetAt: now + config.windowMs })
    return true
  }

  if (existing.count >= config.max) {
    return false
  }

  existing.count += 1
  return true
}
