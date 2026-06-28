<script setup lang="ts">
import { emptyVehicleForm, vehicleToForm } from '~/composables/useVehiclesApi'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const router = useRouter()
const api = useVehiclesApi()

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const form = ref(emptyVehicleForm())
const saveError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

async function load() {
  if (isNew.value) return
  const res = await api.get(id.value)
  form.value = vehicleToForm(res.item)
}

if (!isNew.value) {
  await load()
}

const pageTitle = computed(() =>
  isNew.value ? 'Fahrzeug anlegen' : form.value.name || 'Fahrzeug',
)

useHead({ title: pageTitle })

async function onSave() {
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.create(form.value)
      await router.replace(`/admin/vehicles/${res.item.id}`)
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
  if (!confirm('Fahrzeug wirklich löschen?')) return
  deleting.value = true
  try {
    await api.remove(id.value)
    await router.push('/admin/vehicles')
  } catch {
    saveError.value = api.error.value
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="pageTitle" :description="isNew ? 'Neues Fahrzeug erfassen' : 'Fahrzeugdaten bearbeiten'">
      <template #actions>
        <NuxtLink to="/admin/vehicles" class="btn-ghost no-underline">← Zurück</NuxtLink>
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
      <AdminVehicleForm v-model="form" @submit="onSave">
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
      </AdminVehicleForm>
    </div>
  </div>
</template>
