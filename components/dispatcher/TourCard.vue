<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import type { AssignmentResources } from '~/shared/assignment/weekSummary'
import { summarizeTourAssignment } from '~/shared/assignment/weekSummary'
import type { PublicTour } from '~/shared/types/tours'

const props = defineProps<{
  tour: PublicTour
  readonly?: boolean
  allTours: PublicTour[]
  resources: AssignmentResources | null
}>()

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
</script>

<template>
  <NuxtLink
    :to="`/dispatcher/tours/${tour.id}`"
    class="block rounded-xl border border-white/10 bg-white/5 p-3 no-underline transition-colors hover:border-brand-500/40 hover:bg-white/8"
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
      <span class="shrink-0 rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
        {{ TOUR_STATUS_LABELS[tour.status] }}
      </span>
    </div>

    <div v-if="driverName || vehicleLabel" class="mt-2 text-[10px] text-slate-400">
      <span v-if="driverName">{{ driverName }}</span>
      <span v-if="driverName && vehicleLabel"> · </span>
      <span v-if="vehicleLabel">{{ vehicleLabel }}</span>
    </div>

    <div class="mt-2 flex flex-wrap gap-2 text-[10px]">
      <span class="rounded-md bg-brand-500/10 px-1.5 py-0.5 text-brand-300">
        {{ tour.totalDrivingMinutes }} min Lenkzeit
      </span>
      <span class="rounded-md bg-slate-700/50 px-1.5 py-0.5 text-slate-400">
        {{ COMPLIANCE_PROFILE_LABELS[tour.complianceProfile] }}
      </span>
    </div>
  </NuxtLink>
</template>
