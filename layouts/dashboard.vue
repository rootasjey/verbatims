<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <!-- Header -->
    <AppHeader />
    
    <!-- Dashboard Layout -->
    <div class="pt-16 flex min-h-screen">
      <!-- Sidebar Navigation -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 w-64 bg-[#FAFAF9] dark:bg-[#0C0A09] border-r b-dashed border-gray-200 dark:border-gray-700 pt-16 transition-transform duration-300 ease-in-out z-40',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 mt-0' : '-translate-x-full mt-1.5',
        ]"
      >
        <div class="flex flex-col">
          <!-- Sidebar Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
            <UButton
              icon
              btn="soft"
              size="xs"
              label="i-ph-x-bold"
              @click="sidebarOpen = false"
            />
          </div>

          <!-- Navigation Menu -->
          <nav class="flex-1 px-4 py-6 space-y-2">
            <!-- Dashboard Overview -->
            <NuxtLink
              to="/dashboard"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                $route.path === '/dashboard' 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="sidebarOpen = false"
            >
              <UIcon name="i-ph-house" class="w-5 h-5 mr-3" />
              Overview
            </NuxtLink>

            <!-- Favourites -->
            <NuxtLink
              to="/dashboard/favourites"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                $route.path === '/dashboard/favourites' 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="sidebarOpen = false"
            >
              <UIcon name="i-ph-heart" class="w-5 h-5 mr-3" />
              Favourites
            </NuxtLink>

            <!-- Lists/Collections -->
            <NuxtLink
              to="/dashboard/lists"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                $route.path === '/dashboard/lists' 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="sidebarOpen = false"
            >
              <UIcon name="i-ph-bookmark" class="w-5 h-5 mr-3" />
              Lists
            </NuxtLink>

            <!-- My Quotes Section -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                My Quotes
              </h3>
              
              <!-- Drafts -->
              <NuxtLink
                to="/dashboard/my-quotes/drafts"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/dashboard/my-quotes/drafts' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-file-dashed" class="w-5 h-5 mr-3" />
                Drafts
                <UBadge v-if="draftCount > 0" :label="`${draftCount}`" color="yellow" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>

              <!-- Pending -->
              <NuxtLink
                to="/dashboard/my-quotes/pending"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/dashboard/my-quotes/pending' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-clock" class="w-5 h-5 mr-3" />
                Pending
                <UBadge v-if="pendingCount > 0" :label="`${pendingCount}`" color="orange" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>

              <!-- Published -->
              <NuxtLink
                to="/dashboard/my-quotes/published"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/dashboard/my-quotes/published' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-check-circle" class="w-5 h-5 mr-3" />
                Published
                <UBadge v-if="publishedCount > 0" :label="`${publishedCount}`" color="green" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>
            </div>

            <!-- Settings -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <NuxtLink
                to="/dashboard/settings"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/dashboard/settings' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-gear" class="w-5 h-5 mr-3" />
                Settings
              </NuxtLink>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- Main Content -->
      <main class="flex-1 lg:ml-64">
        <!-- Mobile Header -->
        <div class="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div class="flex items-center justify-between">
            <UButton
              icon
              btn="soft"
              size="xs"
              label="i-ph-list-bold"
              @click="sidebarOpen = true"
            />
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ pageTitle }}
            </h1>
            <div class="w-8" /> <!-- Spacer for centering -->
          </div>
        </div>

        <!-- Page Content -->
        <div class="p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Require authentication for all dashboard pages
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const sidebarOpen = ref(false)

// Quote counts for badges
const draftCount = ref(0)
const pendingCount = ref(0)
const publishedCount = ref(0)

// Computed page title for mobile header
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path === '/dashboard/favourites') return 'Favourites'
  if (path === '/dashboard/lists') return 'Lists'
  if (path === '/dashboard/my-quotes/drafts') return 'Drafts'
  if (path === '/dashboard/my-quotes/pending') return 'Pending'
  if (path === '/dashboard/my-quotes/published') return 'Published'
  if (path === '/dashboard/settings') return 'Settings'
  return 'Dashboard'
})

// Load quote counts for badges
const loadQuoteCounts = async () => {
  try {
    const stats = await $fetch('/api/dashboard/stats')
    if (stats.data) {
      draftCount.value = stats.data.draft || 0
      pendingCount.value = stats.data.pending || 0
      publishedCount.value = stats.data.approved || 0
    }
  } catch (error) {
    console.error('Failed to load quote counts:', error)
  }
}

// Close sidebar when route changes (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

// Load data on mount
onMounted(() => {
  loadQuoteCounts()
})
</script>
