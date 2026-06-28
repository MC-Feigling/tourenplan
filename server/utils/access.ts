import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { depots, isUserRole, users, type UserRow } from '../database/schema'
import { requireUserId } from './auth'
import { useDb } from './db'
import type { UserRole } from '../../shared/constants/roles'

export async function requireUserRow(event: H3Event): Promise<UserRow> {
  const userId = await requireUserId(event)
  const { db } = await useDb()
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return row
}

export async function requireRoles(event: H3Event, ...roles: UserRole[]): Promise<UserRow> {
  const row = await requireUserRow(event)
  if (!isUserRole(row.role) || !roles.includes(row.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return row
}

export async function requireDispatchRead(event: H3Event): Promise<UserRow> {
  return requireRoles(event, 'admin', 'dispatcher', 'viewer')
}

export async function requireDispatchWrite(event: H3Event): Promise<UserRow> {
  return requireRoles(event, 'admin', 'dispatcher')
}

export async function getDefaultDepotId(): Promise<string> {
  const { db } = await useDb()
  const [depot] = await db.select().from(depots).limit(1)
  if (!depot) {
    throw createError({ statusCode: 500, statusMessage: 'No depot configured' })
  }
  return depot.id
}

export function nowEpoch(): number {
  return Math.floor(Date.now() / 1000)
}
