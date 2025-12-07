<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        System overview and management tools
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="animate-pulse">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-8">
      <!-- System Stats -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Statistics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Quotes Stats -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quotes</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.quotes?.approved || 0 }} approved, {{ stats.quotes?.pending || 0 }} pending
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-quotes" size="xl" class="text-cyan-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.total || 0 }}</p>
            </div>
          </div>

          <!-- Users Stats -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.users?.active || 0 }} active
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-users" size="xl" class="text-gray-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.users?.total || 0 }}</p>
            </div>
          </div>

          <!-- Authors Stats -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Authors</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.authors?.fictional || 0 }} fictional
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-user" size="xl" class="text-blue-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.authors?.total || 0 }}</p>
            </div>
          </div>

          <!-- Collections Stats -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Collections</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.collections?.public || 0 }} public
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-bookmark" size="xl" class="text-orange-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.collections?.total || 0 }}</p>
            </div>
          </div>


        </div>
      </div>

      <!-- Engagement Stats -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Engagement</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Likes -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.likes?.unique_users || 0 }} users
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-heart" size="xl" class="text-red-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.likes?.total || 0 }}</p>
            </div>
          </div>

          <!-- Total Views -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ stats.views?.unique_users || 0 }} users
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-eye" size="xl" class="text-indigo-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.views?.total || 0 }}</p>
            </div>
          </div>

          <!-- Total Shares -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Shares</p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-share" size="xl" class="text-teal-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.total_shares || 0 }}</p>
            </div>
          </div>

          <!-- Featured -->
          <div class="border rounded-2 p-4">
            <div class="flex-1">
              <div class="w-full flex justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Featured</p>
                </div>
                <div class="flex-shrink-0">
                  <NIcon name="i-ph-star" size="xl" class="text-yellow-600" />
                </div>
              </div>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.featured || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div class="flex gap-4 flex-wrap">
          <NButton
            btn="soft-yellow"
            to="/admin/quotes/pending"
            :badge="stats.quotes?.pending || 0"
          >
            <NIcon name="i-ph-clock" />
            Review Pending Quotes
          </NButton>
          <NButton
            btn="outline"
            to="/admin/quotes/published"
          >
            <NIcon name="i-ph-check-circle" />
            Published Quotes
          </NButton>
          <NButton
            btn="outline"
            to="/admin/quotes/drafts"
          >
            <NIcon name="i-ph-file-dashed" />
            Draft Quotes
          </NButton>
          <NButton
            btn="outline"
            to="/admin/import"
          >
            <NIcon name="i-ph-upload" />
            Import Data
          </NButton>
          <NButton
            btn="outline"
            to="/admin/export"
          >
            <NIcon name="i-ph-download" />
            Export Data
          </NButton>
          <NButton
            btn="outline"
            to="/admin/maintenance"
          >
            <NIcon name="i-ph-wrench" />
            Database Maintenance
          </NButton>
          <NButton
            btn="outline"
            disabled
          >
            <NIcon name="i-ph-chart-bar" />
            Analytics (Soon)
          </NButton>
        </div>
      </div>

      <!-- Recent Activity & Top Contributors -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Activity -->
        <NCard>
          <template #header>
            <h3 class="text-lg font-semibold">Recent Activity (30 days)</h3>
          </template>

          <div v-if="stats.recent_activity && stats.recent_activity.length > 0" class="space-y-3">
            <div
              v-for="activity in stats.recent_activity.slice(0, 10)"
              :key="activity.date"
              class="flex items-center justify-between py-2"
            >
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(activity.date) }}
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ activity.count }} submissions
              </span>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        </NCard>

        <!-- Top Contributors -->
        <NCard>
          <template #header>
            <h3 class="text-lg font-semibold">Top Contributors</h3>
          </template>

          <div v-if="stats.top_contributors && stats.top_contributors.length > 0" class="space-y-3">
            <div
              v-for="(contributor, index) in stats.top_contributors"
              :key="contributor.id"
              class="flex items-center space-x-3"
            >
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-4">
                {{ index + 1 }}
              </span>
              <NAvatar
                :src="contributor.avatar_url"
                :alt="contributor.name"
                size="xs"
                :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ contributor.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ contributor.quote_count }} quotes, {{ contributor.total_likes }} likes
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">No contributors yet</p>
          </div>
        </NCard>
      </div>
    </div>
  </div>
</template>

<script setup>
// Use admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// SEO
useHead({
  title: 'Admin Dashboard - Verbatims'
})

// Data
const stats = ref({})
const loading = ref(true)

// Load admin statistics
const loadStats = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load admin stats:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load initial data
onMounted(() => {
  loadStats()
})

// Auto-refresh every 5 minutes
const refreshInterval = setInterval(loadStats, 5 * 60 * 1000)

// Cleanup interval on unmount
onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>
