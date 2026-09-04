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

const nextTourDate = computed(() => upcomingTours.value[0]?.date ?? null)

const nextTourDateLabel = computed(() => {
  if (!nextTourDate.value) return null
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${nextTourDate.value}T12:00:00`))
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
        <UiEmptyState
          v-else-if="tours.length"
          title="Heute keine Tour"
          :description="nextTourDateLabel
            ? `Nächste Tour: ${nextTourDateLabel}`
            : 'In dieser Woche keine weiteren Touren.'"
        >
          <template #icon>
            <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </template>
        </UiEmptyState>
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

      <UiEmptyState
        v-if="!tours.length"
        title="Keine Touren in dieser Woche"
        description="Zuweisungen erscheinen nach Disposition."
      >
        <template #icon>
          <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </template>
      </UiEmptyState>
    </template>
  </div>
</template>
