<template>
  <div class="flex min-h-screen flex-col bg-base">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24">
      <slot />
    </main>
    <AppBottomNav />
  </div>
</template>
