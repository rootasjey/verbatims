<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <!-- Desktop header: hidden on screens < 768px -->
    <AppMastheadBar />

    <!-- Mobile header: hidden on screens >= 768px -->
    <header
      class="fixed top-0 left-0 right-0 z-40 md:hidden bg-gray-100 dark:bg-gray-800 backdrop-blur-md px-4 py-3 safe-area-pt border-b border-dashed border-gray-200 dark:border-gray-800"
    >
      <div
        class="flex items-center justify-between"
        @click.self="scrollToTop"
      >
        <div class="flex items-center">
          <NButton
            btn="~"
            @click="handleAppIconClick"
            size="sm"
            class="m-0 p-3"
          >
            <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl">verbatims</span>
          </NButton>
        </div>

        <span class="inline font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>
      </div>
    </header>

    <!-- Main content: responsive top/bottom spacing -->
    <main class="pt-14 md:pt-0 pb-28 md:pb-10">
      <slot />
    </main>

    <!-- Footer: hidden on mobile -->
    <AppFooter class="hidden md:block" />

    <ClientOnly>
      <SponsorBar />
    </ClientOnly>

    <!-- Mobile-only drawers (client-only to avoid SSR issues with NDrawer) -->
    <ClientOnly>
      <AddQuoteDrawer
        v-model:open="showAddQuote"
        @submitted="handleQuoteAdded"
      />
      <ReportDrawer
        v-model:open="showReportDrawer"
        :target-type="'general'"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const showAddQuote = ref(false)
const showReportDrawer = ref(false)

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
})

const scrollToTop = () => {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleAppIconClick = (event: MouseEvent) => {
  if (route.path !== '/') {
    navigateTo('/')
    return
  }
  event.preventDefault()
  scrollToTop()
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
}

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

<style scoped>
.safe-area-pt {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}
</style>
