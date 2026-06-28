<script setup lang="ts">
import type { VehicleStatus } from '~/shared/constants/vehicles'
import { VEHICLE_STATUS_LABELS } from '~/shared/constants/vehicles'

const props = defineProps<{
  status: VehicleStatus
  small?: boolean
}>()

const classes: Record<VehicleStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  maintenance: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  out_of_service: 'bg-red-500/15 text-red-300 ring-red-500/30',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium ring-1 ring-inset"
    :class="[classes[status], small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs']"
  >
    {{ VEHICLE_STATUS_LABELS[status] }}
  </span>
</template>
