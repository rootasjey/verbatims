<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <AppMastheadBar />
    <main class="pb-10">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <SponsorBar />
    </ClientOnly>
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
