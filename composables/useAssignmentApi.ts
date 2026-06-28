import type { ComplianceValidationResult } from '~/shared/compliance/types'
import { resolveComplianceProfile } from '~/shared/constants/compliance'
import type {
  AssignmentValidationResult,
  OverallAssignmentStatus,
} from '~/shared/assignment/types'
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
    return await $fetch<{
      drivers: Array<{
        id: string
        fullName: string
        active: boolean
        licenseClasses: string[]
        onLeave: boolean
        leaveTypeLabel?: string
      }>
      vehicles: Array<{
        id: string
        name: string
        plateNumber: string
        status: string
      }>
      leaveRequests: Array<{
        id: string
        staffMemberId: string
        startDate: string
        endDate: string
        type: string
      }>
    }>('/api/assignment/resources', {
      query: { from, to },
      credentials: 'include',
    })
  }

  async function validateTour(
    form: TourFormState,
    options?: { tourId?: string },
  ) {
    loading.value = true
    error.value = null
    try {
      const lineLengthKm =
        form.type === 'line' && form.lineLengthKm ? Number(form.lineLengthKm) : null
      const complianceProfile = resolveComplianceProfile(form.type, lineLengthKm)

      return await $fetch<AssignmentCheckResult>('/api/assignment/validate', {
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

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Unbekannter Fehler'
}
