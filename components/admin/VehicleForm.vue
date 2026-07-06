<script setup lang="ts">
import {
  TACHO_TYPES,
  TACHO_TYPE_LABELS,
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  VEHICLE_FEATURES,
  VEHICLE_FEATURE_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
} from '~/shared/constants/vehicles'
import type { VehicleFormState } from '~/composables/useVehiclesApi'

const form = defineModel<VehicleFormState>({ required: true })

const emit = defineEmits<{
  submit: []
}>()

const requiresTacho = computed(() => form.value.seats >= 9)

const vehicleClassItems = VEHICLE_CLASSES.map((cls) => ({
  label: VEHICLE_CLASS_LABELS[cls],
  value: cls,
}))

const statusItems = VEHICLE_STATUSES.map((s) => ({
  label: VEHICLE_STATUS_LABELS[s],
  value: s,
}))

const tachoItems = TACHO_TYPES.map((t) => ({
  label: TACHO_TYPE_LABELS[t],
  value: t,
}))

function toggleFeature(feature: (typeof VEHICLE_FEATURES)[number]) {
  const set = new Set(form.value.features)
  if (set.has(feature)) set.delete(feature)
  else set.add(feature)
  form.value.features = [...set]
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit')">
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Kennzeichen" name="plateNumber">
        <UInput
          id="plateNumber"
          v-model="form.plateNumber"
          required
          class="w-full uppercase"
          placeholder="M-AB 1234"
        />
      </UFormField>
      <UFormField label="Bezeichnung" name="name">
        <UInput id="name" v-model="form.name" required class="w-full" placeholder="Setra 516" />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField label="Sitze (inkl. Fahrer)" name="seats">
        <UInput id="seats" v-model="form.seats" type="number" min="1" max="120" required class="w-full" />
      </UFormField>
      <UFormField label="Fahrzeugtyp" name="vehicleClass">
        <USelect id="vehicleClass" v-model="form.vehicleClass" :items="vehicleClassItems" class="w-full" />
      </UFormField>
      <UFormField label="Status" name="status">
        <USelect id="status" v-model="form.status" :items="statusItems" class="w-full" />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Tachograph" name="tachoType">
        <USelect id="tachoType" v-model="form.tachoType" :items="tachoItems" class="w-full" />
        <p v-if="requiresTacho" class="mt-1 text-xs text-amber-400/80">≥9 Sitze: Tachograph-Pflicht beachten</p>
      </UFormField>
      <UFormField label="Nächste HU" name="nextInspection">
        <UInput id="nextInspection" v-model="form.nextInspectionDate" type="date" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Nächste Wartung (km)" name="nextMaintenanceKm">
      <UInput
        id="nextMaintenanceKm"
        v-model="form.nextMaintenanceKm"
        type="number"
        min="0"
        class="w-full"
        placeholder="optional"
      />
    </UFormField>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Ausstattung</legend>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="feature in VEHICLE_FEATURES"
          :key="feature"
          type="button"
          size="sm"
          :variant="form.features.includes(feature) ? 'soft' : 'outline'"
          :color="form.features.includes(feature) ? 'primary' : 'neutral'"
          @click="toggleFeature(feature)"
        >
          {{ VEHICLE_FEATURE_LABELS[feature] }}
        </UButton>
      </div>
    </fieldset>

    <UFormField label="Notizen" name="notes">
      <UTextarea id="notes" v-model="form.notes" :rows="3" class="w-full" />
    </UFormField>

    <div class="flex gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
