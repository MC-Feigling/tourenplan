import type { ComplianceValidationResult } from '~/shared/compliance/types'
import { extractError } from '~/shared/utils/apiError'
import { resolveComplianceProfile } from '~/shared/constants/compliance'
import type {
  AssignmentValidationResult,
  OverallAssignmentStatus,
} from '~/shared/assignment/types'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { TourFormState } from '~/composables/useToursApi'

export type AssignmentCheckResult = {
  assignment: AssignmentValidationResult
  compliance: ComplianceValidationResult | null
  overallStatus: OverallAssignmentStatus
}

export function useAssignmentApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadResources(from: string, to: string) {
    const apiFetch = useApiFetch()
    return await apiFetch<AssignmentResources>('/api/assignment/resources', {
      query: { from, to },
      credentials: 'include',
    })
  }

  async function validateTour(
    form: TourFormState,
    options?: { tourId?: string },
  ) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      const lineLengthKm =
        form.type === 'line' && form.lineLengthKm ? Number(form.lineLengthKm) : null
      const complianceProfile = resolveComplianceProfile(form.type, lineLengthKm)

      return await apiFetch<AssignmentCheckResult>('/api/assignment/validate', {
        method: 'POST',
        body: {
          tourId: options?.tourId,
          date: form.date,
          driverId: form.driverId || null,
          vehicleId: form.vehicleId || null,
          stops: form.stops.map((stop) => ({
            plannedArrival: stop.plannedArrival,
            plannedDeparture: stop.plannedDeparture,
            stopType: stop.stopType,
            drivingMinutesFromPrev: stop.drivingMinutesFromPrev,
          })),
          includeCompliance: true,
          draft: options?.tourId
            ? undefined
            : {
                name: form.name || 'Draft',
                type: form.type,
                lineLengthKm,
                complianceProfile,
                stops: form.stops.map((stop) => ({
                  plannedArrival: stop.plannedArrival,
                  plannedDeparture: stop.plannedDeparture,
                  stopType: stop.stopType,
                  drivingMinutesFromPrev: stop.drivingMinutesFromPrev,
                })),
              },
        },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, loadResources, validateTour }
}
