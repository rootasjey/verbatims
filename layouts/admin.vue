<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <!-- Header -->
    <AppHeader />
    
    <!-- Admin Layout -->
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
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
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
            <!-- Admin Overview -->
            <NuxtLink
              to="/admin"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                $route.path === '/admin' 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
              ]"
              @click="sidebarOpen = false"
            >
              <UIcon name="i-ph-shield-check" class="w-5 h-5 mr-3" />
              Overview
            </NuxtLink>

            <!-- Quotes Section -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Quotes Management
              </h3>
              
              <!-- Published Quotes -->
              <NuxtLink
                to="/admin/quotes/published"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/quotes/published' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-check-circle" class="w-5 h-5 mr-3" />
                Published
                <UBadge v-if="publishedCount > 0" :label="`${publishedCount}`" color="green" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>

              <!-- Pending Quotes -->
              <NuxtLink
                to="/admin/quotes/pending"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/quotes/pending' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-clock" class="w-5 h-5 mr-3" />
                Pending
                <UBadge v-if="pendingCount > 0" :label="`${pendingCount}`" color="yellow" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>

              <!-- Draft Quotes -->
              <NuxtLink
                to="/admin/quotes/drafts"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/quotes/drafts' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-file-dashed" class="w-5 h-5 mr-3" />
                Drafts
                <UBadge v-if="draftCount > 0" :label="`${draftCount}`" color="gray" variant="subtle" size="xs" class="ml-auto" />
              </NuxtLink>
            </div>

            <!-- Future Sections Placeholder -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Content Management
              </h3>
              
              <!-- Authors (Future) -->
              <div class="flex items-center px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                <UIcon name="i-ph-user" class="w-5 h-5 mr-3" />
                Authors
                <UBadge label="Soon" color="gray" variant="subtle" size="xs" class="ml-auto" />
              </div>
            </div>

            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                System Management
              </h3>
              
              <!-- User Management (Future) -->
              <div class="flex items-center px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed">
                <UIcon name="i-ph-users" class="w-5 h-5 mr-3" />
                Users
                <UBadge label="Soon" color="gray" variant="subtle" size="xs" class="ml-auto" />
              </div>

              <!-- Database Maintenance -->
              <NuxtLink
                to="/admin/maintenance"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/maintenance'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-wrench" class="w-5 h-5 mr-3" />
                Database Maintenance
              </NuxtLink>

              <!-- Import -->
              <NuxtLink
                to="/admin/import"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/import'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-upload" class="w-5 h-5 mr-3" />
                Import Data
              </NuxtLink>

              <!-- Export -->
              <NuxtLink
                to="/admin/export"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  $route.path === '/admin/export'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-download" class="w-5 h-5 mr-3" />
                Export Data
              </NuxtLink>
            </div>

            <!-- Back to Dashboard -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <NuxtLink
                to="/dashboard"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mt-2',
                  'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-house" class="w-5 h-5 mr-3" />
                Back to Dashboard
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
// Require admin authentication for all admin pages
definePageMeta({
  middleware: 'admin'
})

const route = useRoute()
const sidebarOpen = ref(false)

// Quote counts for badges
const publishedCount = ref(0)
const pendingCount = ref(0)
const draftCount = ref(0)

// Computed page title for mobile header
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/admin') return 'Admin Panel'
  if (path === '/admin/quotes/published') return 'Published Quotes'
  if (path === '/admin/quotes/pending') return 'Pending Quotes'
  if (path === '/admin/quotes/drafts') return 'Draft Quotes'
  if (path === '/admin/maintenance') return 'Database Maintenance'
  if (path === '/admin/import') return 'Import Data'
  if (path === '/admin/export') return 'Export Data'
  return 'Admin Panel'
})

// Load quote counts for badges
const loadQuoteCounts = async () => {
  try {
    const stats = await $fetch('/api/admin/stats')
    if (stats.data?.quotes) {
      publishedCount.value = stats.data.quotes.approved || 0
      pendingCount.value = stats.data.quotes.pending || 0
      draftCount.value = stats.data.quotes.draft || 0
    }
  } catch (error) {
    console.error('Failed to load admin quote counts:', error)
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
