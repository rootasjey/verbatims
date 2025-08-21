<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0C0A09] dark:to-gray-900 mobile-layout">
    <header
      class="fixed top-0 left-0 right-0 z-40 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur-md px-4 py-3 safe-area-pt"
    >
      <div 
        @click.self="scrollToTop"
        class="flex items-center justify-between">
        <div class="flex items-center">
          <UButton
            v-if="canGoBack"
            icon
            btn="ghost-gray"
            label="i-ph-arrow-left-bold"
            @click="handleBackClick"
            class="mr-3"
            size="sm"
          />

          <div class="flex items-center space-x-2">
            <UButton
              icon
              btn="~"
              @click="handleAppIconClick"
              size="sm"
              class="text-gray-600 dark:text-gray-400"
            >
              <AppIcon icon :outline="true" :size="24" />
            </UButton>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <UButton
            icon
            btn="ghost-gray"
            label="i-ph-flag-duotone"
            size="sm"
            class="text-gray-600 dark:text-gray-400"
            @click="showReportDrawer = true"
          />
        </div>
      </div>
    </header>
    
    <!-- Main Content with proper spacing for fixed header and bottom nav -->
    <main class="-mt-24 pt-24 pb-24 min-h-screen">
      <slot />
    </main>

    <!-- Global Modals -->
    <AddQuoteDialog
      v-model="showAddQuote"
      @quote-added="handleQuoteAdded"
    />

    <!-- Report Drawer for mobile bug/feedback reports -->
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

// Check if we can go back in navigation history
const canGoBack = computed(() => {
  // Check if there's navigation history or if we're not on the home page
  return route.path !== '/' && (import.meta.client ? window.history.length > 1 : false)
})

const handleBackClick = () => {
  if (import.meta.client && window.history.length > 1) {
    router.back()
  } else {
    // Fallback to home if no history
    navigateTo('/')
  }
}

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

// Set page meta to use mobile layout on mobile devices
definePageMeta({
  layout: false // We'll handle layout switching in the page components
})
</script>

<style scoped>
/* Mobile-specific styles */
.mobile-layout {
  /* Ensure proper spacing for fixed elements */
  --header-height: 64px;
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
