<script setup lang="ts">
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import type { PublicTour } from '~/shared/types/tours'

defineProps<{
  tour: PublicTour
  dotClass: string
  assignmentStatus: string | null
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0 flex items-start gap-2">
      <span
        class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2"
        :class="dotClass"
        :title="assignmentStatus ?? 'Ungeprüft'"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-white">{{ tour.name }}</p>
        <p class="mt-0.5 text-xs text-slate-400">
          {{ TOUR_TYPE_LABELS[tour.type] }} · {{ tour.stops[0]?.plannedArrival ?? '—' }}
        </p>
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-1">
      <span class="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
        {{ TOUR_STATUS_LABELS[tour.status] }}
      </span>
      <NuxtLink
        :to="`/dispatcher/tours/${tour.id}`"
        class="rounded-md px-1.5 py-0.5 text-[10px] text-brand-400 no-underline hover:bg-brand-500/10"
        @click.stop
      >
        →
      </NuxtLink>
    </div>
  </div>
</template>
