<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Welcome back, {{ user.name }}!
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage your quotes, collections, and account settings.
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <UCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UIcon name="i-ph-file-text" class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted Quotes</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ userStats.submitted }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UIcon name="i-ph-check-circle" class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ userStats.approved }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UIcon name="i-ph-heart" class="h-8 w-8 text-red-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Likes Received</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ userStats.likes }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UIcon name="i-ph-bookmark" class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Collections</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ userStats.collections }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-4">
        <UButton icon="i-ph-plus" @click="showSubmitModal = true">
          Submit New Quote
        </UButton>
        <UButton variant="outline" icon="i-ph-bookmark" to="/dashboard/collections">
          Manage Collections
        </UButton>
        <UButton variant="outline" icon="i-ph-file-text" to="/dashboard/submissions">
          View Submissions
        </UButton>
        <UButton variant="outline" icon="i-ph-gear" to="/dashboard/settings">
          Account Settings
        </UButton>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Submissions -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Recent Submissions</h3>
            <UButton variant="ghost" size="sm" to="/dashboard/submissions">
              View All
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="recentSubmissions.length === 0" class="text-center py-8">
            <UIcon name="i-ph-file-text" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No submissions yet</p>
            <UButton class="mt-4" @click="showSubmitModal = true">
              Submit Your First Quote
            </UButton>
          </div>

          <div v-for="quote in recentSubmissions" :key="quote.id" class="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  "{{ quote.name }}"
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatDate(quote.created_at) }}
                </p>
              </div>
              <UBadge 
                :color="getStatusColor(quote.status)" 
                variant="subtle"
                size="xs"
              >
                {{ quote.status }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Recent Collections -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">My Collections</h3>
            <UButton variant="ghost" size="sm" to="/dashboard/collections">
              View All
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="recentCollections.length === 0" class="text-center py-8">
            <UIcon name="i-ph-bookmark" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No collections yet</p>
            <UButton class="mt-4" to="/dashboard/collections">
              Create Collection
            </UButton>
          </div>

          <div v-for="collection in recentCollections" :key="collection.id" class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ collection.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count }} quotes
                </p>
              </div>
              <UBadge v-if="collection.is_public" color="green" variant="subtle" size="xs">
                Public
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Submit Quote Modal -->
    <SubmitQuoteModal v-model="showSubmitModal" @submitted="refreshData" />
  </div>
</template>

<script setup>
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// SEO
useHead({
  title: 'Dashboard - Verbatims'
})

const { user } = useUserSession()

// Data
const showSubmitModal = ref(false)
const userStats = ref({
  submitted: 0,
  approved: 0,
  likes: 0,
  collections: 0
})
const recentSubmissions = ref([])
const recentCollections = ref([])

// Load dashboard data
const loadDashboardData = async () => {
  try {
    const [statsData, submissionsData, collectionsData] = await Promise.all([
      $fetch('/api/dashboard/stats'),
      $fetch('/api/dashboard/submissions?limit=5'),
      $fetch('/api/dashboard/collections?limit=5')
    ])
    
    userStats.value = statsData.data || userStats.value
    recentSubmissions.value = submissionsData.data || []
    recentCollections.value = collectionsData.data || []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'draft': return 'yellow'
    default: return 'gray'
  }
}

const refreshData = () => {
  loadDashboardData()
}

// Load data on mount
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
