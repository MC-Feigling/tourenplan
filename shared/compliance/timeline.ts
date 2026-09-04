import { diffMinutes } from '../utils/time'
import type { ComplianceTimelineEvent, DriverDaySegment, TourComplianceInput } from './types'

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
  const bounds = getTourShiftBounds(stops)
  if (!bounds) return 0
  return Math.max(diffMinutes(bounds.start, bounds.end), 0)
}

export function getTourShiftBounds(
  stops: TourComplianceInput['stops'],
): { start: string; end: string } | null {
  if (stops.length === 0) return null
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (!first || !last) return null
  return { start: first.plannedArrival, end: last.plannedDeparture }
}

export function combineShiftBounds(
  a: { start: string; end: string } | null,
  b: { start: string; end: string } | null,
): { start: string; end: string } | null {
  if (!a) return b
  if (!b) return a
  return {
    start: a.start < b.start ? a.start : b.start,
    end: a.end > b.end ? a.end : b.end,
  }
}

export function mergeDayTimeline(
  segments: DriverDaySegment[],
  current: DriverDaySegment,
): ComplianceTimelineEvent[] {
  const ordered = [...segments, current].sort((a, b) => a.start.localeCompare(b.start))
  const events: ComplianceTimelineEvent[] = []

  for (let i = 0; i < ordered.length; i++) {
    const segment = ordered[i]
    if (!segment) continue
    if (i > 0) {
      const previous = ordered[i - 1]
      if (previous) {
        const gap = diffMinutes(previous.end, segment.start)
        if (gap > 0) events.push({ type: 'break', minutes: gap })
      }
    }
    events.push(...segment.timeline)
  }

  return events
}

export function restMinutesBetween(
  fromDate: string,
  fromTime: string,
  toDate: string,
  toTime: string,
): number {
  const from = new Date(`${fromDate}T${fromTime}:00`)
  const to = new Date(`${toDate}T${toTime}:00`)
  return Math.round((to.getTime() - from.getTime()) / 60_000)
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
