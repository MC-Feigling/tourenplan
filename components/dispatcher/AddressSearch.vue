<script setup lang="ts">
import type { GeocodeResult } from '~/shared/types/routing'
import { MIN_QUERY_LENGTH } from '~/shared/constants/routing'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [result: GeocodeResult]
}>()

const routing = useRoutingApi()
const routingLoading = routing.loading
const routingError = routing.error
const open = ref(false)
const results = ref<GeocodeResult[]>([])
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
    scheduleSearch(value)
  },
})

function scheduleSearch(query: string) {
  if (searchTimeout) clearTimeout(searchTimeout)
  const trimmed = query.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) {
    results.value = []
    open.value = false
    return
  }
  searchTimeout = setTimeout(() => void runSearch(trimmed), 350)
}

async function runSearch(query: string) {
  try {
    const res = await routing.geocode(query)
    results.value = res.items
    open.value = res.items.length > 0
  } catch {
    results.value = []
    open.value = false
  }
}

function onSelect(result: GeocodeResult) {
  emit('update:modelValue', result.address)
  emit('select', result)
  open.value = false
  results.value = []
}

function onBlur() {
  window.setTimeout(() => {
    open.value = false
  }, 150)
}
</script>

<template>
  <div class="relative">
    <input
      v-model="inputValue"
      :disabled="disabled"
      :placeholder="placeholder ?? 'Adresse suchen…'"
      class="input-field"
      autocomplete="off"
      @focus="results.length && (open = true)"
      @blur="onBlur"
    >
    <ul
      v-if="open && results.length"
      class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-white/10 bg-surface shadow-xl"
      role="listbox"
    >
      <li
        v-for="(result, index) in results"
        :key="`${result.lat}-${result.lng}-${index}`"
        role="option"
      >
        <button
          type="button"
          class="w-full px-3 py-2.5 text-left text-sm hover:bg-white/10"
          @mousedown.prevent="onSelect(result)"
        >
          <span class="block font-medium text-white">{{ result.name }}</span>
          <span class="block text-xs text-slate-400">{{ result.address }}</span>
        </button>
      </li>
    </ul>
    <p v-if="routingLoading" class="mt-1 text-xs text-slate-500">Suche…</p>
    <p v-else-if="routingError" class="mt-1 text-xs text-red-300">{{ routingError }}</p>
  </div>
</template>
