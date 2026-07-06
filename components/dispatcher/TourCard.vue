<script setup lang="ts">
import type { AssignmentDragKind } from '~/shared/assignment/dragPayload'
import { readDragPayload, setDragPayload } from '~/shared/assignment/dragPayload'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import { summarizeTourAssignment } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'

const props = defineProps<{
  tour: PublicTour
  readonly?: boolean
  allTours: PublicTour[]
  resources: AssignmentResources | null
  assigning?: boolean
  tapMode?: AssignmentDragKind | null
  selectedResourceId?: string | null
}>()

const emit = defineEmits<{
  assign: [payload: { tourId: string; kind: AssignmentDragKind; resourceId: string }]
  unassign: [payload: { tourId: string; kind: AssignmentDragKind }]
  tapAssign: [payload: { tourId: string }]
}>()

const dropTarget = ref<AssignmentDragKind | null>(null)

const assignmentStatus = computed(() => {
  if (!props.resources) return null
  return summarizeTourAssignment(props.tour, props.allTours, props.resources).status
})

const driverName = computed(() => {
  if (!props.tour.driverId || !props.resources) return null
  return props.resources.drivers.find((driver) => driver.id === props.tour.driverId)?.fullName ?? null
})

const vehicleLabel = computed(() => {
  if (!props.tour.vehicleId || !props.resources) return null
  const vehicle = props.resources.vehicles.find((item) => item.id === props.tour.vehicleId)
  return vehicle ? vehicle.plateNumber : null
})

const dotClass = computed(() => {
  switch (assignmentStatus.value) {
    case 'error':
      return 'bg-red-400 ring-red-400/30'
    case 'warning':
      return 'bg-amber-400 ring-amber-400/30'
    case 'ok':
      return 'bg-emerald-400 ring-emerald-400/30'
    default:
      return 'bg-slate-500 ring-slate-500/30'
  }
})

const isTapTarget = computed(
  () =>
    Boolean(props.tapMode && props.selectedResourceId && !props.readonly),
)

function onDragOver(event: DragEvent, kind: AssignmentDragKind) {
  if (props.readonly) return
  const payload = readDragPayload(event)
  if (!payload || payload.kind !== kind) return
  event.preventDefault()
  dropTarget.value = kind
}

function onDragLeave(kind: AssignmentDragKind) {
  if (dropTarget.value === kind) dropTarget.value = null
}

function onDrop(event: DragEvent, kind: AssignmentDragKind) {
  dropTarget.value = null
  if (props.readonly) return
  const payload = readDragPayload(event)
  if (!payload || payload.kind !== kind) return
  event.preventDefault()
  event.stopPropagation()

  if (payload.tourId && payload.tourId === props.tour.id && payload.id === getAssignedId(kind)) {
    return
  }

  emit('assign', { tourId: props.tour.id, kind, resourceId: payload.id })
}

function getAssignedId(kind: AssignmentDragKind): string | null {
  return kind === 'driver' ? props.tour.driverId : props.tour.vehicleId
}

function onAssignedDragStart(event: DragEvent, kind: AssignmentDragKind) {
  if (props.readonly) return
  const id = getAssignedId(kind)
  const label = kind === 'driver' ? driverName.value : vehicleLabel.value
  if (!id || !label) {
    event.preventDefault()
    return
  }
  setDragPayload(event, { kind, id, label, tourId: props.tour.id })
}

function onUnassign(kind: AssignmentDragKind) {
  if (props.readonly) return
  emit('unassign', { tourId: props.tour.id, kind })
}

function onCardClick() {
  if (!isTapTarget.value) return
  emit('tapAssign', { tourId: props.tour.id })
}
</script>

<template>
  <article
    class="rounded-xl border border-white/10 bg-white/5 p-3 transition-colors"
    :class="[
      isTapTarget ? 'cursor-pointer ring-1 ring-brand-500/40' : '',
      assigning ? 'opacity-60' : '',
    ]"
    @click="onCardClick"
  >
    <DispatcherTourCardHeader
      :tour="tour"
      :dot-class="dotClass"
      :assignment-status="assignmentStatus"
    />

    <DispatcherTourCardAssignment
      :tour="tour"
      :driver-name="driverName"
      :vehicle-label="vehicleLabel"
      :readonly="readonly"
      :drop-target="dropTarget"
      @drag-over="onDragOver"
      @drag-leave="onDragLeave"
      @drop="onDrop"
      @assigned-drag-start="onAssignedDragStart"
      @unassign="onUnassign"
    />
  </article>
</template>
