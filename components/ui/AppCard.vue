<script setup lang="ts">
import { APP_CARD_UI } from '~/shared/constants/ui'

const props = withDefaults(
  defineProps<{
    bodyClass?: string
  }>(),
  {
    bodyClass: 'p-5',
  },
)
</script>

<template>
  <UCard
    variant="subtle"
    v-bind="$attrs"
    :ui="{
      root: APP_CARD_UI.root,
      body: props.bodyClass,
    }"
  >
    <slot />
  </UCard>
</template>
