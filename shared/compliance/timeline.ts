import { diffMinutes } from '../utils/time'
import type { ComplianceTimelineEvent, TourComplianceInput } from './types'

export function buildTourTimeline(tour: TourComplianceInput): ComplianceTimelineEvent[] {
  const events: ComplianceTimelineEvent[] = []

  for (let i = 0; i < tour.stops.length; i++) {
    const stop = tour.stops[i]
    if (!stop) continue

    if (i > 0 && stop.drivingMinutesFromPrev > 0) {
      events.push({ type: 'drive', minutes: stop.drivingMinutesFromPrev })
    }

    const dwell = diffMinutes(stop.plannedArrival, stop.plannedDeparture)
    if (dwell > 0) {
      events.push({ type: 'break', minutes: dwell })
    }
  }

  return events
}

export function calculateTourWorkMinutes(
  stops: TourComplianceInput['stops'],
): number {
  if (stops.length === 0) return 0
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (!first || !last) return 0
  return Math.max(diffMinutes(first.plannedArrival, last.plannedDeparture), 0)
}

export function getIsoWeekKey(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getWeekDates(weekKey: string): string[] {
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)
  const jan4 = new Date(year, 0, 4, 12, 0, 0)
  const day = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function getAdjacentWeekKey(weekKey: string, delta: number): string {
  const dates = getWeekDates(weekKey)
  const pivot = dates[0]
  const d = new Date(`${pivot}T12:00:00`)
  d.setDate(d.getDate() + delta * 7)
  return getIsoWeekKey(d.toISOString().slice(0, 10))
}
