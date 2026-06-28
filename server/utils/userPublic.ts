import type { UserRow } from '../database/schema'
import { isUserRole } from '../database/schema'
import type { PublicUser } from '../../shared/types/auth'

export function toPublicUser(row: UserRow): PublicUser {
  const role = isUserRole(row.role) ? row.role : 'driver'
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role,
  }
}
