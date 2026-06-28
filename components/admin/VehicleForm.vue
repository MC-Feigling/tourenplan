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
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="plateNumber">Kennzeichen</label>
        <input
          id="plateNumber"
          v-model="form.plateNumber"
          required
          class="input-field uppercase"
          placeholder="M-AB 1234"
        >
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="name">Bezeichnung</label>
        <input id="name" v-model="form.name" required class="input-field" placeholder="Setra 516">
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="seats">Sitze (inkl. Fahrer)</label>
        <input id="seats" v-model.number="form.seats" type="number" min="1" max="120" required class="input-field">
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="vehicleClass">Fahrzeugtyp</label>
        <select id="vehicleClass" v-model="form.vehicleClass" class="input-field">
          <option v-for="cls in VEHICLE_CLASSES" :key="cls" :value="cls">
            {{ VEHICLE_CLASS_LABELS[cls] }}
          </option>
        </select>
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="status">Status</label>
        <select id="status" v-model="form.status" class="input-field">
          <option v-for="s in VEHICLE_STATUSES" :key="s" :value="s">
            {{ VEHICLE_STATUS_LABELS[s] }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="tachoType">Tachograph</label>
        <select id="tachoType" v-model="form.tachoType" class="input-field">
          <option v-for="t in TACHO_TYPES" :key="t" :value="t">
            {{ TACHO_TYPE_LABELS[t] }}
          </option>
        </select>
        <p v-if="requiresTacho" class="text-xs text-amber-400/80">≥9 Sitze: Tachograph-Pflicht beachten</p>
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="nextInspection">Nächste HU</label>
        <input id="nextInspection" v-model="form.nextInspectionDate" type="date" class="input-field">
      </div>
    </div>

    <div class="space-y-1.5">
      <label class="block text-xs font-medium text-slate-400" for="nextMaintenanceKm">Nächste Wartung (km)</label>
      <input id="nextMaintenanceKm" v-model="form.nextMaintenanceKm" type="number" min="0" class="input-field" placeholder="optional">
    </div>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Ausstattung</legend>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="feature in VEHICLE_FEATURES"
          :key="feature"
          type="button"
          class="min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          :class="form.features.includes(feature)
            ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'"
          @click="toggleFeature(feature)"
        >
          {{ VEHICLE_FEATURE_LABELS[feature] }}
        </button>
      </div>
    </fieldset>

    <div class="space-y-1.5">
      <label class="block text-xs font-medium text-slate-400" for="notes">Notizen</label>
      <textarea id="notes" v-model="form.notes" rows="3" class="input-field resize-none" />
    </div>

    <div class="flex gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
