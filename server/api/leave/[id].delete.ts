import { eq } from 'drizzle-orm'
import { leaveRequests } from '../../database/schema'
import { requireRoles } from '../../utils/access'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireRoles(event, 'admin')
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  if (event.method !== 'DELETE') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const { db } = await useDb()
  const [existing] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Leave request not found' })
  }

  await db.delete(leaveRequests).where(eq(leaveRequests.id, id))
  return { ok: true }
})
