<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
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

function dropZoneClass(kind: AssignmentDragKind): string {
  const active = dropTarget.value === kind
  return active
    ? 'border-brand-500/50 bg-brand-500/10'
    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
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

    <div class="mt-2 grid gap-1.5">
      <div
        class="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors"
        :class="dropZoneClass('driver')"
        @dragover="onDragOver($event, 'driver')"
        @dragleave="onDragLeave('driver')"
        @drop="onDrop($event, 'driver')"
      >
        <span class="shrink-0 text-slate-500">Fahrer</span>
        <span
          v-if="driverName"
          class="min-w-0 flex-1 truncate font-medium text-white"
          :draggable="!readonly"
          @dragstart="onAssignedDragStart($event, 'driver')"
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
          @click.stop="onUnassign('driver')"
        >
          ×
        </button>
      </div>

      <div
        class="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors"
        :class="dropZoneClass('vehicle')"
        @dragover="onDragOver($event, 'vehicle')"
        @dragleave="onDragLeave('vehicle')"
        @drop="onDrop($event, 'vehicle')"
      >
        <span class="shrink-0 text-slate-500">Fahrzeug</span>
        <span
          v-if="vehicleLabel"
          class="min-w-0 flex-1 truncate font-medium text-white"
          :draggable="!readonly"
          @dragstart="onAssignedDragStart($event, 'vehicle')"
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
          @click.stop="onUnassign('vehicle')"
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
  </article>
</template>
