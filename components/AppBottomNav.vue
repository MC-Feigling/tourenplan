<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/driver', label: 'Touren', icon: 'tours' },
] as const

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    aria-label="Hauptnavigation"
  >
    <div class="flex h-16 items-stretch justify-around">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-1 flex-col items-center justify-center gap-1 no-underline"
        :class="isActive(item.to) ? 'text-brand-400' : 'text-slate-500'"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
