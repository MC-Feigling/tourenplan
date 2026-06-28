<script setup lang="ts">
import { LEAVE_TYPE_LABELS } from '~/shared/constants/staff'
import type { PublicLeaveRequest } from '~/shared/types/staff'
import { emptyLeaveForm, emptyStaffForm, staffToForm } from '~/composables/useStaffApi'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const router = useRouter()
const api = useStaffApi()

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const form = ref(emptyStaffForm())
const leaveRequests = ref<PublicLeaveRequest[]>([])
const leaveForm = ref(emptyLeaveForm())
const showLeaveForm = ref(false)
const saveError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

async function load() {
  if (isNew.value) return
  const res = await api.get(id.value)
  form.value = staffToForm(res.item)
  leaveRequests.value = res.leaveRequests
}

if (!isNew.value) {
  await load()
}

const pageTitle = computed(() =>
  isNew.value ? 'Mitarbeiter anlegen' : `${form.value.firstName} ${form.value.lastName}`.trim() || 'Mitarbeiter',
)

useHead({ title: pageTitle })

async function onSave() {
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.create(form.value)
      await router.replace(`/admin/staff/${res.item.id}`)
    } else {
      await api.update(id.value, form.value)
      await load()
    }
  } catch {
    saveError.value = api.error.value
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (isNew.value) return
  if (!confirm('Mitarbeiter wirklich löschen?')) return
  deleting.value = true
  try {
    await api.remove(id.value)
    await router.push('/admin/staff')
  } catch {
    saveError.value = api.error.value
  } finally {
    deleting.value = false
  }
}

async function onAddLeave() {
  saveError.value = null
  try {
    const res = await api.addLeave(id.value, leaveForm.value)
    leaveRequests.value = [res.item, ...leaveRequests.value]
    leaveForm.value = emptyLeaveForm()
    showLeaveForm.value = false
  } catch {
    saveError.value = api.error.value
  }
}

async function onRemoveLeave(leaveId: string) {
  if (!confirm('Abwesenheit entfernen?')) return
  await api.removeLeave(leaveId)
  leaveRequests.value = leaveRequests.value.filter((l) => l.id !== leaveId)
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="pageTitle" :description="isNew ? 'Neuen Mitarbeiter erfassen' : 'Stammdaten bearbeiten'">
      <template #actions>
        <NuxtLink to="/admin/staff" class="btn-ghost no-underline">← Zurück</NuxtLink>
      </template>
    </AdminPageHeader>

    <div
      v-if="saveError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ saveError }}
    </div>

    <div class="surface-card p-5 sm:p-6">
      <AdminStaffForm v-model="form" @submit="onSave">
        <template #actions>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Speichern…' : 'Speichern' }}
          </button>
          <button
            v-if="!isNew"
            type="button"
            class="btn-ghost !text-red-300"
            :disabled="deleting"
            @click="onDelete"
          >
            Löschen
          </button>
        </template>
      </AdminStaffForm>
    </div>

    <section v-if="!isNew" class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-white">Abwesenheit</h2>
        <button type="button" class="btn-ghost" @click="showLeaveForm = !showLeaveForm">
          {{ showLeaveForm ? 'Abbrechen' : '+ Eintragen' }}
        </button>
      </div>

      <div v-if="showLeaveForm" class="surface-card p-5">
        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onAddLeave">
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-400">Von</label>
            <input v-model="leaveForm.startDate" type="date" required class="input-field">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-400">Bis</label>
            <input v-model="leaveForm.endDate" type="date" required class="input-field">
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs font-medium text-slate-400">Art</label>
            <select v-model="leaveForm.type" class="input-field">
              <option value="vacation">Urlaub</option>
              <option value="sick">Krank</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs font-medium text-slate-400">Notiz</label>
            <input v-model="leaveForm.note" class="input-field" placeholder="optional">
          </div>
          <div class="sm:col-span-2">
            <button type="submit" class="btn-primary">Abwesenheit speichern</button>
          </div>
        </form>
      </div>

      <div v-if="leaveRequests.length === 0" class="text-sm text-slate-500">Keine Abwesenheiten eingetragen.</div>

      <ul v-else class="space-y-2">
        <li
          v-for="leave in leaveRequests"
          :key="leave.id"
          class="surface-card flex items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p class="text-sm font-medium text-white">
              {{ LEAVE_TYPE_LABELS[leave.type] }}
              <span class="font-normal text-slate-400">· {{ leave.startDate }} – {{ leave.endDate }}</span>
            </p>
            <p v-if="leave.note" class="mt-0.5 text-xs text-slate-500">{{ leave.note }}</p>
          </div>
          <button type="button" class="btn-ghost !min-h-9 !px-3 !py-1.5 text-xs !text-red-300" @click="onRemoveLeave(leave.id)">
            Entfernen
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
