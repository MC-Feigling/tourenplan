<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import { minutesToRoundedHours } from '~/shared/utils/time'
import type { TourStopFormRow } from '~/composables/useToursApi'
import { toIsoDate } from '~/composables/useWeekRange'

definePageMeta({
  layout: 'driver',
  middleware: 'auth',
  roles: ['driver'],
})

const week = useWeekRange()
const api = useDriverApi()
const driverApiError = api.error
const today = toIsoDate(new Date())

const { data, pending, error, refresh } = await useAsyncData(
  'driver-tours',
  () => api.listRange(week.weekStart.value, week.weekEnd.value),
  { watch: [week.weekStart, week.weekEnd] },
)

const tours = computed(() => data.value?.items ?? [])
const todayTours = computed(() => tours.value.filter((tour) => tour.date === today))
const upcomingTours = computed(() =>
  tours.value.filter((tour) => tour.date !== today).sort((a, b) => a.date.localeCompare(b.date)),
)

const toursByDate = computed(() => {
  const map = new Map<string, typeof tours.value>()
  for (const tour of upcomingTours.value) {
    const list = map.get(tour.date) ?? []
    list.push(tour)
    map.set(tour.date, list)
  }
  return map
})

useHead({ title: 'Meine Touren' })
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="font-display text-xl font-bold text-white">Meine Touren</h1>
      <p class="mt-1 text-sm text-slate-400">{{ week.weekLabel }}</p>
    </header>

    <div class="flex items-center gap-2">
      <UButton variant="ghost" color="neutral" size="sm" aria-label="Vorherige Woche" @click="week.shiftWeek(-1)">←</UButton>
      <UButton variant="ghost" color="neutral" size="sm" class="flex-1" @click="week.goToToday()">Heute</UButton>
      <UButton variant="ghost" color="neutral" size="sm" aria-label="Nächste Woche" @click="week.shiftWeek(1)">→</UButton>
    </div>

    <div v-if="pending" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error || driverApiError"
      color="error"
      variant="subtle"
      :title="driverApiError ?? 'Touren konnten nicht geladen werden'"
      role="alert"
    />

    <template v-else>
      <section class="space-y-3">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-brand-400">Heute</h2>
        <div v-if="todayTours.length" class="space-y-3">
          <DriverTourCard v-for="tour in todayTours" :key="tour.id" :tour="tour" />
        </div>
        <UiAppCard v-else body-class="p-6 text-center">
          <p class="text-sm text-slate-400">Heute keine Touren.</p>
        </UiAppCard>
      </section>

      <section v-if="upcomingTours.length" class="space-y-4">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Weitere Tage</h2>
        <div v-for="[date, dayTours] in toursByDate" :key="date" class="space-y-3">
          <p class="text-xs text-slate-500">
            {{ new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)) }}
          </p>
          <DriverTourCard v-for="tour in dayTours" :key="tour.id" :tour="tour" />
        </div>
      </section>

      <UiAppCard v-if="!tours.length" body-class="p-6 text-center">
        <p class="text-sm text-slate-400">Keine Touren in dieser Woche.</p>
        <p class="mt-2 text-xs text-slate-500">Zuweisungen erscheinen nach Disposition.</p>
      </UiAppCard>
    </template>
  </div>
</template>
