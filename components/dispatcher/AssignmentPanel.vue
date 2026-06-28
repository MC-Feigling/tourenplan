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

const dotClasses = {
  ok: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
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

function driverOptionLabel(driver: AssignmentDriverContext): string {
  if (driver.onLeave) return `${driver.fullName} — abwesend`
  return driver.fullName
}

function vehicleOptionLabel(vehicle: AssignmentVehicleContext): string {
  if (vehicle.status !== 'available') {
    return `${vehicle.plateNumber} — ${VEHICLE_STATUS_LABELS[vehicle.status]}`
  }
  return `${vehicle.plateNumber} · ${vehicle.name}`
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-white">Zuweisung</h2>
      <span
        v-if="result"
        class="rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
        :class="statusClasses[result.overallStatus]"
      >
        {{ statusLabels[result.overallStatus] }}
      </span>
      <span v-else-if="loading" class="text-xs text-slate-500">Prüfe…</span>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="block text-xs text-slate-400">Fahrer</label>
        <select
          :value="driverId"
          :disabled="!canEdit"
          class="input-field"
          @change="emit('update:driverId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">— Kein Fahrer —</option>
          <option
            v-for="driver in availableDrivers"
            :key="driver.id"
            :value="driver.id"
            :disabled="driver.onLeave"
          >
            {{ driverOptionLabel(driver) }}
          </option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs text-slate-400">Fahrzeug</label>
        <select
          :value="vehicleId"
          :disabled="!canEdit"
          class="input-field"
          @change="emit('update:vehicleId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">— Kein Fahrzeug —</option>
          <option
            v-for="vehicle in availableVehicles"
            :key="vehicle.id"
            :value="vehicle.id"
            :disabled="vehicle.status !== 'available'"
          >
            {{ vehicleOptionLabel(vehicle) }}
          </option>
        </select>
      </div>
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
