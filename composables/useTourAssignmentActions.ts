import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { AssignmentIssue } from '~/shared/assignment/types'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'
import { tourToForm } from '~/composables/useToursApi'

export type AssignmentActionResult = {
  ok: boolean
  message?: string
  issues?: AssignmentIssue[]
}

export function useTourAssignmentActions(options: {
  tours: Ref<PublicTour[]>
  resources: Ref<AssignmentResources | null>
  onUpdated: () => Promise<void>
}) {
  const toursApi = useToursApi()
  const assignmentApi = useAssignmentApi()
  const assigningTourId = ref<string | null>(null)
  const feedback = ref<string | null>(null)
  const feedbackTone = ref<'success' | 'error'>('success')

  function showFeedback(message: string, tone: 'success' | 'error') {
    feedback.value = message
    feedbackTone.value = tone
    setTimeout(() => {
      if (feedback.value === message) feedback.value = null
    }, 4000)
  }

  function findTour(tourId: string): PublicTour | undefined {
    return options.tours.value.find((tour) => tour.id === tourId)
  }

  function buildFormForAssignment(tour: PublicTour, kind: AssignmentDragKind, resourceId: string | null) {
    const form = tourToForm(tour)
    if (kind === 'driver') form.driverId = resourceId ?? ''
    else form.vehicleId = resourceId ?? ''
    return form
  }

  async function assignResource(
    tourId: string,
    kind: AssignmentDragKind,
    resourceId: string,
  ): Promise<AssignmentActionResult> {
    const tour = findTour(tourId)
    if (!tour) return { ok: false, message: 'Tour nicht gefunden' }

    const currentId = kind === 'driver' ? tour.driverId : tour.vehicleId
    if (currentId === resourceId) return { ok: true }

    const form = buildFormForAssignment(tour, kind, resourceId)

    try {
      const result = await assignmentApi.validateTour(form, { tourId })
      if (result.overallStatus === 'error') {
        const message = result.assignment.issues.find((i) => i.severity === 'error')?.message
          ?? result.compliance?.issues.find((i) => i.severity === 'error')?.message
          ?? 'Zuweisung nicht möglich'
        showFeedback(message, 'error')
        return { ok: false, message, issues: result.assignment.issues }
      }

      assigningTourId.value = tourId
      const patch = kind === 'driver' ? { driverId: resourceId } : { vehicleId: resourceId }
      await toursApi.update(tourId, patch)
      await options.onUpdated()

      const label = kind === 'driver' ? 'Fahrer' : 'Fahrzeug'
      showFeedback(`${label} zugewiesen`, 'success')
      return { ok: true }
    } catch (e: unknown) {
      const message = toursApi.error.value ?? 'Zuweisung fehlgeschlagen'
      showFeedback(message, 'error')
      return { ok: false, message }
    } finally {
      assigningTourId.value = null
    }
  }

  async function unassignResource(
    tourId: string,
    kind: AssignmentDragKind,
  ): Promise<AssignmentActionResult> {
    const tour = findTour(tourId)
    if (!tour) return { ok: false, message: 'Tour nicht gefunden' }

    const currentId = kind === 'driver' ? tour.driverId : tour.vehicleId
    if (!currentId) return { ok: true }

    try {
      assigningTourId.value = tourId
      const patch = kind === 'driver' ? { driverId: '' } : { vehicleId: '' }
      await toursApi.update(tourId, patch)
      await options.onUpdated()

      const label = kind === 'driver' ? 'Fahrer' : 'Fahrzeug'
      showFeedback(`${label} entfernt`, 'success')
      return { ok: true }
    } catch {
      const message = toursApi.error.value ?? 'Entfernen fehlgeschlagen'
      showFeedback(message, 'error')
      return { ok: false, message }
    } finally {
      assigningTourId.value = null
    }
  }

  async function unassignFromSidebar(
    kind: AssignmentDragKind,
    resourceId: string,
    tourId: string,
  ): Promise<AssignmentActionResult> {
    const tour = findTour(tourId)
    if (!tour) return { ok: false, message: 'Tour nicht gefunden' }
    const currentId = kind === 'driver' ? tour.driverId : tour.vehicleId
    if (currentId !== resourceId) return { ok: false, message: 'Ressource nicht dieser Tour zugewiesen' }
    return unassignResource(tourId, kind)
  }

  return {
    assigningTourId,
    feedback,
    feedbackTone,
    assignResource,
    unassignResource,
    unassignFromSidebar,
  }
}
