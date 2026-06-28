import type { AssignmentStopWindow } from './types'

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export function timeToMinutes(time: string): number {
  const match = TIME_REGEX.exec(time)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

export function getTourTimeWindow(
  stops: AssignmentStopWindow[],
): { start: number; end: number } | null {
  if (stops.length === 0) return null
  const first = stops[0]
  const last = stops[stops.length - 1]
  if (!first || !last) return null
  return {
    start: timeToMinutes(first.plannedArrival),
    end: timeToMinutes(last.plannedDeparture),
  }
}

export function timeWindowsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end
}
