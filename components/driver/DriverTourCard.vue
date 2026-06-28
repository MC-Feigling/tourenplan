<script setup lang="ts">
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import type { DriverTour } from '~/shared/types/driver'

defineProps<{
  tour: DriverTour
}>()
</script>

<template>
  <NuxtLink
    :to="`/driver/tours/${tour.id}`"
    class="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 no-underline transition-colors active:bg-white/10"
  >
    <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/25">
      <span class="text-[10px] font-semibold uppercase text-brand-300">
        {{ tour.stops[0]?.plannedArrival ?? '—' }}
      </span>
    </div>

    <div class="min-w-0 flex-1">
      <p class="truncate text-base font-semibold text-white">{{ tour.name }}</p>
      <p class="mt-0.5 text-xs text-slate-400">
        {{ TOUR_TYPE_LABELS[tour.type] }}
        <span v-if="tour.vehicle"> · {{ tour.vehicle.plateNumber }}</span>
      </p>
    </div>

    <span
      class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium"
      :class="{
        'bg-emerald-500/15 text-emerald-300': tour.status === 'active',
        'bg-brand-500/15 text-brand-300': tour.status === 'assigned' || tour.status === 'planned',
        'bg-slate-700/60 text-slate-300': tour.status === 'completed',
      }"
    >
      {{ TOUR_STATUS_LABELS[tour.status] }}
    </span>
  </NuxtLink>
</template>
