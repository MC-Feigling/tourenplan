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
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <button type="button" class="btn-ghost !min-h-10 !px-3" aria-label="Vorherige Woche" @click="emit('prevWeek')">←</button>
        <div class="min-w-[10rem] text-center">
          <p class="font-display text-lg font-bold text-white">{{ weekLabel }}</p>
        </div>
        <button type="button" class="btn-ghost !min-h-10 !px-3" aria-label="Nächste Woche" @click="emit('nextWeek')">→</button>
        <button type="button" class="btn-ghost !min-h-10 !px-3 text-xs" @click="onTodayClick">Heute</button>
      </div>

      <div v-if="canEdit" class="flex flex-wrap gap-2">
        <button
          v-if="templates.length"
          type="button"
          class="btn-ghost"
          :disabled="generating"
          @click="generateLines"
        >
          {{ generating ? 'Generiere…' : 'Linien generieren' }}
        </button>
        <NuxtLink :to="`/dispatcher/tours/new?date=${selectedDate || weekStart}`" class="btn-primary no-underline">
          + Ausflug
        </NuxtLink>
        <NuxtLink to="/dispatcher/lines" class="btn-ghost no-underline">Linien</NuxtLink>
      </div>
    </div>

    <p v-if="generateMessage" class="text-sm text-brand-300" role="status">{{ generateMessage }}</p>

    <p
      v-if="assignmentActions.feedback.value"
      class="rounded-xl border px-4 py-2 text-sm"
      :class="
        assignmentActions.feedbackTone.value === 'error'
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      "
      role="status"
    >
      {{ assignmentActions.feedback.value }}
    </p>

    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div class="lg:w-64 lg:shrink-0 lg:sticky lg:top-4">
        <DispatcherResourceSidebar
          :overview="overview"
          :selected-date-label="selectedDateLabel"
          :can-edit="canEdit"
          :tap-mode="tapMode"
          :selected-resource-id="selectedResourceId"
          @unassign="onSidebarUnassign"
          @select-resource="onSelectResource"
        />
      </div>

      <div class="min-w-0 flex-1 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <section
          v-for="day in weekDays"
          :key="day.date"
          class="surface-card min-h-[8rem] p-3 transition-colors"
          :class="[
            day.isToday ? 'ring-1 ring-brand-500/40' : '',
            selectedDate === day.date ? 'ring-1 ring-brand-400/60 bg-brand-500/5' : '',
          ]"
          @click="selectDay(day.date)"
        >
          <header class="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              class="text-left text-xs font-semibold uppercase tracking-wide"
              :class="selectedDate === day.date ? 'text-brand-300' : day.isToday ? 'text-brand-400' : 'text-slate-400'"
              @click.stop="selectDay(day.date)"
            >
              {{ day.label }}
            </button>
            <NuxtLink
              v-if="canEdit"
              :to="`/dispatcher/tours/new?date=${day.date}`"
              class="text-xs text-brand-400 no-underline hover:text-brand-300"
              @click.stop
            >
              +
            </NuxtLink>
          </header>

          <div class="space-y-2" @click.stop>
            <DispatcherTourCard
              v-for="tour in toursByDate.get(day.date) ?? []"
              :key="tour.id"
              :tour="tour"
              :readonly="!canEdit"
              :all-tours="tours"
              :resources="assignmentResources"
              :assigning="assignmentActions.assigningTourId.value === tour.id"
              :tap-mode="tapMode"
              :selected-resource-id="selectedResourceId"
              @assign="onAssign"
              @unassign="onUnassign"
              @tap-assign="onTapAssign"
            />
            <p v-if="!(toursByDate.get(day.date)?.length)" class="py-4 text-center text-xs text-slate-600">
              Keine Touren
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
