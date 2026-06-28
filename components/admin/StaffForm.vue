<script setup lang="ts">
import {
  EMPLOYMENT_TYPES,
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
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="firstName">Vorname</label>
        <input id="firstName" v-model="form.firstName" required class="input-field" autocomplete="given-name">
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="lastName">Nachname</label>
        <input id="lastName" v-model="form.lastName" required class="input-field" autocomplete="family-name">
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="phone">Telefon</label>
        <input id="phone" v-model="form.phone" type="tel" class="input-field" autocomplete="tel">
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="email">E-Mail</label>
        <input id="email" v-model="form.email" type="email" class="input-field" autocomplete="email">
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="jobRole">Funktion</label>
        <select id="jobRole" v-model="form.jobRole" class="input-field">
          <option v-for="role in STAFF_JOB_ROLES" :key="role" :value="role">
            {{ STAFF_JOB_ROLE_LABELS[role] }}
          </option>
        </select>
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-slate-400" for="employmentType">Anstellung</label>
        <select id="employmentType" v-model="form.employmentType" class="input-field">
          <option value="full">Vollzeit</option>
          <option value="part">Teilzeit</option>
        </select>
      </div>
    </div>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Führerschein</legend>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="license in LICENSE_CLASSES"
          :key="license"
          type="button"
          class="min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          :class="form.licenseClasses.includes(license)
            ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'"
          @click="toggleLicense(license)"
        >
          Klasse {{ license }}
        </button>
      </div>
    </fieldset>

    <fieldset class="space-y-2">
      <legend class="text-xs font-medium text-slate-400">Qualifikationen</legend>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="q in STAFF_QUALIFICATIONS"
          :key="q"
          type="button"
          class="min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          :class="form.qualifications.includes(q)
            ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'"
          @click="toggleQualification(q)"
        >
          {{ q }}
        </button>
      </div>
    </fieldset>

    <label class="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500/30">
      <span class="text-sm text-slate-200">Aktiv im Dienstplan</span>
    </label>

    <div class="flex gap-3 pt-2">
      <slot name="actions" />
    </div>
  </form>
</template>
