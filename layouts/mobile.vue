<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0C0A09] dark:to-gray-900 mobile-layout">
    <header
      class="fixed top-0 left-0 right-0 z-40 dark:bg-[#0C0A09]/95 backdrop-blur-md px-4 py-3 safe-area-pt"
    >
      <div class="flex items-center justify-between">
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
            <AppIcon icon :outline="true" :size="24" />
          </div>
        </div>

        <!-- Right: Settings/Menu -->
        <div class="flex items-center space-x-2">
          <!-- Settings Button -->
          <UButton
            icon
            btn="ghost-gray"
            label="i-ph-gear-six-bold"
            @click="showSettings = true"
            size="sm"
            class="text-gray-600 dark:text-gray-400"
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

    <!-- Settings Modal (placeholder for now) -->
    <UDialog v-model="showSettings">
      <div class="p-6">
        <h2 class="text-xl font-600 mb-4">Settings</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Settings panel coming soon...</p>
        <UButton @click="showSettings = false" btn="solid-black" class="w-full">
          Close
        </UButton>
      </div>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const showAddQuote = ref(false)
const showSettings = ref(false)

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
