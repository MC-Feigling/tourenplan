<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import type { ResourceOverview } from '~/shared/assignment/resourceAvailability'

const props = defineProps<{
  overview: ResourceOverview | null
  selectedDateLabel: string
  canEdit?: boolean
  tapMode?: AssignmentDragKind | null
  selectedResourceId?: string | null
}>()

const emit = defineEmits<{
  unassign: [payload: { kind: AssignmentDragKind; resourceId: string; tourId: string }]
  selectResource: [payload: { kind: AssignmentDragKind; id: string }]
}>()
</script>

<template>
  <aside class="space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-white">Ressourcen</h2>
      <p class="mt-0.5 text-xs text-slate-500">{{ selectedDateLabel }}</p>
      <p v-if="tapMode" class="mt-2 text-[10px] text-brand-300">
        Tippen Sie eine Tour an, um zuzuweisen
      </p>
    </div>

    <div v-if="!overview" class="text-xs text-slate-500">Laden…</div>

    <template v-else>
      <DispatcherResourceSection
        kind="driver"
        title="Fahrer"
        :available-count="overview.availableDriverCount"
        :total-count="overview.drivers.length"
        :drivers="overview.drivers"
        :can-edit="canEdit"
        :tap-mode="tapMode"
        :selected-resource-id="selectedResourceId"
        @unassign="emit('unassign', $event)"
        @select-resource="emit('selectResource', $event)"
      />

      <DispatcherResourceSection
        kind="vehicle"
        title="Fahrzeuge"
        :available-count="overview.availableVehicleCount"
        :total-count="overview.vehicles.length"
        :vehicles="overview.vehicles"
        :can-edit="canEdit"
        :tap-mode="tapMode"
        :selected-resource-id="selectedResourceId"
        @unassign="emit('unassign', $event)"
        @select-resource="emit('selectResource', $event)"
      />
    </template>
  </aside>
</template>
