<script setup lang="ts">
import type { AssignmentCheckResult } from '~/composables/useAssignmentApi'
import type { AssignmentDriverContext, AssignmentVehicleContext } from '~/shared/assignment/types'
import { VEHICLE_STATUS_LABELS } from '~/shared/constants/vehicles'

const props = defineProps<{
  result: AssignmentCheckResult | null
  loading?: boolean
  drivers: AssignmentDriverContext[]
  vehicles: AssignmentVehicleContext[]
  driverId: string
  vehicleId: string
  canEdit?: boolean
}>()

const emit = defineEmits<{
  'update:driverId': [value: string]
  'update:vehicleId': [value: string]
}>()

const statusClasses = {
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
}

const statusLabels = {
  ok: 'Zuweisung ok',
  warning: 'Hinweise',
  error: 'Konflikte',
}

const severityDot = {
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-slate-400',
}

const availableDrivers = computed(() =>
  props.drivers.filter((driver) => driver.active),
)

const availableVehicles = computed(() => props.vehicles)

const driverModel = computed({
  get: () => props.driverId,
  set: (value: string) => emit('update:driverId', value),
})

const vehicleModel = computed({
  get: () => props.vehicleId,
  set: (value: string) => emit('update:vehicleId', value),
})

const driverItems = computed(() => [
  { label: '— Kein Fahrer —', value: '' },
  ...availableDrivers.value.map((driver) => ({
    label: driver.onLeave ? `${driver.fullName} — abwesend` : driver.fullName,
    value: driver.id,
    disabled: driver.onLeave,
  })),
])

const vehicleItems = computed(() => [
  { label: '— Kein Fahrzeug —', value: '' },
  ...availableVehicles.value.map((vehicle) => ({
    label: vehicle.status !== 'available'
      ? `${vehicle.plateNumber} — ${VEHICLE_STATUS_LABELS[vehicle.status]}`
      : `${vehicle.plateNumber} · ${vehicle.name}`,
    value: vehicle.id,
    disabled: vehicle.status !== 'available',
  })),
])
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-white">Zuweisung</h2>
      <UBadge
        v-if="result"
        :color="result.overallStatus === 'ok' ? 'success' : result.overallStatus === 'warning' ? 'warning' : 'error'"
        variant="subtle"
      >
        {{ statusLabels[result.overallStatus] }}
      </UBadge>
      <span v-else-if="loading" class="text-xs text-slate-500">Prüfe…</span>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Fahrer" name="driverId">
        <USelect
          v-model="driverModel"
          :items="driverItems"
          :disabled="!canEdit"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Fahrzeug" name="vehicleId">
        <USelect
          v-model="vehicleModel"
          :items="vehicleItems"
          :disabled="!canEdit"
          class="w-full"
        />
      </UFormField>
    </div>

    <ul v-if="result?.assignment.issues.length" class="space-y-2">
      <li
        v-for="(issue, index) in result.assignment.issues"
        :key="`assignment-${issue.code}-${index}`"
        class="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
      >
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="severityDot[issue.severity]" />
        <span class="text-slate-200">{{ issue.message }}</span>
      </li>
    </ul>

    <ul v-if="result?.compliance?.issues.length" class="space-y-2">
      <li
        v-for="(issue, index) in result.compliance.issues"
        :key="`compliance-${issue.code}-${index}`"
        class="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
      >
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="severityDot[issue.severity]" />
        <span class="text-slate-200">{{ issue.message }}</span>
      </li>
    </ul>

    <p
      v-else-if="result && result.overallStatus === 'ok'"
      class="text-sm text-slate-400"
    >
      Fahrer und Fahrzeug ohne Konflikte zugewiesen.
    </p>
  </div>
</template>
