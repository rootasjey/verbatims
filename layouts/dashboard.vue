<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
  <AppHeader :left-pad-class="[(sidebarOpen ? 'pl-64' : ''), (sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')].join(' ')" />
    
    <!-- Dashboard Layout -->
    <div class="pt-16 flex min-h-screen">
      <!-- Sidebar Navigation -->
      <aside
        id="dashboard-sidebar"
        :class="[
          'fixed z-40 inset-y-0 left-0 bg-[#FAFAF9] dark:bg-[#0C0A09] border-r b-dashed border-gray-200 dark:border-gray-700 pt-16 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 mt-0' : '-translate-x-full mt-1.5',
        ]"
      >
        <div class="flex flex-col">
          <!-- Sidebar Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <h2 class="hidden lg:block text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
            <UTooltip content="Close sidebar" :_tooltip-content="{ side: 'right' }">
              <UButton
                icon
                btn="light:soft dark:soft-blue"
                size="xs"
                label="i-ph-x-bold"
                @click="sidebarOpen = false"
              />
            </UTooltip>
          </div>

          <!-- Desktop Collapse Toggle -->
          <div class="hidden lg:flex justify-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <UButton
              icon
              size="xs"
              :label="sidebarCollapsed ? 'i-ph-caret-right' : 'i-ph-caret-left'"
              btn="soft-blue"
              class="transition-transform duration-200"
              :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :aria-expanded="!sidebarCollapsed"
              aria-controls="dashboard-sidebar"
              @click="sidebarCollapsed = !sidebarCollapsed"
            />
          </div>

          <!-- Navigation Menu -->
          <nav
            :class="[
              'flex-1 py-6 space-y-2',
              sidebarCollapsed ? 'px-2' : 'px-4'
            ]"
          >
            <!-- Dashboard Overview -->
            <UTooltip :content="sidebarCollapsed ? 'Overview' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
              <NuxtLink
                to="/dashboard"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  $route.path === '/dashboard' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-house" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                <span
                  :class="[
                    'whitespace-nowrap transition-opacity duration-200',
                    sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
                  ]"
                >
                  Overview
                </span>
              </NuxtLink>
            </UTooltip>

            <!-- Favourites -->
            <UTooltip :content="sidebarCollapsed ? 'Favourites' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
              <NuxtLink
                to="/dashboard/favourites"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  $route.path === '/dashboard/favourites' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-heart" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Favourites</span>
              </NuxtLink>
            </UTooltip>

            <!-- Lists/Collections -->
            <UTooltip :content="sidebarCollapsed ? 'Lists' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
              <NuxtLink
                to="/dashboard/lists"
                :class="[
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'justify-center' : 'justify-start',
                  $route.path === '/dashboard/lists' 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="sidebarOpen = false"
              >
                <UIcon name="i-ph-bookmark" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Lists</span>
              </NuxtLink>
            </UTooltip>

            <!-- My Quotes Section -->
            <div class="pt-4">
              <h3
                :class="[
                  'px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 transition-opacity duration-200',
                  sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'
                ]"
              >
                My Quotes
              </h3>
              
              <!-- Drafts -->
              <UTooltip :content="sidebarCollapsed ? 'Drafts' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  to="/dashboard/my-quotes/drafts"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/dashboard/my-quotes/drafts' 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-file-dashed" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Drafts</span>
                  <UBadge v-if="!sidebarCollapsed && draftCount > 0" :label="`${draftCount}`" color="yellow" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>

              <!-- Pending -->
              <UTooltip :content="sidebarCollapsed ? 'Pending' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  to="/dashboard/my-quotes/pending"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/dashboard/my-quotes/pending' 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-clock" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Pending</span>
                  <UBadge v-if="!sidebarCollapsed && pendingCount > 0" :label="`${pendingCount}`" color="orange" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>

              <!-- Published -->
              <UTooltip :content="sidebarCollapsed ? 'Published' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  to="/dashboard/my-quotes/published"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/dashboard/my-quotes/published' 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-check-circle" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Published</span>
                  <UBadge v-if="!sidebarCollapsed && publishedCount > 0" :label="`${publishedCount}`" color="green" variant="subtle" size="xs" class="ml-auto" />
                </NuxtLink>
              </UTooltip>
            </div>

            <!-- Settings -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <UTooltip :content="sidebarCollapsed ? 'Settings' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  to="/dashboard/settings"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path === '/dashboard/settings'
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-dashed border-primary-200 dark:border-primary-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-gear" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Settings</span>
                </NuxtLink>
              </UTooltip>

              <!-- Admin Panel (only for admin users) -->
              <UTooltip v-if="user?.role === 'admin'" :content="sidebarCollapsed ? 'Go to Admin' : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  to="/admin"
                  :class="[
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 mt-2',
                    sidebarCollapsed ? 'justify-center' : 'justify-start',
                    $route.path.startsWith('/admin')
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-dashed border-red-200 dark:border-red-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <UIcon name="i-ph-shield-check" :class="['w-5 h-5', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Go to Admin</span>
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
        <div class="lg:hidden bg-white dark:bg-[#0C0A09]/70 border-b b-dashed border-gray-200 dark:border-gray-800 px-4 py-3">
          <div class="flex items-center justify-between">
            <UTooltip content="Open sidebar" :_tooltip-content="{ side: 'right' }">
              <UButton
                icon
                btn="light:soft dark:text"
                size="xs"
                label="i-ph-list-bold"
                @click="sidebarOpen = true"
              />
            </UTooltip>
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
  middleware: 'auth'
})

const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const { user } = useUserSession()

// Quote counts for badges
const draftCount = ref(0)
const pendingCount = ref(0)
const publishedCount = ref(0)

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

watch(() => route.path, (newPath) => {
  pageHeader.setHeaderFromRoute()
})

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

onMounted(() => {
  loadQuoteCounts()
  try {
    const saved = localStorage.getItem('dashboard.sidebarCollapsed')
    if (saved != null) sidebarCollapsed.value = saved === '1'
  } catch (e) {}
})

watch(sidebarCollapsed, (val) => {
  try {
    localStorage.setItem('dashboard.sidebarCollapsed', val ? '1' : '0')
  } catch (e) {}
})
</script>
