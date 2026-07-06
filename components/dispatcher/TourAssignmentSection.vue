<script setup lang="ts">
import type { AssignmentCheckResult } from '~/composables/useAssignmentApi'
import type { AssignmentDriverContext, AssignmentVehicleContext } from '~/shared/assignment/types'

const driverId = defineModel<string>('driverId', { required: true })
const vehicleId = defineModel<string>('vehicleId', { required: true })

defineProps<{
  result: AssignmentCheckResult | null
  loading: boolean
  drivers: AssignmentDriverContext[]
  vehicles: AssignmentVehicleContext[]
  canEdit: boolean
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="surface-card p-5">
      <DispatcherAssignmentPanel
        v-model:driver-id="driverId"
        v-model:vehicle-id="vehicleId"
        :result="result"
        :loading="loading"
        :drivers="drivers"
        :vehicles="vehicles"
        :can-edit="canEdit"
      />
    </div>

    <div class="surface-card p-5">
      <DispatcherCompliancePanel
        :result="result?.compliance ?? null"
        :loading="loading"
      />
    </div>
  </div>
</template>
