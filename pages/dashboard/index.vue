<template>
  <div>
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="(value, key) in userStats" :key="key" 
        class="bg-white dark:bg-[#0C0A09] rounded-lg border b-dashed">
        <div class="px-6 py-4 flex flex-col justify-center">
          <div class="flex flex-shrink-0 gap-2">
            <NIcon :name="getStatsIcon(key)" />
            <p class="text-sm font-600 text-gray-500 dark:text-gray-400">{{ formatStatsLabel(key) }}</p>
          </div>
          <div>
            <p class="font-sans text-6xl font-600 text-gray-900 dark:text-white">{{ value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-4">
        <NButton btn="outline-dark dark:outline-white" to="/dashboard/lists">
          <NIcon name="i-ph-bookmark" />
          Manage Lists
        </NButton>
        <NButton btn="outline-dark dark:outline-white" to="/dashboard/favourites">
          <NIcon name="i-ph-heart" />
          View Favourites
        </NButton>
        <NButton btn="outline-dark dark:outline-white" to="/dashboard/my-quotes/drafts">
          <NIcon name="i-ph-file-dashed" />
          My Drafts
        </NButton>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Submissions -->
      <NCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Recent Submissions</h3>
            <NButton btn="link" size="xs" to="/dashboard/my-quotes/published">
              View All
            </NButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="recentSubmissions.length === 0">
            <p class="text-gray-500 dark:text-gray-400">No submissions yet</p>
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
              <NBadge 
                :color="getStatusColor(quote.status)" 
                variant="subtle"
                size="xs"
              >
                {{ quote.status }}
              </NBadge>
            </div>
          </div>
        </div>
      </NCard>

      <!-- Recent Collections -->
      <NCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">My Lists</h3>
            <NButton btn="link" size="xs" to="/dashboard/lists">
              View All
            </NButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="recentCollections.length === 0">
            <p class="text-gray-500 dark:text-gray-400">No collections yet</p>
            <NButton btn="solid-dark dark:solid-white" class="mt-4" to="/dashboard/lists">
              Create List
            </NButton>
          </div>

          <div v-for="collection in recentCollections" :key="collection.id" class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ collection.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count }} quotes
                </p>
              </div>
              <NBadge v-if="collection.is_public" color="green" variant="subtle" size="xs">
                Public
              </NBadge>
            </div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

        <div class="space-y-4">
          <div v-if="recentSubmissions.length === 0">
            <p class="text-gray-500 dark:text-gray-400">No submissions yet</p>
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
              <NBadge 
                :color="getStatusColor(quote.status)" 
                variant="subtle"
                size="xs"
              >
                {{ quote.status }}
              </NBadge>
            </div>
          </div>
        </div>
      </NCard>

      <!-- Recent Collections -->
      <NCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">My Lists</h3>
            <NButton btn="link" size="xs" to="/dashboard/lists">
              View All
            </NButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="recentCollections.length === 0">
            <p class="text-gray-500 dark:text-gray-400">No collections yet</p>
            <NButton btn="solid-dark dark:solid-white" class="mt-4" to="/dashboard/lists">
              Create List
            </NButton>
          </div>

          <div v-for="collection in recentCollections" :key="collection.id" class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ collection.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count }} quotes
                </p>
              </div>
              <NBadge v-if="collection.is_public" color="green" variant="subtle" size="xs">
                Public
              </NBadge>
            </div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Dashboard - Verbatims'
})

const { user } = useUserSession()
const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const userStats = ref({
  submitted: 0,
  approved: 0,
  likes: 0,
  collections: 0,
  likes_given: 0
})
const recentSubmissions = ref<any[]>([])
const recentCollections = ref<any[]>([])

const loadDashboardData = async () => {
  try {
    const [statsData, submissionsData, collectionsData] = await Promise.all([
      $fetch('/api/dashboard/stats'),
      $fetch('/api/dashboard/submissions?limit=5'),
      $fetch('/api/dashboard/collections?limit=5')
    ])
    
    if (statsData?.data) {
      userStats.value = {
        submitted: Number(statsData.data.submitted) || 0,
        approved: Number(statsData.data.approved) || 0,
        likes: Number(statsData.data.likes) || 0,
        collections: Number(statsData.data.collections) || 0,
        likes_given: Number(statsData.data.likes_given) || 0
      }
    }
    recentSubmissions.value = Array.isArray(submissionsData?.data) ? submissionsData.data : []
    recentCollections.value = Array.isArray(collectionsData?.data) ? collectionsData.data : []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

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

const getStatsIcon = (key: string) => {
  switch (key) {
    case 'submitted': return 'i-solar-card-send-linear'
    case 'approved': return 'i-solar-check-square-outline'
    case 'likes': return 'i-solar-heart-linear'
    case 'collections': return 'i-solar-bookmark-linear'
    case 'likes_given': return 'i-solar-hearts-bold-duotone'
    default: return 'i-solar-card-send-linear'
  }
}

const formatStatsLabel = (key: string) => {
  switch (key) {
    case 'submitted': return 'Submitted Quotes'
    case 'approved': return 'Approved'
    case 'likes': return 'Likes Received'
    case 'collections': return 'Collections'
    case 'likes_given': return 'Likes Given'
    default: return 'Submitted Quotes'
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
