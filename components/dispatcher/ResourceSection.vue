<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import { readDragPayload } from '~/shared/assignment/dragPayload'
import type { DriverAvailability, VehicleAvailability } from '~/shared/assignment/resourceAvailability'

const props = defineProps<{
  kind: AssignmentDragKind
  title: string
  availableCount: number
  totalCount: number
  drivers?: DriverAvailability[]
  vehicles?: VehicleAvailability[]
  canEdit?: boolean
  selectedResourceId?: string | null
  tapMode?: AssignmentDragKind | null
}>()

const emit = defineEmits<{
  unassign: [payload: { kind: AssignmentDragKind; resourceId: string; tourId: string }]
  selectResource: [payload: { kind: AssignmentDragKind; id: string }]
}>()

const isDropTarget = ref(false)

function driverLabel(driver: DriverAvailability): string {
  return driver.fullName
}

function driverSubtitle(driver: DriverAvailability): string | null {
  if (driver.availability === 'assigned') return driver.assignedTourNames.join(', ')
  if (driver.blockReason) return driver.blockReason
  return null
}

function vehicleLabel(vehicle: VehicleAvailability): string {
  return vehicle.plateNumber
}

function vehicleSubtitle(vehicle: VehicleAvailability): string | null {
  if (vehicle.availability === 'assigned') return vehicle.assignedTourNames.join(', ')
  if (vehicle.blockReason) return vehicle.blockReason
  return vehicle.name
}

function onDragOver(event: DragEvent) {
  if (!props.canEdit) return
  const payload = readDragPayload(event)
  if (!payload || payload.kind !== props.kind) return
  if (!payload.tourId) return
  event.preventDefault()
  isDropTarget.value = true
}

function onDragLeave() {
  isDropTarget.value = false
}

function onDrop(event: DragEvent) {
  isDropTarget.value = false
  if (!props.canEdit) return
  const payload = readDragPayload(event)
  if (!payload || payload.kind !== props.kind || !payload.tourId) return
  event.preventDefault()
  emit('unassign', {
    kind: props.kind,
    resourceId: payload.id,
    tourId: payload.tourId,
  })
}
</script>

<template>
  <section
    class="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors"
    :class="isDropTarget ? 'border-brand-500/40 bg-brand-500/5' : ''"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <header class="flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ title }}</h3>
      <span class="text-[10px] text-slate-500">{{ availableCount }}/{{ totalCount }} frei</span>
    </header>

    <div class="space-y-1.5">
      <template v-if="kind === 'driver'">
        <DispatcherResourceDragItem
          v-for="driver in drivers ?? []"
          :key="driver.id"
          kind="driver"
          :id="driver.id"
          :label="driverLabel(driver)"
          :subtitle="driverSubtitle(driver)"
          :status="driver.availability"
          :tour-id="driver.assignedTourIds[0]"
          :draggable="canEdit"
          :selected="tapMode === 'driver' && selectedResourceId === driver.id"
          @select="emit('selectResource', { kind: 'driver', id: driver.id })"
        />
      </template>
      <template v-else>
        <DispatcherResourceDragItem
          v-for="vehicle in vehicles ?? []"
          :key="vehicle.id"
          kind="vehicle"
          :id="vehicle.id"
          :label="vehicleLabel(vehicle)"
          :subtitle="vehicleSubtitle(vehicle)"
          :status="vehicle.availability"
          :tour-id="vehicle.assignedTourIds[0]"
          :draggable="canEdit"
          :selected="tapMode === 'vehicle' && selectedResourceId === vehicle.id"
          @select="emit('selectResource', { kind: 'vehicle', id: vehicle.id })"
        />
      </template>
    </div>
  </section>
</template>
