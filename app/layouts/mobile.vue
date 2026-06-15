<template>
  <div class="min-h-screen mobile-layout bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <header
      class="fixed top-0 left-0 right-0 z-40 bg-gray-100 dark:bg-gray-800 backdrop-blur-md px-4 py-3 safe-area-pt border-b border-dashed border-gray-200 dark:border-gray-800"
    >
      <div
        @click.self="scrollToTop"
        class="flex items-center justify-between"
      >
        <div class="flex items-center">
          <div class="flex items-center space-x-2">
            <NButton
              btn="~"
              @click="handleAppIconClick"
              size="sm"
              class="m-0 p-3"
            >
              <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
            </NButton>
          </div>
        </div>

         <div class="h-2 w-2 rounded-full bg-gray-200 block" />
        <span class="inline font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>
      </div>
    </header>

    <!-- Main Content with proper spacing for fixed header and bottom nav -->
    <main class="mt-14 pb-28 min-h-screen">
      <slot />
    </main>

    <AddQuoteDrawer
      v-model:open="showAddQuote"
      @submitted="handleQuoteAdded"
    />

    <ReportDrawer
      v-model:open="showReportDrawer"
      :target-type="'general'"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const showAddQuote = ref(false)
const showReportDrawer = ref(false)

const handleQuoteAdded = () => {
  // Handle quote added - could refresh data or show toast
  showAddQuote.value = false
}

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

  // If we're on the home page, prevent navigation and scroll to top instead
  event.preventDefault()
  scrollToTop()
}

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
})

</script>

<style scoped>
/* Mobile-specific styles */
.mobile-layout {
  /* Ensure proper spacing for fixed elements */
  --header-height: 56px;
  --bottom-nav-height: 80px;
}

/* Safe area support for devices with notches */
.safe-area-pt {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

/* Override any desktop-specific styles */
@media (max-width: 767px) {
  .mobile-layout main {
    /* Ensure content doesn't get hidden behind fixed elements */
    min-height: calc(100vh - var(--header-height) - var(--bottom-nav-height));
  }
}

/* Hide desktop header when using mobile layout */
.mobile-layout :deep(.desktop-header) {
  display: none;
}
</style>
