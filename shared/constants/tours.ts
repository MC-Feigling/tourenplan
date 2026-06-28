export const TOUR_TYPES = ['line', 'excursion'] as const
export type TourType = (typeof TOUR_TYPES)[number]

export const TOUR_STATUSES = ['draft', 'planned', 'assigned', 'active', 'completed'] as const
export type TourStatus = (typeof TOUR_STATUSES)[number]

export const STOP_TYPES = ['pickup', 'dropoff', 'break', 'overnight', 'depot'] as const
export type StopType = (typeof STOP_TYPES)[number]

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type IsoWeekday = (typeof ISO_WEEKDAYS)[number]

export const TOUR_TYPE_LABELS: Record<TourType, string> = {
  line: 'Linie',
  excursion: 'Ausflug',
}

export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  draft: 'Entwurf',
  planned: 'Geplant',
  assigned: 'Zugewiesen',
  active: 'Aktiv',
  completed: 'Abgeschlossen',
}

export const STOP_TYPE_LABELS: Record<StopType, string> = {
  pickup: 'Abholung',
  dropoff: 'Absetzen',
  break: 'Pause',
  overnight: 'Übernachtung',
  depot: 'Betriebshof',
}

export const WEEKDAY_LABELS: Record<IsoWeekday, string> = {
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  7: 'So',
}

export const WEEKDAY_LABELS_FULL: Record<IsoWeekday, string> = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
  7: 'Sonntag',
}
