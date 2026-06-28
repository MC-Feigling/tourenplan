import type { TourStatus } from './tours'

export const DRIVER_VISIBLE_STATUSES = ['planned', 'assigned', 'active', 'completed'] as const
export type DriverVisibleStatus = (typeof DRIVER_VISIBLE_STATUSES)[number]

export const DRIVER_STATUS_TRANSITIONS: Partial<Record<TourStatus, TourStatus[]>> = {
  planned: ['active'],
  assigned: ['active'],
  active: ['completed'],
}

export const DRIVER_STATUS_ACTION_LABELS: Partial<Record<TourStatus, string>> = {
  planned: 'Tour starten',
  assigned: 'Tour starten',
  active: 'Tour abschließen',
}

export function canDriverTransitionStatus(current: TourStatus, next: TourStatus): boolean {
  const allowed = DRIVER_STATUS_TRANSITIONS[current] ?? []
  return allowed.includes(next)
}
