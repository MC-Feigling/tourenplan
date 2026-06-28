import { timingSafeEqual } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { z } from 'zod'
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

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
})

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!rateLimitAllow('auth', ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const body = await readValidatedBody(event, (raw) => bodySchema.parse(raw))
  const { db } = await useDb()
  const emailLower = body.email.toLowerCase()
  let [row] = await db.select().from(users).where(eq(users.email, emailLower)).limit(1)

  if (!row) {
    const [countRow] = await db.select({ n: sql<number>`count(*)::int` }).from(users)
    const userCount = countRow?.n ?? 0
    if (userCount > 0) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }

    const config = useRuntimeConfig()
    const bootstrapPw =
      typeof config.bootstrapAdminPassword === 'string' ? config.bootstrapAdminPassword : ''
    const bootstrapEmail =
      typeof config.bootstrapAdminEmail === 'string' ? config.bootstrapAdminEmail.toLowerCase() : ''

    if (!bootstrapPw.trim() || !timingSafeStringEqual(emailLower, bootstrapEmail)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }
    if (!timingSafeStringEqual(body.password, bootstrapPw)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
    }

    const [existingDepot] = await db.select().from(depots).limit(1)
    let depotId = existingDepot?.id
    if (!depotId) {
      depotId = nanoid()
      await db.insert(depots).values({
        id: depotId,
        name: 'Hauptbetrieb',
        address: '',
      })
    }

    const passwordHash = bcrypt.hashSync(body.password, 12)
    const id = nanoid()
    await db.insert(users).values({
      id,
      email: emailLower,
      passwordHash,
      displayName: 'Administrator',
      role: 'admin',
      depotId,
    })
    ;[row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!row) {
      throw createError({ statusCode: 500, statusMessage: 'Bootstrap login failed' })
    }
    logger.info('bootstrap_admin_created', { userId: id })
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
