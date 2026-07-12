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
        <div class="flex flex-col h-full overflow-hidden">
          <!-- Sidebar Header -->
          <div class="flex items-center justify-between px-3 py-4 border-b border-gray-100 dark:border-gray-800 lg:hidden">
            <h2 class="font-sans text-sm font-500 text-gray-500 dark:text-gray-400">{{ $t('nav.dashboard') }}</h2>
            <button @click="sidebarOpen = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <NIcon name="i-ph-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Desktop Collapse Toggle -->
          <div class="hidden lg:flex justify-center py-3 border-b border-gray-100 dark:border-gray-800">
            <button
              :title="sidebarCollapsed ? ($t('nav.expand_sidebar') as string) : ($t('nav.collapse_sidebar') as string)"
              :aria-expanded="!sidebarCollapsed"
              aria-controls="dashboard-sidebar"
              class="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
              @click="sidebarCollapsed = !sidebarCollapsed"
            >
              <NIcon :name="sidebarCollapsed ? 'i-ph-caret-right' : 'i-ph-caret-left'" class="w-4 h-4" />
            </button>
          </div>

          <!-- Navigation Menu -->
          <nav
            :class="[
              'flex-1 py-6 space-y-1 overflow-y-auto',
              sidebarCollapsed ? 'px-2' : 'px-3'
            ]"
          >
            <NTooltip v-for="item in navItems" :key="item.to" :content="sidebarCollapsed ? (item.label as string) : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
              <NuxtLink
                :to="item.to"
                :class="[
                  'flex items-center text-sm rounded-sm transition-all duration-200',
                  sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                  isActive(item.to)
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
                @click="sidebarOpen = false"
              >
                <NIcon :name="item.icon" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                <span
                  :class="[
                    'whitespace-nowrap transition-opacity duration-200 text-sm',
                    sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
                  ]"
                >
                  {{ item.label }}
                </span>
                <NBadge v-if="!sidebarCollapsed && (item as any).count !== undefined && (item as any).count > 0" :label="`${(item as any).count}`" badge="soft-gray" size="xs" class="ml-auto" />
              </NuxtLink>
            </NTooltip>

            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <h3
                :class="[
                  'px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 transition-opacity duration-200',
                  sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'
                ]"
              >
                {{ $t('nav.my_quotes') }}
              </h3>

              <NTooltip v-for="item in quoteNavItems" :key="item.to" :content="sidebarCollapsed ? (item.label as string) : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  :to="item.to"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive(item.to)
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon :name="item.icon" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span
                    :class="[
                      'whitespace-nowrap transition-opacity duration-200 text-sm',
                      sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
                    ]"
                  >
                    {{ item.label }}
                  </span>
                  <NBadge v-if="!sidebarCollapsed && (item as any).count !== undefined && (item as any).count > 0" :label="`${(item as any).count}`" badge="soft-gray" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>
            </div>

            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <NTooltip v-for="item in bottomNavItems" :key="item.to" :content="sidebarCollapsed ? (item.label as string) : undefined" :disabled="!sidebarCollapsed" :_tooltip-content="{ side: 'right' }">
                <NuxtLink
                  :to="item.to"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive(item.to)
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon :name="item.icon" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span
                    :class="[
                      'whitespace-nowrap transition-opacity duration-200 text-sm',
                      sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
                    ]"
                  >
                    {{ item.label }}
                  </span>
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
      <main :class="['flex-1 transition-all duration-300 pb-28 md:pb-0', sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64']">
        <!-- Mobile Header -->
        <div class="lg:hidden bg-[#FAFAF9] dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-800 px-4 py-3">
          <div class="flex items-center justify-between">
            <button @click="sidebarOpen = true" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <NIcon name="i-ph-list-bold" class="w-5 h-5" />
            </button>
            <div class="w-8" />
          </div>
        </div>

        <!-- Page Content -->
        <div class="p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile-only drawers -->
    <ClientOnly>
      <AddQuoteDrawer v-model:open="showAddQuote" @submitted="handleQuoteAdded" />
      <ReportDrawer v-model:open="showReportDrawer" :target-type="'general'" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
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
    const stats = await $fetch<{ data: { draft: number; pending: number; approved: number } }>('/api/dashboard/stats')
    if (stats.data) {
      draftCount.value = stats.data.draft || 0
      pendingCount.value = stats.data.pending || 0
      publishedCount.value = stats.data.approved || 0
    }
  } catch (error) {
    console.error('Failed to load quote counts:', error)
  }
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
}

// Close sidebar when route changes (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

const isActive = (to: string) => {
  if (to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(to)
}

const navItems = computed(() => [
  { to: '/dashboard', label: $t('nav.overview'), icon: 'i-ph-house' },
  { to: '/dashboard/favourites', label: $t('nav.favourites'), icon: 'i-ph-heart' },
  { to: '/dashboard/lists', label: $t('nav.lists'), icon: 'i-ph-bookmark' },
])

const quoteNavItems = computed(() => [
  { to: '/dashboard/my-quotes/drafts', label: $t('nav.drafts'), icon: 'i-ph-file-dashed', count: draftCount.value },
  { to: '/dashboard/my-quotes/pending', label: $t('nav.pending'), icon: 'i-ph-clock', count: pendingCount.value },
  { to: '/dashboard/my-quotes/published', label: $t('nav.published'), icon: 'i-ph-check-circle', count: publishedCount.value },
])

const bottomNavItems = computed(() => [
  { to: '/dashboard/sponsors', label: $t('nav.sponsorships'), icon: 'i-ph-megaphone' },
  { to: '/dashboard/settings', label: $t('nav.settings'), icon: 'i-ph-gear' },
  { to: '/dashboard/developer', label: $t('nav.developer'), icon: 'i-ph-code' },
  ...(user.value?.role === 'admin' ? [{ to: '/admin', label: $t('nav.admin'), icon: 'i-ph-shield-check' }] : []),
])

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
