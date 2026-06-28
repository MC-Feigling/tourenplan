<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  roles: ['admin', 'dispatcher', 'viewer'],
})

const auth = useAuthStore()
const week = useWeekRange()
const api = useToursApi()
const assignmentApi = useAssignmentApi()

const canEdit = computed(() => auth.hasRole('admin', 'dispatcher'))

const { data, pending, refresh, error } = await useAsyncData(
  'week-tours',
  () => api.listRange(week.weekStart.value, week.weekEnd.value),
  { watch: [week.weekStart, week.weekEnd] },
)

const { data: assignmentData } = await useAsyncData(
  'week-assignment-resources',
  () => assignmentApi.loadResources(week.weekStart.value, week.weekEnd.value),
  { watch: [week.weekStart, week.weekEnd] },
)

const tours = computed(() => data.value?.items ?? [])
const assignmentResources = computed(() => assignmentData.value ?? null)

useHead({ title: 'Disposition' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader title="Disposition" description="Wochenplan — Linien und Ausflüge" />

    <div v-if="pending" class="text-sm text-slate-400">Laden…</div>

    <div
      v-else-if="error || api.error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {{ api.error ?? 'Touren konnten nicht geladen werden' }}
    </div>

    <DispatcherWeekPlanner
      v-else
      :tours="tours"
      :week-start="week.weekStart"
      :week-end="week.weekEnd"
      :week-label="week.weekLabel"
      :week-days="week.weekDays"
      :can-edit="canEdit"
      :assignment-resources="assignmentResources"
      @prev-week="week.shiftWeek(-1)"
      @next-week="week.shiftWeek(1)"
      @today="week.goToToday()"
      @refresh="refresh()"
    />
  </div>
</template>
