<script setup lang="ts">
defineProps<{
  weekLabel: string
  weekStart: string
  selectedDate: string
  canEdit: boolean
  templatesCount: number
  generating: boolean
  generateMessage: string | null
}>()

const emit = defineEmits<{
  prevWeek: []
  nextWeek: []
  today: []
  generateLines: []
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2">
      <button type="button" class="btn-ghost !min-h-10 !px-3" aria-label="Vorherige Woche" @click="emit('prevWeek')">←</button>
      <div class="min-w-[10rem] text-center">
        <p class="font-display text-lg font-bold text-white">{{ weekLabel }}</p>
      </div>
      <button type="button" class="btn-ghost !min-h-10 !px-3" aria-label="Nächste Woche" @click="emit('nextWeek')">→</button>
      <button type="button" class="btn-ghost !min-h-10 !px-3 text-xs" @click="emit('today')">Heute</button>
    </div>

    <div v-if="canEdit" class="flex flex-wrap gap-2">
      <button
        v-if="templatesCount"
        type="button"
        class="btn-ghost"
        :disabled="generating"
        @click="emit('generateLines')"
      >
        {{ generating ? 'Generiere…' : 'Linien generieren' }}
      </button>
      <NuxtLink :to="`/dispatcher/tours/new?date=${selectedDate || weekStart}`" class="btn-primary no-underline">
        + Ausflug
      </NuxtLink>
      <NuxtLink to="/dispatcher/lines" class="btn-ghost no-underline">Linien</NuxtLink>
    </div>
  </div>

  <p v-if="generateMessage" class="text-sm text-brand-300" role="status">{{ generateMessage }}</p>
</template>
