export const AUTH_COOKIE_NAME = 'tourenplan_token'

export const USER_ROLES = ['admin', 'dispatcher', 'driver', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const RATE_LIMIT_BUCKETS = {
  auth: { max: 20, windowMs: 60_000 },
  api: { max: 120, windowMs: 60_000 },
} as const
