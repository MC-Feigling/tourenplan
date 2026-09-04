import type { PublicTour } from '../types/tours'
import { summarizeTourAssignment, type AssignmentResources } from './weekSummary'

export type WeekConflictSummary = {
  count: number
  dates: string[]
  tourIds: string[]
}

export function aggregateWeekConflicts(
  tours: PublicTour[],
  resources: AssignmentResources | null,
): WeekConflictSummary {
  if (!resources) {
    return { count: 0, dates: [], tourIds: [] }
  }

  const tourIds: string[] = []
  const dateSet = new Set<string>()

  for (const tour of tours) {
    const result = summarizeTourAssignment(tour, tours, resources)
    if (result.status === 'error' || result.status === 'warning') {
      tourIds.push(tour.id)
      dateSet.add(tour.date)
    }
  }

  return {
    count: tourIds.length,
    dates: [...dateSet].sort(),
    tourIds,
  }
}
