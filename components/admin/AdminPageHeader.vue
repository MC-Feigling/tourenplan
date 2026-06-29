<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()

const slots = defineSlots<{
  actions?: () => unknown
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="font-display text-2xl font-bold text-white">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-slate-400">{{ description }}</p>
    </div>
    <div v-if="slots.actions" class="flex shrink-0 gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
