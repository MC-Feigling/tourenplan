<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { ResourceOverview } from '~/shared/assignment/resourceAvailability'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'

defineProps<{
  overview: ResourceOverview | null
  selectedDateLabel: string
  weekDays: Array<{ date: string; label: string; isToday: boolean }>
  toursByDate: Map<string, PublicTour[]>
  selectedDate: string
  canEdit: boolean
  tours: PublicTour[]
  assignmentResources: AssignmentResources | null
  assigningTourId: string | null
  tapMode: AssignmentDragKind | null
  selectedResourceId: string | null
  highlightedTourIds: Set<string>
}>()

const emit = defineEmits<{
  selectResource: [payload: { kind: AssignmentDragKind; id: string }]
  sidebarUnassign: [payload: { kind: AssignmentDragKind; resourceId: string; tourId: string }]
  selectDay: [date: string]
  assign: [payload: { tourId: string; kind: AssignmentDragKind; resourceId: string }]
  unassign: [payload: { tourId: string; kind: AssignmentDragKind }]
  tapAssign: [payload: { tourId: string }]
}>()
</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
    <div class="lg:w-64 lg:shrink-0 lg:sticky lg:top-4">
      <DispatcherResourceSidebar
        :overview="overview"
        :selected-date-label="selectedDateLabel"
        :can-edit="canEdit"
        :tap-mode="tapMode"
        :selected-resource-id="selectedResourceId"
        @unassign="emit('sidebarUnassign', $event)"
        @select-resource="emit('selectResource', $event)"
      />
    </div>

    <div class="min-w-0 flex-1 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
      <DispatcherWeekPlannerDay
        v-for="day in weekDays"
        :key="day.date"
        :day="day"
        :tours="toursByDate.get(day.date) ?? []"
        :selected-date="selectedDate"
        :can-edit="canEdit"
        :all-tours="tours"
        :assignment-resources="assignmentResources"
        :assigning-tour-id="assigningTourId"
        :tap-mode="tapMode"
        :selected-resource-id="selectedResourceId"
        :highlighted-tour-ids="highlightedTourIds"
        @select-day="emit('selectDay', $event)"
        @assign="emit('assign', $event)"
        @unassign="emit('unassign', $event)"
        @tap-assign="emit('tapAssign', $event)"
      />
    </div>
  </div>
</template>
