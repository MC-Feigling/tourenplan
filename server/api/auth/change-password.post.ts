import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ZodError } from 'zod'
import { AUTH_MESSAGES } from '../../../shared/constants/auth'
import { changePasswordBodySchema } from '../../../shared/schemas/auth'
import { users } from '../../database/schema'
import { requireUserRow } from '../../utils/access'
import { useDb } from '../../utils/db'
import { rateLimitAllow } from '../../utils/rateLimit'
import { getClientIp } from '../../utils/requestMeta'

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!rateLimitAllow('auth', `change-pw:${ip}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const row = await requireUserRow(event)

  let body: { currentPassword: string; newPassword: string }
  try {
    body = await readValidatedBody(event, (raw) => changePasswordBodySchema.parse(raw))
  } catch (error) {
    if (error instanceof ZodError) {
      const code = error.issues[0]?.message
      if (code === 'password_unchanged') {
        throw createError({
          statusCode: 400,
          statusMessage: AUTH_MESSAGES.passwordUnchanged,
        })
      }
      throw createError({
        statusCode: 400,
        statusMessage: AUTH_MESSAGES.passwordTooShort,
      })
    }
    throw error
  }

  if (!rateLimitAllow('auth', `change-pw-user:${row.id}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const ok = bcrypt.compareSync(body.currentPassword, row.passwordHash)
  if (!ok) {
    throw createError({
      statusCode: 401,
      statusMessage: AUTH_MESSAGES.wrongCurrentPassword,
    })
  }

  const passwordHash = bcrypt.hashSync(body.newPassword, 12)
  const { db } = await useDb()
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.id))

  return { ok: true as const }
})
