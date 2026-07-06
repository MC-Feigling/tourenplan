<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { PublicTour } from '~/shared/types/tours'

defineProps<{
  tour: PublicTour
  driverName: string | null
  vehicleLabel: string | null
  readonly?: boolean
  dropTarget: AssignmentDragKind | null
}>()

const emit = defineEmits<{
  dragOver: [event: DragEvent, kind: AssignmentDragKind]
  dragLeave: [kind: AssignmentDragKind]
  drop: [event: DragEvent, kind: AssignmentDragKind]
  assignedDragStart: [event: DragEvent, kind: AssignmentDragKind]
  unassign: [kind: AssignmentDragKind]
}>()

function dropZoneClass(kind: AssignmentDragKind, dropTarget: AssignmentDragKind | null): string {
  const active = dropTarget === kind
  return active
    ? 'border-brand-500/50 bg-brand-500/10'
    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
}
</script>

<template>
  <div class="mt-2 grid gap-1.5">
    <div
      class="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors"
      :class="dropZoneClass('driver', dropTarget)"
      @dragover="emit('dragOver', $event, 'driver')"
      @dragleave="emit('dragLeave', 'driver')"
      @drop="emit('drop', $event, 'driver')"
    >
      <span class="shrink-0 text-slate-500">Fahrer</span>
      <span
        v-if="driverName"
        class="min-w-0 flex-1 truncate font-medium text-white"
        :draggable="!readonly"
        @dragstart="emit('assignedDragStart', $event, 'driver')"
        @click.stop
      >
        {{ driverName }}
      </span>
      <span v-else class="flex-1 text-slate-600">— hierher ziehen —</span>
      <button
        v-if="driverName && !readonly"
        type="button"
        class="shrink-0 text-slate-500 hover:text-red-300"
        aria-label="Fahrer entfernen"
        @click.stop="emit('unassign', 'driver')"
      >
        ×
      </button>
    </div>

    <div
      class="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors"
      :class="dropZoneClass('vehicle', dropTarget)"
      @dragover="emit('dragOver', $event, 'vehicle')"
      @dragleave="emit('dragLeave', 'vehicle')"
      @drop="emit('drop', $event, 'vehicle')"
    >
      <span class="shrink-0 text-slate-500">Fahrzeug</span>
      <span
        v-if="vehicleLabel"
        class="min-w-0 flex-1 truncate font-medium text-white"
        :draggable="!readonly"
        @dragstart="emit('assignedDragStart', $event, 'vehicle')"
        @click.stop
      >
        {{ vehicleLabel }}
      </span>
      <span v-else class="flex-1 text-slate-600">— hierher ziehen —</span>
      <button
        v-if="vehicleLabel && !readonly"
        type="button"
        class="shrink-0 text-slate-500 hover:text-red-300"
        aria-label="Fahrzeug entfernen"
        @click.stop="emit('unassign', 'vehicle')"
      >
        ×
      </button>
    </div>
  </div>

  <div class="mt-2 flex flex-wrap gap-2 text-[10px]">
    <span class="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-brand-300">
      {{ tour.totalDrivingMinutes }} min Lenkzeit
    </span>
    <span class="rounded-md bg-slate-700/50 px-1.5 py-0.5 text-slate-400">
      {{ COMPLIANCE_PROFILE_LABELS[tour.complianceProfile] }}
    </span>
  </div>
</template>
