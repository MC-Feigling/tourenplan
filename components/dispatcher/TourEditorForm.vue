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

const tourTypeItems = TOUR_TYPES.map((t) => ({ label: TOUR_TYPE_LABELS[t], value: t }))
const tourStatusItems = TOUR_STATUSES.map((s) => ({ label: TOUR_STATUS_LABELS[s], value: s }))
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-5">
    <UiAppCard body-class="space-y-4 p-5 lg:col-span-2">
      <h2 class="text-sm font-semibold text-white">Stammdaten</h2>

      <UFormField label="Typ" name="type">
        <USelect
          v-model="form.type"
          :items="tourTypeItems"
          :disabled="!canEdit || !isNew"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Name" name="name">
        <UInput v-model="form.name" required :disabled="!canEdit" class="w-full" />
      </UFormField>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Datum" name="date">
          <UInput v-model="form.date" type="date" required :disabled="!canEdit" class="w-full" />
        </UFormField>
        <UFormField label="Status" name="status">
          <USelect
            v-model="form.status"
            :items="tourStatusItems"
            :disabled="!canEdit"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField v-if="form.type === 'line'" label="Linienlänge (km)" name="lineLengthKm">
        <UInput
          v-model="form.lineLengthKm"
          type="number"
          min="0"
          step="0.1"
          :disabled="!canEdit"
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="complianceProfile"
        color="primary"
        variant="subtle"
        :title="`Compliance: ${COMPLIANCE_PROFILE_LABELS[complianceProfile as keyof typeof COMPLIANCE_PROFILE_LABELS]}`"
      />

      <UFormField label="Notizen" name="notes">
        <UTextarea v-model="form.notes" :rows="3" :disabled="!canEdit" class="w-full" />
      </UFormField>

      <div v-if="canEdit" class="flex flex-wrap gap-2 pt-2">
        <UButton color="primary" :loading="saving" @click="emit('save')">
          Speichern
        </UButton>
        <UButton v-if="!isNew" variant="ghost" color="error" @click="emit('delete')">
          Löschen
        </UButton>
      </div>
    </UiAppCard>

    <UiAppCard body-class="p-5 lg:col-span-3">
      <DispatcherTourStopEditor v-model="form.stops" :disabled="!canEdit" />
    </UiAppCard>
  </div>
</template>
