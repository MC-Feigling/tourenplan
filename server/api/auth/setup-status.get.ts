import { sql } from 'drizzle-orm'
import { users } from '../../database/schema'
import { useDb } from '../../utils/db'
import { rateLimitAllow } from '../../utils/rateLimit'
import { getClientIp } from '../../utils/requestMeta'

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!rateLimitAllow('auth', `setup:${ip}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  if (process.env.NODE_ENV === 'production') {
    return { setupAvailable: false }
  }

  const config = useRuntimeConfig()
  const bootstrapPw =
    typeof config.bootstrapAdminPassword === 'string' ? config.bootstrapAdminPassword : ''
  if (!bootstrapPw.trim()) {
    return { setupAvailable: false }
  }

  const { db } = await useDb()
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(users)
  return { setupAvailable: (row?.n ?? 0) === 0 }
})
