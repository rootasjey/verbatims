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
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-quotes" class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quotes</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.quotes?.approved || 0 }} approved, {{ stats.quotes?.pending || 0 }} pending
                </p>
              </div>
            </div>
          </UCard>

          <!-- Users Stats -->
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-users" class="h-8 w-8 text-green-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.users?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.users?.active || 0 }} active
                </p>
              </div>
            </div>
          </UCard>

          <!-- Authors Stats -->
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-user" class="h-8 w-8 text-purple-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Authors</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.authors?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.authors?.fictional || 0 }} fictional
                </p>
              </div>
            </div>
          </UCard>

          <!-- Collections Stats -->
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-bookmark" class="h-8 w-8 text-orange-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Collections</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.collections?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.collections?.public || 0 }} public
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Engagement Stats -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Engagement</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-heart" class="h-8 w-8 text-red-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.likes?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.likes?.unique_users || 0 }} users
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-eye" class="h-8 w-8 text-indigo-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.views?.total || 0 }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ stats.views?.unique_users || 0 }} users
                </p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-share" class="h-8 w-8 text-teal-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Shares</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.total_shares || 0 }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UIcon name="i-ph-star" class="h-8 w-8 text-yellow-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Featured</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.quotes?.featured || 0 }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <UButton
            block
            icon
            label="i-ph-clock"
            to="/admin/quotes/pending"
            :badge="stats.quotes?.pending || 0"
          >
            Review Pending Quotes
          </UButton>
          <UButton
            block
            variant="outline"
            icon
            label="i-ph-users"
            to="/admin/users"
          >
            Manage Users
          </UButton>
          <UButton
            block
            variant="outline"
            icon
            label="i-ph-user"
            to="/admin/authors"
          >
            Manage Authors
          </UButton>
          <UButton
            block
            variant="outline"
            icon
            label="i-ph-upload"
            to="/admin/import"
          >
            Import Data
          </UButton>
          <UButton
            block
            variant="outline"
            icon
            label="i-ph-database"
            to="/admin/data-management"
          >
            Data Management
          </UButton>
          <UButton
            block
            variant="outline"
            icon
            label="i-ph-chart-bar"
            to="/admin/analytics"
          >
            View Analytics
          </UButton>
        </div>
      </div>

      <!-- Recent Activity & Top Contributors -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Activity -->
        <UCard>
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
        </UCard>

        <!-- Top Contributors -->
        <UCard>
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
              <UAvatar
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
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
// Require admin authentication
definePageMeta({
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
