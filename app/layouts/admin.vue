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
          <!-- Sidebar Header (mobile) -->
          <div class="flex items-center justify-between px-3 py-4 border-b border-gray-100 dark:border-gray-800 lg:hidden">
            <h2 class="font-sans text-sm font-500 text-gray-500 dark:text-gray-400">Admin</h2>
            <button @click="sidebarOpen = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <NIcon name="i-ph-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Desktop Collapse Toggle -->
          <div class="hidden lg:flex justify-center py-3 border-b border-gray-100 dark:border-gray-800">
            <button
              :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :aria-expanded="!sidebarCollapsed"
              aria-controls="admin-sidebar"
              class="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
              @click="sidebarCollapsed = !sidebarCollapsed"
            >
              <NIcon :name="sidebarCollapsed ? 'i-ph-caret-right' : 'i-ph-caret-left'" class="w-4 h-4" />
            </button>
          </div>

          <!-- Navigation Menu -->
          <nav :class="['flex-1 py-6 space-y-1', sidebarCollapsed ? 'px-2' : 'px-3']">
            <!-- Admin Overview -->
            <NTooltip :content="sidebarCollapsed ? 'Overview' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
              <NuxtLink
                to="/admin"
                :class="[
                  'flex items-center text-sm rounded-sm transition-all duration-200',
                  sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                  isActive('/admin')
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
                @click="sidebarOpen = false"
              >
                <NIcon name="i-ph-shield-check" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Overview</span>
              </NuxtLink>
            </NTooltip>

            <!-- Quotes Section -->
            <div class="pt-3">
              <h3 :class="['px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Quotes Management
              </h3>
              
              <!-- Published Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Published' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/published"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/quotes/published')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-check-circle" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Published</span>
                  <NBadge v-if="!sidebarCollapsed && publishedCount > 0" :label="`${publishedCount}`" badge="soft-gray" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Pending Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Pending' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/pending"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/quotes/pending')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-clock" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Pending</span>
                  <NBadge v-if="!sidebarCollapsed && pendingCount > 0" :label="`${pendingCount}`" badge="soft-gray" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Draft Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Drafts' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/quotes/drafts"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/quotes/drafts')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-file-dashed" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Drafts</span>
                  <NBadge v-if="!sidebarCollapsed && draftCount > 0" :label="`${draftCount}`" badge="soft-gray" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Social Queue -->
              <NTooltip :content="sidebarCollapsed ? 'Social Queue' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/social-queue"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/social-queue')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-share-network" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Social Queue</span>
                </NuxtLink>
              </NTooltip>
            </div>

            <!-- Content Management Section -->
            <div class="pt-3">
              <h3 :class="['px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                Content Management
              </h3>

              <!-- Authors -->
              <NTooltip :content="sidebarCollapsed ? 'Authors' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/authors"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/authors')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-user" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Authors</span>
                </NuxtLink>
              </NTooltip>

              <!-- References -->
              <NTooltip :content="sidebarCollapsed ? 'References' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/references"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/references')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-book" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">References</span>
                </NuxtLink>
              </NTooltip>

              <!-- Enrichment Queue -->
              <NTooltip :content="sidebarCollapsed ? 'Enrichment Queue' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/enrichment"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/enrichment')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-magic-wand" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Enrichment Queue</span>
                </NuxtLink>
              </NTooltip>

              <!-- Harvest Quotes -->
              <NTooltip :content="sidebarCollapsed ? 'Harvest Quotes' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/harvest"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/harvest')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-plant" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Harvest Quotes</span>
                  <NBadge v-if="!sidebarCollapsed && harvestedCount > 0" :label="`${harvestedCount}`" badge="soft-gray" size="xs" class="ml-auto" />
                </NuxtLink>
              </NTooltip>

              <!-- Tags -->
              <NTooltip :content="sidebarCollapsed ? 'Tags' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/tags"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/tags')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-hash" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Tags</span>
                </NuxtLink>
              </NTooltip>

              <!-- Sponsors -->
              <NTooltip :content="sidebarCollapsed ? 'Sponsors' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/sponsors"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/sponsors')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-megaphone" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Sponsors</span>
                </NuxtLink>
              </NTooltip>

              <!-- Themes -->
              <NTooltip :content="sidebarCollapsed ? 'Themes' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/themes"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/themes')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-palette" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Themes</span>
                </NuxtLink>
              </NTooltip>
            </div>

            <div class="pt-3">
              <h3 :class="['px-3 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 transition-opacity duration-200', sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100']">
                System Management
              </h3>
              
              <!-- Messages Inbox -->
              <NTooltip :content="sidebarCollapsed ? 'Messages' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/messages"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/messages')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-envelope" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Messages</span>
                </NuxtLink>
              </NTooltip>
              
              <!-- Users -->
              <NTooltip :content="sidebarCollapsed ? 'Users' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/users"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/users')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-users" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Users</span>
                </NuxtLink>
              </NTooltip>

              <!-- Database Maintenance -->
              <NTooltip :content="sidebarCollapsed ? 'Database Maintenance' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/maintenance"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/maintenance')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-wrench" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Database Maintenance</span>
                </NuxtLink>
              </NTooltip>

              <!-- Import -->
              <NTooltip :content="sidebarCollapsed ? 'Import Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/import"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/import')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-upload" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Import Data</span>
                </NuxtLink>
              </NTooltip>

              <!-- Export -->
              <NTooltip :content="sidebarCollapsed ? 'Export Data' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/admin/export"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    isActive('/admin/export')
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-500'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-download" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Export Data</span>
                </NuxtLink>
              </NTooltip>
            </div>

            <!-- Back to Dashboard -->
            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <NTooltip :content="sidebarCollapsed ? 'Back to Dashboard' : undefined" :_tooltip-content="{ side: 'right' }" :disabled="!sidebarCollapsed">
                <NuxtLink
                  to="/dashboard"
                  :class="[
                    'flex items-center text-sm rounded-sm transition-all duration-200 mt-2',
                    sidebarCollapsed ? 'justify-center px-3 py-2' : 'justify-start px-3 py-2',
                    'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300'
                  ]"
                  @click="sidebarOpen = false"
                >
                  <NIcon name="i-ph-house" :class="['w-4 h-4', sidebarCollapsed ? '' : 'mr-3']" />
                  <span :class="['whitespace-nowrap transition-opacity duration-200 text-sm', sidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100']">Back to Dashboard</span>
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
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)

// Quote counts for badges
const publishedCount = ref(0)
const pendingCount = ref(0)
const draftCount = ref(0)
const harvestedCount = ref(0)

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

watch(() => route.path, (newPath) => {
  pageHeader.setHeaderFromRoute()
})

const loadQuoteCounts = async () => {
  try {
    // @ts-expect-error deep type instantiation from $fetch without explicit return type
    const stats = await $fetch('/api/admin/stats')
    if (stats?.data?.quotes) {
      publishedCount.value = stats.data.quotes.approved || 0
      pendingCount.value = stats.data.quotes.pending || 0
      draftCount.value = stats.data.quotes.draft || 0
      harvestedCount.value = stats.data.quotes.harvested || 0
    }
  } catch (error) {
    console.error('Failed to load admin quote counts:', error)
  }
}

const isActive = (to: string) => {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
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

<style>
[data-highlighted="true"] {
  scroll-margin-top: 5rem;
}
</style>
