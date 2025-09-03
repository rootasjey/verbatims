<template>
  <div class="min-h-screen">
    <!-- Mobile Diary Interface -->
    <div v-if="isMobile" class="mobile-diary-page">
      <!-- Header -->
      <div class="p-4 pt-6">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-600 text-gray-900 dark:text-white mb-2">Your Diary</h1>
          <p class="text-gray-600 dark:text-gray-400">Track your quotes and collections</p>
        </div>
      </div>

      <!-- User Stats -->
      <div v-if="user" class="px-4 mb-8">
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-600 text-primary-600 dark:text-primary-400 mb-1">
              {{ userStats.submitted || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Quotes</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-600 text-green-600 dark:text-green-400 mb-1">
              {{ userStats.approved || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Published</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-600 text-yellow-600 dark:text-yellow-400 mb-1">
              {{ userStats.pending || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-600 text-blue-600 dark:text-blue-400 mb-1">
              {{ userStats.collections || 0 }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Collections</div>
          </div>
        </div>
      </div>

      <MobileProgressSection
        @show-details="navigateTo('/dashboard')"
        @main-action="navigateTo('/')"
        @secondary-action="navigateTo('/dashboard/stats')"
        @tertiary-action="navigateTo('/dashboard/settings')"
      />
      
      <!-- Navigation Menu -->
      <div class="px-4 space-y-3">
        <h2 class="text-lg font-600 text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        
        <!-- Add Quote -->
        <button
          @click="showAddQuote = true"
          class="flex items-center justify-between w-full p-4 bg-primary-50 dark:bg-primary-900/20 border border-dashed border-primary-200 dark:border-primary-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-plus-circle-bold" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Add a Quote</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Share an inspiring quote</p>
            </div>
          </div>
          <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
        </button>

        <h2 class="text-lg font-600 text-gray-900 dark:text-white mb-4 mt-8">Your Content</h2>

        <!-- Favourites -->
        <NuxtLink
          to="/dashboard/favourites"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-heart-bold" class="w-6 h-6 text-red-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Favourites</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Your liked quotes</p>
            </div>
          </div>
          <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
        </NuxtLink>

        <!-- Collections -->
        <NuxtLink
          to="/dashboard/lists"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-bookmark-bold" class="w-6 h-6 text-blue-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Collections</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Organize your quotes</p>
            </div>
          </div>
          <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
        </NuxtLink>

        <!-- Drafts -->
        <NuxtLink
          to="/dashboard/my-quotes/drafts"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-file-text-bold" class="w-6 h-6 text-gray-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Drafts</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Unfinished quotes</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <UBadge v-if="userStats.draft > 0" color="gray" variant="subtle" size="xs">
              {{ userStats.draft }}
            </UBadge>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </div>
        </NuxtLink>

        <!-- Pending Quotes -->
        <NuxtLink
          to="/dashboard/my-quotes/pending"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-clock-bold" class="w-6 h-6 text-yellow-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Pending</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Awaiting review</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <UBadge v-if="userStats.pending > 0" color="yellow" variant="subtle" size="xs">
              {{ userStats.pending }}
            </UBadge>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </div>
        </NuxtLink>

        <!-- Published Quotes -->
        <NuxtLink
          to="/dashboard/my-quotes/published"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-check-circle-bold" class="w-6 h-6 text-green-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Published</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Live quotes</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <UBadge v-if="userStats.approved > 0" color="green" variant="subtle" size="xs">
              {{ userStats.approved }}
            </UBadge>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </div>
        </NuxtLink>

        <h2 class="text-lg font-600 text-gray-900 dark:text-white mb-4 mt-8">Settings</h2>

        <!-- Settings -->
        <NuxtLink
          to="/dashboard/settings"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-gear-bold" class="w-6 h-6 text-gray-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">Settings</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Account preferences</p>
            </div>
          </div>
          <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
        </NuxtLink>

        <!-- About -->
        <NuxtLink
          to="/about"
          class="flex items-center justify-between w-full p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-info-bold" class="w-6 h-6 text-blue-500" />
            <div class="text-left">
              <h3 class="font-600 text-gray-900 dark:text-white">About</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Learn more about Verbatims</p>
            </div>
          </div>
          <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop: Redirect to dashboard -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-ph-desktop" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-4">Desktop Dashboard</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Access your full dashboard on desktop</p>
        <UButton btn="solid-black" @click="navigateTo('/dashboard')">
          Go to Dashboard
        </UButton>
      </div>
    </div>

    <AddQuoteDrawer
      v-if="isMobile"
      v-model:open="showAddQuote"
      @submitted="handleQuoteAdded"
    />
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Diary - Verbatims',
  meta: [
    {
      name: 'description',
      content: 'Your personal diary on Verbatims. Track your quotes, collections, and contributions.',
    }
  ]
})

const { user } = useUserSession()
const showAddQuote = ref(false)
const userStats = ref({
  approved: 0,
  pending: 0,
  draft: 0,
  collections: 0,
  likes: 0,
  views: 0,
  submitted: 0,
})

const loadUserStats = async () => {
  if (!user.value) return
  
  try {
    const response = await $fetch('/api/dashboard/stats')
    if (response.data) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to load user stats:', error)
  }
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
  loadUserStats() // Refresh stats
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadUserStats()
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})
</script>

<style scoped>
.mobile-diary-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
  padding-bottom: 2rem;
}
</style>
