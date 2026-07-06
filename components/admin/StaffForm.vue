<script setup lang="ts">
import {
  LICENSE_CLASSES,
  STAFF_JOB_ROLES,
  STAFF_QUALIFICATIONS,
  STAFF_JOB_ROLE_LABELS,
} from '~/shared/constants/staff'
import type { StaffFormState } from '~/composables/useStaffApi'

const form = defineModel<StaffFormState>({ required: true })

const emit = defineEmits<{
  submit: []
}>()

const jobRoleItems = STAFF_JOB_ROLES.map((role) => ({
  label: STAFF_JOB_ROLE_LABELS[role],
  value: role,
}))

const employmentItems = [
  { label: 'Vollzeit', value: 'full' },
  { label: 'Teilzeit', value: 'part' },
]

function toggleLicense(license: (typeof LICENSE_CLASSES)[number]) {
  const set = new Set(form.value.licenseClasses)
  if (set.has(license)) set.delete(license)
  else set.add(license)
  form.value.licenseClasses = [...set]
}

function toggleQualification(q: (typeof STAFF_QUALIFICATIONS)[number]) {
  const set = new Set(form.value.qualifications)
  if (set.has(q)) set.delete(q)
  else set.add(q)
  form.value.qualifications = [...set]
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit')">
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Vorname" name="firstName">
        <UInput id="firstName" v-model="form.firstName" required autocomplete="given-name" class="w-full" />
      </UFormField>
      <UFormField label="Nachname" name="lastName">
        <UInput id="lastName" v-model="form.lastName" required autocomplete="family-name" class="w-full" />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Telefon" name="phone">
        <UInput id="phone" v-model="form.phone" type="tel" autocomplete="tel" class="w-full" />
      </UFormField>
      <UFormField label="E-Mail" name="email">
        <UInput id="email" v-model="form.email" type="email" autocomplete="email" class="w-full" />
      </UFormField>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Funktion" name="jobRole">
        <USelect id="jobRole" v-model="form.jobRole" :items="jobRoleItems" class="w-full" />
      </UFormField>
      <UFormField label="Anstellung" name="employmentType">
        <USelect id="employmentType" v-model="form.employmentType" :items="employmentItems" class="w-full" />
      </UFormField>
    </div>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Führerschein</legend>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="license in LICENSE_CLASSES"
          :key="license"
          type="button"
          size="sm"
          :variant="form.licenseClasses.includes(license) ? 'soft' : 'outline'"
          :color="form.licenseClasses.includes(license) ? 'primary' : 'neutral'"
          @click="toggleLicense(license)"
        >
          Klasse {{ license }}
        </UButton>
      </div>
    </fieldset>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Qualifikationen</legend>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="q in STAFF_QUALIFICATIONS"
          :key="q"
          type="button"
          size="sm"
          :variant="form.qualifications.includes(q) ? 'soft' : 'outline'"
          :color="form.qualifications.includes(q) ? 'primary' : 'neutral'"
          @click="toggleQualification(q)"
        >
          {{ q }}
        </UButton>
      </div>
    </fieldset>

    <UCheckbox v-model="form.active" label="Aktiv im Dienstplan" />

    <div class="flex gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
