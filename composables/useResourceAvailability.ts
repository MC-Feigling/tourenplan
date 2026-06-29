import type { Ref } from 'vue'
import {
  getResourceOverviewForDate,
  type ResourceOverview,
} from '~/shared/assignment/resourceAvailability'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'
import { toIsoDate } from '~/shared/utils/time'

export function useResourceAvailability(options: {
  tours: Ref<PublicTour[]>
  resources: Ref<AssignmentResources | null>
  selectedDate: Ref<string>
}) {
  const overview = computed<ResourceOverview | null>(() => {
    if (!options.resources.value) return null
    return getResourceOverviewForDate(
      options.resources.value,
      options.tours.value,
      options.selectedDate.value,
    )
  })

  function initSelectedDate(weekDays: Array<{ date: string; isToday: boolean }>): string {
    const today = weekDays.find((day) => day.isToday)
    return today?.date ?? weekDays[0]?.date ?? toIsoDate(new Date())
  }

  return {
    overview,
    initSelectedDate,
  }
}
