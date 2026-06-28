<script setup lang="ts">
import type { PublicTour } from '~/shared/types/tours'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'

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
        <button type="button" class="btn-ghost !min-h-10 !px-3 text-xs" @click="emit('today')">Heute</button>
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
        <NuxtLink :to="`/dispatcher/tours/new?date=${weekStart}`" class="btn-primary no-underline">
          + Ausflug
        </NuxtLink>
        <NuxtLink to="/dispatcher/lines" class="btn-ghost no-underline">Linien</NuxtLink>
      </div>
    </div>

    <p v-if="generateMessage" class="text-sm text-brand-300" role="status">{{ generateMessage }}</p>

    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <section
        v-for="day in weekDays"
        :key="day.date"
        class="surface-card min-h-[8rem] p-3"
        :class="day.isToday ? 'ring-1 ring-brand-500/40' : ''"
      >
        <header class="mb-3 flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-wide" :class="day.isToday ? 'text-brand-400' : 'text-slate-400'">
            {{ day.label }}
          </p>
          <NuxtLink
            v-if="canEdit"
            :to="`/dispatcher/tours/new?date=${day.date}`"
            class="text-xs text-brand-400 no-underline hover:text-brand-300"
          >
            +
          </NuxtLink>
        </header>

        <div class="space-y-2">
          <DispatcherTourCard
            v-for="tour in toursByDate.get(day.date) ?? []"
            :key="tour.id"
            :tour="tour"
            :readonly="!canEdit"
            :all-tours="tours"
            :resources="assignmentResources"
          />
          <p v-if="!(toursByDate.get(day.date)?.length)" class="py-4 text-center text-xs text-slate-600">
            Keine Touren
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
