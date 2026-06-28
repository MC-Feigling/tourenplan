import { sql } from 'drizzle-orm'
import { users } from '../../database/schema'
import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const { db } = await useDb()
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(users)
  return { hasUsers: (row?.n ?? 0) > 0 }
})
