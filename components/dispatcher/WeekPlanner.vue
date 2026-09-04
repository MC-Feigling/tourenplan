<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'

const props = defineProps<{
  tours: PublicTour[]
  weekStart: string
  weekEnd: string
  weekLabel: string
  weekDays: Array<{ date: string; label: string; isToday: boolean }>
  canEdit: boolean
  assignmentResources: AssignmentResources | null
}>()
const emit = defineEmits<{
  prevWeek: []
  nextWeek: []
  today: []
  refresh: []
}>()

const api = useToursApi()
const templates = ref<Awaited<ReturnType<typeof api.listLineTemplates>>['items']>([])
const generating = ref(false)
const generateMessage = ref<string | null>(null)

const toursRef = computed(() => props.tours)
const resourcesRef = computed(() => props.assignmentResources)

const selectedDate = ref('')
const tapMode = ref<AssignmentDragKind | null>(null)
const selectedResourceId = ref<string | null>(null)
const pendingTodaySelect = ref(false)

const { overview, initSelectedDate } = useResourceAvailability({
  tours: toursRef,
  resources: resourcesRef,
  selectedDate,
})

watch(
  () => props.weekDays,
  (days) => {
    if (!days.length) return
    if (pendingTodaySelect.value) {
      pendingTodaySelect.value = false
      selectedDate.value = initSelectedDate(days)
      return
    }
    const stillVisible = days.some((day) => day.date === selectedDate.value)
    if (!stillVisible) {
      selectedDate.value = initSelectedDate(days)
    }
  },
  { immediate: true },
)

const selectedDateLabel = computed(() => {
  const day = props.weekDays.find((item) => item.date === selectedDate.value)
  return day?.label ?? selectedDate.value
})

const assignmentActions = useTourAssignmentActions({
  tours: toursRef,
  resources: resourcesRef,
  onUpdated: async () => emit('refresh'),
})

const toursByDate = computed(() => {
  const map = new Map<string, PublicTour[]>()
  for (const day of props.weekDays) {
    map.set(day.date, [])
  }
  for (const tour of props.tours) {
    const list = map.get(tour.date) ?? []
    list.push(tour)
    map.set(tour.date, list)
  }
  return map
})

onMounted(async () => {
  try {
    const res = await api.listLineTemplates()
    templates.value = res.items.filter((t) => t.active)
  } catch {
    templates.value = []
  }
})

async function generateLines() {
  if (!templates.value.length) return
  generating.value = true
  generateMessage.value = null
  try {
    let total = 0
    for (const template of templates.value) {
      const res = await api.generateFromTemplate(template.id, props.weekStart, props.weekEnd)
      total += res.count
    }
    generateMessage.value = `${total} Linien-Touren erzeugt`
    emit('refresh')
  } catch {
    generateMessage.value = api.error.value ?? 'Generierung fehlgeschlagen'
  } finally {
    generating.value = false
  }
}

function selectDay(date: string) {
  selectedDate.value = date
}

function onTodayClick() {
  pendingTodaySelect.value = true
  emit('today')
  if (props.weekDays.some((day) => day.isToday)) {
    selectedDate.value = initSelectedDate(props.weekDays)
    pendingTodaySelect.value = false
  }
}

function onSelectResource(payload: { kind: AssignmentDragKind; id: string }) {
  if (!props.canEdit) return
  if (tapMode.value === payload.kind && selectedResourceId.value === payload.id) {
    tapMode.value = null
    selectedResourceId.value = null
    return
  }
  tapMode.value = payload.kind
  selectedResourceId.value = payload.id
}

async function onTapAssign(payload: { tourId: string }) {
  if (!tapMode.value || !selectedResourceId.value) return
  await assignmentActions.assignResource(payload.tourId, tapMode.value, selectedResourceId.value)
  tapMode.value = null
  selectedResourceId.value = null
}

async function onAssign(payload: { tourId: string; kind: AssignmentDragKind; resourceId: string }) {
  await assignmentActions.assignResource(payload.tourId, payload.kind, payload.resourceId)
}

async function onUnassign(payload: { tourId: string; kind: AssignmentDragKind }) {
  await assignmentActions.unassignResource(payload.tourId, payload.kind)
}

async function onSidebarUnassign(payload: {
  kind: AssignmentDragKind
  resourceId: string
  tourId: string
}) {
  await assignmentActions.unassignFromSidebar(payload.kind, payload.resourceId, payload.tourId)
}
</script>

<template>
  <div class="space-y-6">
    <DispatcherWeekPlannerToolbar
      :week-label="weekLabel"
      :week-start="weekStart"
      :selected-date="selectedDate"
      :can-edit="canEdit"
      :templates-count="templates.length"
      :generating="generating"
      :generate-message="generateMessage"
      @prev-week="emit('prevWeek')"
      @next-week="emit('nextWeek')"
      @today="onTodayClick"
      @generate-lines="generateLines"
    />

    <DispatcherWeekPlannerFeedback
      v-if="assignmentActions.feedback.value"
      :message="assignmentActions.feedback.value"
      :tone="assignmentActions.feedbackTone.value === 'error' ? 'error' : 'success'"
    />

    <UiEmptyState
      v-if="tours.length === 0"
      title="Keine Touren in dieser Woche"
      description="Generiere Linien oder lege einen Ausflug an."
    >
      <template #icon>
        <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </template>
      <template #action>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton to="/dispatcher/lines" variant="ghost" color="neutral">Linien</UButton>
          <UButton :to="`/dispatcher/tours/new?date=${selectedDate || weekStart}`" color="primary">
            + Ausflug
          </UButton>
        </div>
      </template>
    </UiEmptyState>

    <DispatcherWeekPlannerGrid
      v-if="tours.length > 0"
      :overview="overview"
      :selected-date-label="selectedDateLabel"
      :week-days="weekDays"
      :tours-by-date="toursByDate"
      :selected-date="selectedDate"
      :can-edit="canEdit"
      :tours="tours"
      :assignment-resources="assignmentResources"
      :assigning-tour-id="assignmentActions.assigningTourId.value"
      :tap-mode="tapMode"
      :selected-resource-id="selectedResourceId"
      @select-resource="onSelectResource"
      @sidebar-unassign="onSidebarUnassign"
      @select-day="selectDay"
      @assign="onAssign"
      @unassign="onUnassign"
      @tap-assign="onTapAssign"
    />
  </div>
</template>
