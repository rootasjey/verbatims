<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <!-- Header -->
    <AppHeader />
    
    <!-- Admin Layout -->
    <div class="pt-16 flex min-h-screen">
      <!-- Sidebar Navigation -->
      <aside
        id="admin-sidebar"
        :class="[
          'fixed inset-y-0 left-0 bg-[#FAFAF9] dark:bg-[#0C0A09] border-r b-dashed border-gray-200 dark:border-gray-700 pt-16 transition-all duration-300 ease-in-out z-40',
          sidebarCollapsed ? 'w-16' : 'w-64',
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

          <!-- Desktop Collapse Toggle -->
          <div class="hidden lg:flex items-center justify-end p-3 border-b border-gray-200 dark:border-gray-700">
            <UButton
              icon
              size="xs"
              :label="sidebarCollapsed ? 'i-ph-caret-right' : 'i-ph-caret-left'"
              btn="soft"
              class="transition-transform duration-200"
              :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :aria-expanded="!sidebarCollapsed"
              aria-controls="admin-sidebar"
              @click="sidebarCollapsed = !sidebarCollapsed"
            />
          </div>

          <!-- Navigation Menu -->
          <nav :class="['flex-1 py-6 space-y-2', sidebarCollapsed ? 'px-2' : 'px-4']">
            <!-- Admin Overview -->
            <UTooltip :content="sidebarCollapsed ? 'Overview' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
              <NuxtLink
                to="/admin"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  $route.path === '/admin' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-shield-check" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Overview</span>
              </NuxtLink>
            </UTooltip>

            <!-- Quotes Section -->
            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Quotes Management
              </h3>
              
              <!-- Published Quotes -->
              <UTooltip :content="sidebarCollapsed ? 'Published' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/published"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/published' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-check-circle" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Published</span>
                  <UBadge v-if="!sidebarCollapsed && publishedCount > 0" :label="`${publishedCount}`" color="green" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>

              <!-- Pending Quotes -->
              <UTooltip :content="sidebarCollapsed ? 'Pending' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/pending"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/pending' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-clock" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Pending</span>
                  <UBadge v-if="!sidebarCollapsed && pendingCount > 0" :label="`${pendingCount}`" color="yellow" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>

              <!-- Draft Quotes -->
              <UTooltip :content="sidebarCollapsed ? 'Drafts' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/drafts"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/drafts' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-file-dashed" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Drafts</span>
                  <UBadge v-if="!sidebarCollapsed && draftCount > 0" :label="`${draftCount}`" color="gray" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>
            </div>

            <!-- Content Management Section -->
            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Content Management
              </h3>

              <!-- Authors -->
              <UTooltip :content="sidebarCollapsed ? 'Authors' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/authors"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/authors'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-user" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Authors</span>
                </NuxtLink>
              </UTooltip>

              <!-- References -->
              <UTooltip :content="sidebarCollapsed ? 'References' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/references"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/references'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-book" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">References</span>
                </NuxtLink>
              </UTooltip>
            </div>

            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                System Management
              </h3>
              
              <!-- Users -->
              <UTooltip :content="sidebarCollapsed ? 'Users' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/users"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/users'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-users" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Users</span>
                </NuxtLink>
              </UTooltip>

              <!-- Database Maintenance -->
              <UTooltip :content="sidebarCollapsed ? 'Database Maintenance' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/maintenance"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/maintenance'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-wrench" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Database Maintenance</span>
                </NuxtLink>
              </UTooltip>

              <!-- Import -->
              <UTooltip :content="sidebarCollapsed ? 'Import Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/import"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/import'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-upload" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Import Data</span>
                </NuxtLink>
              </UTooltip>

              <!-- Export -->
              <UTooltip :content="sidebarCollapsed ? 'Export Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/export"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/export'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-download" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Export Data</span>
                </NuxtLink>
              </UTooltip>
            </div>

            <!-- Back to Dashboard -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <UTooltip :content="sidebarCollapsed ? 'Back to Dashboard' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/dashboard"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 mt-2',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-house" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Back to Dashboard</span>
                </NuxtLink>
              </UTooltip>
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
  <main :class="['flex-1 transition-all duration-300', sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64']">
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
const sidebarCollapsed = ref(false)

// Quote counts for badges
const publishedCount = ref(0)
const pendingCount = ref(0)
const draftCount = ref(0)

// Page header integration
const pageHeader = usePageHeader()

// Set page header based on current route
onMounted(() => {
  pageHeader.setHeaderFromRoute(route.path)
})

// Update header when route changes
watch(() => route.path, (newPath) => {
  pageHeader.setHeaderFromRoute(newPath)
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
  try {
    const saved = localStorage.getItem('admin.sidebarCollapsed')
    if (saved != null) sidebarCollapsed.value = saved === '1'
  } catch (e) {}
})

watch(sidebarCollapsed, (val) => {
  try {
    localStorage.setItem('admin.sidebarCollapsed', val ? '1' : '0')
  } catch (e) {}
})
</script>
