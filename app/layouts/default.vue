<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <AppHeader />
    <main class="pt-16">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
  ]
})
</script>
