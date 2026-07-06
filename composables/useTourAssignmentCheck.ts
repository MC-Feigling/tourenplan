import type { Ref } from 'vue'
import type { AssignmentCheckResult } from '~/composables/useAssignmentApi'
import type { TourFormState } from '~/composables/useToursApi'

export function useTourAssignmentCheck(options: {
  form: Ref<TourFormState>
  tourId: Ref<string | undefined>
  validate: (
    form: TourFormState,
    opts: { tourId?: string },
  ) => Promise<AssignmentCheckResult>
}) {
  const assignmentResult = ref<AssignmentCheckResult | null>(null)
  let assignmentTimeout: ReturnType<typeof setTimeout> | null = null

  async function runAssignmentCheck() {
    if (options.form.value.stops.length === 0) return
    try {
      assignmentResult.value = await options.validate(options.form.value, {
        tourId: options.tourId.value,
      })
    } catch {
      assignmentResult.value = null
    }
  }

  function scheduleAssignmentCheck() {
    if (assignmentTimeout) clearTimeout(assignmentTimeout)
    assignmentTimeout = setTimeout(() => void runAssignmentCheck(), 400)
  }

  watch(options.form, () => scheduleAssignmentCheck(), { deep: true })

  onMounted(() => {
    void runAssignmentCheck()
  })

  return { assignmentResult }
}
