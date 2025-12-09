<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
    <AppHeader 
      :left-pad-class="[(sidebarOpen ? 'lg:pl-64 md:pl-12 pl-12' : ''), (sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')].join(' ')" 
    />
    
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
            <h2 class="hidden lg:inline text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
            <NButton
              icon
              btn="soft-gray"
              size="xs"
              label="i-ph-x-bold"
              @click="sidebarOpen = false"
            />
          </div>

          <!-- Desktop Collapse Toggle -->
          <div class="hidden lg:flex items-center justify-end p-3 mr-1 border-b border-gray-200 dark:border-gray-700">
            <NButton
              icon
              size="xs"
              :label="sidebarCollapsed ? 'i-ph-caret-right' : 'i-ph-caret-left'"
              btn="soft-gray"
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
            <NTooltip :content="sidebarCollapsed ? 'Overview' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
              <NuxtLink
                to="/admin"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  $route.path === '/admin' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-dashed border-green-200 dark:border-green-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
                ]"
                @click="sidebarOpen = false"
              >
                <NIcon name="i-ph-shield-check" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Overview</span>
              </NuxtLink>
            </NTooltip>

            <!-- Quotes Section -->
            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Quotes Management
              </h3>
              
              <!-- Published Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Published' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/published"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/published' 
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-dashed border-cyan-200 dark:border-cyan-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-check-circle" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Published</span>
                  <NBadge v-if="!sidebarCollapsed && publishedCount > 0" :label="`${publishedCount}`" color="green" badge="soft" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Pending Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Pending' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/pending"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/pending' 
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-dashed border-cyan-200 dark:border-cyan-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-clock" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Pending</span>
                  <NBadge v-if="!sidebarCollapsed && pendingCount > 0" :label="`${pendingCount}`" color="yellow" badge="soft" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Draft Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Drafts' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/drafts"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/quotes/drafts' 
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-dashed border-cyan-200 dark:border-cyan-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-file-dashed" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Drafts</span>
                  <NBadge v-if="!sidebarCollapsed && draftCount > 0" :label="`${draftCount}`" color="gray" badge="soft" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>
            </div>

            <!-- Content Management Section -->
            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Content Management
              </h3>

              <!-- Authors -->
              <NTooltip :content="sidebarCollapsed ? 'Authors' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/authors"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/authors'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-dashed border-blue-200 dark:border-blue-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-user" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Authors</span>
                </NuxtLink>
              </NTooltip>

              <!-- References -->
              <NTooltip :content="sidebarCollapsed ? 'References' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/references"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/references'
                      ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 border border-dashed border-lime-200 dark:border-lime-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-lime-50 dark:hover:bg-lime-900/20 hover:text-lime-700 dark:hover:text-lime-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-book" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">References</span>
                </NuxtLink>
              </NTooltip>

              <!-- Tags -->
              <NTooltip :content="sidebarCollapsed ? 'Tags' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/tags"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/admin/tags'
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-dashed border-purple-200 dark:border-purple-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-hash" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Tags</span>
                </NuxtLink>
              </NTooltip>
            </div>

            <div class="pt-4">
              <h3 :class="['px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                System Management
              </h3>
              
              <!-- Messages Inbox -->
              <NTooltip :content="sidebarCollapsed ? 'Messages' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/messages"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    getMangementItemColor($route.path === '/admin/messages')
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-envelope" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Messages</span>
                </NuxtLink>
              </NTooltip>
              
              <!-- Users -->
              <NTooltip :content="sidebarCollapsed ? 'Users' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/users"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    getMangementItemColor($route.path === '/admin/users')
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-users" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Users</span>
                </NuxtLink>
              </NTooltip>

              <!-- Database Maintenance -->
              <NTooltip :content="sidebarCollapsed ? 'Database Maintenance' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/maintenance"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    getMangementItemColor($route.path === '/admin/maintenance')
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-wrench" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Database Maintenance</span>
                </NuxtLink>
              </NTooltip>

              <!-- Import -->
              <NTooltip :content="sidebarCollapsed ? 'Import Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/import"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    getMangementItemColor($route.path === '/admin/import')
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-upload" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Import Data</span>
                </NuxtLink>
              </NTooltip>

              <!-- Export -->
              <NTooltip :content="sidebarCollapsed ? 'Export Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/export"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    getMangementItemColor($route.path === '/admin/export')
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-download" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Export Data</span>
                </NuxtLink>
              </NTooltip>
            </div>

            <!-- Back to Dashboard -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <NTooltip :content="sidebarCollapsed ? 'Back to Dashboard' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/dashboard"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 mt-2',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-house" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Back to Dashboard</span>
                </NuxtLink>
              </NTooltip>
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
        <div class="lg:hidden dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div class="flex items-center justify-between">
            <NButton
              icon
              btn="soft-gray"
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

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

watch(() => route.path, (newPath) => {
  pageHeader.setHeaderFromRoute()
})

const loadQuoteCounts = async () => {
  try {
    const stats = await $fetch('/api/admin/stats')
    if (stats?.data?.quotes) {
      publishedCount.value = stats.data.quotes.approved || 0
      pendingCount.value = stats.data.quotes.pending || 0
      draftCount.value = stats.data.quotes.draft || 0
    }
  } catch (error) {
    console.error('Failed to load admin quote counts:', error)
  }
}

const getMangementItemColor = (isActive: boolean) => {
  return isActive 
    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-dashed border-green-200 dark:border-green-700'
    : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300'
}

// Close sidebar when route changes (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

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
