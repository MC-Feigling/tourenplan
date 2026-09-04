import { timingSafeEqual } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { isBootstrapPasswordAllowed } from '../../../shared/auth/secrets'
import { BOOTSTRAP_ADVISORY_LOCK_ID } from '../../../shared/constants/auth'
import { depots, users } from '../../database/schema'
import { setAuthCookie, signAuthToken } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { logger } from '../../utils/logger'
import { toPublicUser } from '../../utils/userPublic'
import { rateLimitAllow } from '../../utils/rateLimit'
import { getClientIp } from '../../utils/requestMeta'

function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
})

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!rateLimitAllow('auth', `ip:${ip}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const body = await readValidatedBody(event, (raw) => bodySchema.parse(raw))
  const emailLower = body.email.toLowerCase()
  if (!rateLimitAllow('auth', `email:${emailLower}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const { db } = await useDb()
  let [row] = await db.select().from(users).where(eq(users.email, emailLower)).limit(1)

  if (!row) {
    const [countRow] = await db.select({ n: sql<number>`count(*)::int` }).from(users)
    if ((countRow?.n ?? 0) > 0) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }

    const config = useRuntimeConfig()
    const bootstrapPw =
      typeof config.bootstrapAdminPassword === 'string' ? config.bootstrapAdminPassword : ''
    const bootstrapEmail =
      typeof config.bootstrapAdminEmail === 'string' ? config.bootstrapAdminEmail.toLowerCase() : ''
    const isProduction = process.env.NODE_ENV === 'production'

    row = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${BOOTSTRAP_ADVISORY_LOCK_ID})`)

      const [existing] = await tx.select().from(users).where(eq(users.email, emailLower)).limit(1)
      if (existing) return existing

      const [countRow] = await tx.select({ n: sql<number>`count(*)::int` }).from(users)
      if ((countRow?.n ?? 0) > 0) return undefined

      if (!bootstrapPw.trim() || !isBootstrapPasswordAllowed(bootstrapPw, isProduction)) {
        return undefined
      }
      if (!timingSafeStringEqual(emailLower, bootstrapEmail)) {
        return undefined
      }
      if (!timingSafeStringEqual(body.password, bootstrapPw)) {
        return undefined
      }

      const [existingDepot] = await tx.select().from(depots).limit(1)
      let depotId = existingDepot?.id
      if (!depotId) {
        depotId = nanoid()
        await tx.insert(depots).values({
          id: depotId,
          name: 'Hauptbetrieb',
          address: '',
        })
      }

      const passwordHash = bcrypt.hashSync(body.password, 12)
      const id = nanoid()
      try {
        await tx.insert(users).values({
          id,
          email: emailLower,
          passwordHash,
          displayName: 'Administrator',
          role: 'admin',
          depotId,
        })
      } catch (error) {
        if (!isPgUniqueViolation(error)) throw error
        const [raced] = await tx.select().from(users).where(eq(users.email, emailLower)).limit(1)
        return raced
      }

      const [created] = await tx.select().from(users).where(eq(users.id, id)).limit(1)
      if (!created) {
        throw createError({ statusCode: 500, statusMessage: 'Bootstrap login failed' })
      }
      logger.info('bootstrap_admin_created', { userId: id })
      return created
    })

    if (!row) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }
  }

  const ok = bcrypt.compareSync(body.password, row.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = await signAuthToken(row.id)
  setAuthCookie(event, token)
  logger.info('user_login', { userId: row.id })

  return { user: toPublicUser(row) }
})
