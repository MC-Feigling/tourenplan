import type { UserRole } from '../constants/roles'

export type PublicUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  admin: '/admin',
  dispatcher: '/dispatcher',
  driver: '/driver',
  viewer: '/dispatcher',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  dispatcher: 'Disponent',
  driver: 'Fahrer',
  viewer: 'Betrachter',
}
