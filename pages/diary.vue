<template>
  <div class="min-h-screen">
    <!-- Mobile Diary Interface -->
    <div v-if="isMobile" class="mobile-diary-page">
      <div class="p-4 pt-6">
        <div class="text-center mb-6">
          <h1 class="font-title text-2xl font-200 text-gray-900 dark:text-white">
            {{ dayGreeting }}, <b class="font-600">{{ user?.name || 'User' }}</b>.
          </h1>
          <p class="text-gray-600 dark:text-gray-600">Let's take a look at...</p>
        </div>
      </div>

      <MobileProgressSection
        :drafted="userStats.draft"
        :published="userStats.approved"
        :pending="userStats.pending"
        :likes="userStats.likes"
        :likes-given="userStats.likes_given"
        :views="userStats.views"
        @show-details="navigateTo('/dashboard')"
        @main-action="navigateTo('/')"
        @secondary-action="navigateTo('/dashboard/stats')"
        @tertiary-action="navigateTo('/dashboard/settings')"
      />
      
      <!-- Navigation Menu -->
      <div class="px-4 space-y-9">
        <div class="flex gap-2">
          <button
            @click="showAddQuote = true"
            class="flex items-center justify-between w-full p-4 bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="text-left">
                <UIcon name="i-ph-megaphone-simple-duotone" class="w-6 h-6 text-amber dark:text-amber-400" />
                <h3 class="font-600 text-gray-900 dark:text-white">Share Feedback</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Provide your thoughts on the app</p>
              </div>
            </div>
          </button>
          <button
            @click="showAddQuote = true"
            class="flex items-center justify-between w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="text-left">
                <UIcon name="i-ph-quotes" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 class="font-600 text-gray-900 dark:text-white">Add a Quote</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Share an inspiring quote</p>
              </div>
            </div>
          </button>
        </div>

        <div class="space-y-3">
          <NuxtLink
            to="/dashboard/favourites"
            class="flex items-center justify-between w-full px-4 py-2
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-heart-duotone" class="group-hover:text-red-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Favourites</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Your liked quotes</p>
              </div>
            </div>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </NuxtLink>

          <NuxtLink
            to="/dashboard/lists"
            class="flex items-center justify-between w-full  px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-bookmark-duotone" class="group-hover:text-blue-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Collections</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Organize your quotes</p>
              </div>
            </div>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </NuxtLink>

          <NuxtLink
            to="/dashboard/my-quotes/drafts"
            class="flex items-center justify-between w-full px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-pencil-duotone" class="text-gray-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Drafts</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Unfinished quotes</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UBadge v-if="userStats.draft > 0" color="gray" variant="subtle" size="xs">
                {{ userStats.draft }}
              </UBadge>
              <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
            </div>
          </NuxtLink>

          <NuxtLink
            to="/dashboard/my-quotes/pending"
            class="flex items-center justify-between w-full px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-clock-duotone" class="group-hover:text-yellow-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Pending</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Awaiting review</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UBadge v-if="userStats.pending > 0" color="yellow" variant="subtle" size="xs">
                {{ userStats.pending }}
              </UBadge>
              <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
            </div>
          </NuxtLink>

          <NuxtLink
            to="/dashboard/my-quotes/published"
            class="flex items-center justify-between w-full px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-check-circle-duotone" class="group-hover:text-green-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Published</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Live quotes</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <UBadge v-if="userStats.approved > 0" color="green" variant="subtle" size="xs">
                {{ userStats.approved }}
              </UBadge>
              <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
            </div>
          </NuxtLink>

          <NuxtLink
            to="/dashboard/settings"
            class="flex items-center justify-between w-full px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-gear-duotone" class="text-gray-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">Settings</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Account preferences</p>
              </div>
            </div>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </NuxtLink>

          <NuxtLink
            to="/about"
            class="flex items-center justify-between w-full px-4 py-2 
            bg-[#F5F5F4] dark:bg-gray-800
            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div class="flex items-center space-x-5">
              <div class="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <UIcon name="i-ph-info-duotone" class="group-hover:text-blue-500" />
              </div>
              <div class="text-left">
                <h3 class="font-600 text-gray-900 dark:text-white">About</h3>
                <p class="-mt-1 text-sm text-gray-400 dark:text-gray-400">Learn more about Verbatims</p>
              </div>
            </div>
            <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
          </NuxtLink>
        </div>
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

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

const { user } = useUserSession()
const showAddQuote = ref(false)

const dayGreetings: Record<string, string> = {
  Monday: 'Happy Monday',
  Tuesday: 'Great Tuesday',
  Wednesday: 'Wonderful Wednesday',
  Thursday: 'Thriving Thursday',
  Friday: 'Fantastic Friday',
  Saturday: 'Superb Saturday',
  Sunday: 'Serene Sunday',
}

const today = new Date()
const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
const dayGreeting = dayGreetings[dayName] || 'Welcome back'

const userStats = ref({
  approved: 0,
  pending: 0,
  draft: 0,
  collections: 0,
  likes: 0,
  likes_given: 0,
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
