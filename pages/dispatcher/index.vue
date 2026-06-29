<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  roles: ['admin', 'dispatcher', 'viewer'],
})

const auth = useAuthStore()
const week = useWeekRange()
const { weekStart, weekEnd, weekLabel, weekDays } = week
const api = useToursApi()
const toursApiError = api.error
const assignmentApi = useAssignmentApi()

const canEdit = computed(() => auth.hasRole('admin', 'dispatcher'))

const { data, pending, refresh, error } = useAsyncData(
  'week-tours',
  () => api.listRange(weekStart.value, weekEnd.value),
  { watch: [weekStart, weekEnd], lazy: true },
)

const { data: assignmentData, pending: assignmentPending } = useAsyncData(
  'week-assignment-resources',
  () => assignmentApi.loadResources(weekStart.value, weekEnd.value),
  { watch: [weekStart, weekEnd], lazy: true },
)

const isInitialLoading = computed(() => pending.value && !data.value)
const isRefreshing = computed(() => pending.value && Boolean(data.value))
const tours = computed(() => data.value?.items ?? [])
const assignmentResources = computed(() => assignmentData.value ?? null)

useHead({ title: 'Disposition' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader title="Disposition" description="Wochenplan — Linien und Ausflüge" />

    <div v-if="isInitialLoading" class="text-sm text-slate-400">Laden…</div>

    <div
      v-else-if="error || toursApiError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {{ toursApiError ?? 'Touren konnten nicht geladen werden' }}
    </div>

    <template v-else>
      <p v-if="isRefreshing || assignmentPending" class="text-xs text-slate-500">Aktualisiere…</p>

      <DispatcherWeekPlanner
        :tours="tours"
        :week-start="weekStart"
        :week-end="weekEnd"
        :week-label="weekLabel"
        :week-days="weekDays"
        :can-edit="canEdit"
        :assignment-resources="assignmentResources"
        @prev-week="week.shiftWeek(-1)"
        @next-week="week.shiftWeek(1)"
        @today="week.goToToday()"
        @refresh="refresh()"
      />
    </template>
  </div>
</template>
