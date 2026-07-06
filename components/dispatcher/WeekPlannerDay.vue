<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'

defineProps<{
  day: { date: string; label: string; isToday: boolean }
  tours: PublicTour[]
  selectedDate: string
  canEdit: boolean
  allTours: PublicTour[]
  assignmentResources: AssignmentResources | null
  assigningTourId: string | null
  tapMode: AssignmentDragKind | null
  selectedResourceId: string | null
}>()

const emit = defineEmits<{
  selectDay: [date: string]
  assign: [payload: { tourId: string; kind: AssignmentDragKind; resourceId: string }]
  unassign: [payload: { tourId: string; kind: AssignmentDragKind }]
  tapAssign: [payload: { tourId: string }]
}>()
</script>

<template>
  <UiAppCard
    body-class="min-h-[8rem] p-3 transition-colors"
    :class="[
      day.isToday ? 'ring-1 ring-brand-500/40' : '',
      selectedDate === day.date ? 'ring-1 ring-brand-400/60 bg-brand-500/5' : '',
    ]"
    @click="emit('selectDay', day.date)"
  >
    <header class="mb-3 flex items-center justify-between gap-2">
      <button
        type="button"
        class="text-left text-xs font-semibold uppercase tracking-wide"
        :class="selectedDate === day.date ? 'text-brand-300' : day.isToday ? 'text-brand-400' : 'text-slate-400'"
        @click.stop="emit('selectDay', day.date)"
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
        v-for="tour in tours"
        :key="tour.id"
        :tour="tour"
        :readonly="!canEdit"
        :all-tours="allTours"
        :resources="assignmentResources"
        :assigning="assigningTourId === tour.id"
        :tap-mode="tapMode"
        :selected-resource-id="selectedResourceId"
        @assign="emit('assign', $event)"
        @unassign="emit('unassign', $event)"
        @tap-assign="emit('tapAssign', $event)"
      />
      <p v-if="!tours.length" class="py-4 text-center text-xs text-slate-600">
        Keine Touren
      </p>
    </div>
  </UiAppCard>
</template>
