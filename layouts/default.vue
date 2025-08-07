<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09] mb-12">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
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
