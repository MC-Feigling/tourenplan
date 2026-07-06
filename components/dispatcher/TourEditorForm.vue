<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPES, TOUR_STATUSES, TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import type { TourFormState } from '~/composables/useToursApi'

const form = defineModel<TourFormState>({ required: true })

defineProps<{
  canEdit: boolean
  isNew: boolean
  complianceProfile: string | null
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  delete: []
}>()
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-5">
    <div class="surface-card space-y-4 p-5 lg:col-span-2">
      <h2 class="text-sm font-semibold text-white">Stammdaten</h2>

      <div class="space-y-1.5">
        <label class="block text-xs text-slate-400">Typ</label>
        <select v-model="form.type" :disabled="!canEdit || !isNew" class="input-field">
          <option v-for="t in TOUR_TYPES" :key="t" :value="t">{{ TOUR_TYPE_LABELS[t] }}</option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs text-slate-400">Name</label>
        <input v-model="form.name" required :disabled="!canEdit" class="input-field">
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Datum</label>
          <input v-model="form.date" type="date" required :disabled="!canEdit" class="input-field">
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Status</label>
          <select v-model="form.status" :disabled="!canEdit" class="input-field">
            <option v-for="s in TOUR_STATUSES" :key="s" :value="s">{{ TOUR_STATUS_LABELS[s] }}</option>
          </select>
        </div>
      </div>

      <div v-if="form.type === 'line'" class="space-y-1.5">
        <label class="block text-xs text-slate-400">Linienlänge (km)</label>
        <input v-model="form.lineLengthKm" type="number" min="0" step="0.1" :disabled="!canEdit" class="input-field">
      </div>

      <div v-if="complianceProfile" class="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
        Compliance: {{ COMPLIANCE_PROFILE_LABELS[complianceProfile as keyof typeof COMPLIANCE_PROFILE_LABELS] }}
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs text-slate-400">Notizen</label>
        <textarea v-model="form.notes" rows="3" :disabled="!canEdit" class="input-field resize-none" />
      </div>

      <div v-if="canEdit" class="flex flex-wrap gap-2 pt-2">
        <button type="button" class="btn-primary" :disabled="saving" @click="emit('save')">
          {{ saving ? 'Speichern…' : 'Speichern' }}
        </button>
        <button v-if="!isNew" type="button" class="btn-ghost !text-red-300" @click="emit('delete')">
          Löschen
        </button>
      </div>
    </div>

    <div class="surface-card p-5 lg:col-span-3">
      <DispatcherTourStopEditor v-model="form.stops" :disabled="!canEdit" />
    </div>
  </div>
</template>
