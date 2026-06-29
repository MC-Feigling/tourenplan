<script setup lang="ts">
import type { AssignmentDragKind, AssignmentDragPayload } from '~/shared/assignment/dragPayload'
import { setDragPayload } from '~/shared/assignment/dragPayload'

const props = defineProps<{
  kind: AssignmentDragKind
  id: string
  label: string
  status: 'available' | 'assigned' | 'blocked'
  subtitle?: string | null
  tourId?: string
  draggable?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const isDraggable = computed(() => props.draggable !== false && props.status !== 'blocked')

const statusClasses = computed(() => {
  switch (props.status) {
    case 'available':
      return 'border-white/10 bg-white/5 hover:border-brand-500/30'
    case 'assigned':
      return 'border-amber-500/20 bg-amber-500/5'
    case 'blocked':
      return 'border-white/5 bg-white/[0.02] opacity-50'
    default:
      return 'border-white/10 bg-white/5'
  }
})

function onDragStart(event: DragEvent) {
  if (!isDraggable.value) {
    event.preventDefault()
    return
  }
  const payload: AssignmentDragPayload = {
    kind: props.kind,
    id: props.id,
    label: props.label,
    tourId: props.tourId,
  }
  setDragPayload(event, payload)
}

function onClick() {
  emit('select')
}
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors"
    :class="[
      statusClasses,
      isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed',
      selected ? 'ring-1 ring-brand-500/50' : '',
    ]"
    :draggable="isDraggable"
    role="button"
    tabindex="0"
    @dragstart="onDragStart"
    @click="onClick"
    @keydown.enter.prevent="onClick"
    @keydown.space.prevent="onClick"
  >
    <span
      class="h-2 w-2 shrink-0 rounded-full"
      :class="{
        'bg-emerald-400': status === 'available',
        'bg-amber-400': status === 'assigned',
        'bg-slate-500': status === 'blocked',
      }"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-white">{{ label }}</p>
      <p v-if="subtitle" class="truncate text-[10px] text-slate-500">{{ subtitle }}</p>
    </div>
  </div>
</template>
