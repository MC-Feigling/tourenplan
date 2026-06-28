import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { getUserIdFromEvent } from '../../utils/auth'
import { useDb } from '../../utils/db'
import { toPublicUser } from '../../utils/userPublic'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) {
    return { user: null }
  }
  const { db } = await useDb()
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) {
    return { user: null }
  }
  return { user: toPublicUser(row) }
})
