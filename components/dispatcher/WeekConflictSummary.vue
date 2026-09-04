<script setup lang="ts">
const props = defineProps<{
  count: number
  dateLabels: string[]
  active: boolean
}>()

defineEmits<{
  toggle: []
}>()

const summaryText = computed(() => {
  if (props.count === 0) return ''
  const days = props.dateLabels.length ? ` · ${props.dateLabels.join(', ')}` : ''
  return `${props.count} Konflikt${props.count === 1 ? '' : 'e'}${days}`
})
</script>

<template>
  <button
    v-if="count > 0"
    type="button"
    class="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors"
    :class="active
      ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'"
    @click="$emit('toggle')"
  >
    <span>{{ summaryText }}</span>
    <span class="text-xs opacity-80">{{ active ? 'Hervorhebung aus' : 'Hervorheben' }}</span>
  </button>
</template>
