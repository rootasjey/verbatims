<template>
  <div>
    <!-- Greeting -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-2">
        {{ currentDate }}
      </p>
      <h1 class="font-serif text-3xl md:text-5xl font-200 text-gray-900 dark:text-gray-100 leading-tight">
        {{ greeting }}, <span class="font-600">{{ user?.name || 'there' }}</span>.
      </h1>
    </div>

    <!-- Editorial Stats Bar -->
    <div class="border border-dashed border-gray-200 dark:border-gray-700 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 md:flex mb-8">
      <div v-for="(value, key) in userStats" :key="key"
        class="px-4 py-3 md:py-4 md:flex-1"
      >
        <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">
          {{ value.toLocaleString() }}
        </p>
        <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">
          {{ formatStatsLabel(key) }}
        </p>
      </div>
    </div>

    <!-- Two-column editorial layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">

      <!-- Main column: Recent Submissions -->
      <div class="lg:col-span-8 lg:border-r border-dashed border-gray-300 dark:border-gray-700 lg:pr-8 pb-8">

        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
              Recent Submissions
            </p>
          </div>
          <NuxtLink to="/dashboard/my-quotes/published" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            See All &rarr;
          </NuxtLink>
        </div>

        <div v-if="dataLoaded && recentSubmissions.length === 0" class="py-10 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
          <p class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">No submissions yet</p>
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-2">Submit your first quote to get started</p>
        </div>

        <div v-else-if="!dataLoaded" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-start gap-3 animate-pulse">
            <div class="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-1.5 flex-shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
              <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-32" />
            </div>
          </div>
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="quote in recentSubmissions" :key="quote.id"
            class="py-4 first:pt-0 last:pb-0 animate-fade-in-up"
            :style="{ animationDelay: `${recentSubmissions.indexOf(quote) * 0.05}s` }"
          >
            <div class="flex items-start gap-3">
              <span class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" :class="statusDotClass(quote.status)" />
              <div class="min-w-0 flex-1">
                <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2">
                  &ldquo;{{ quote.name }}&rdquo;
                </blockquote>
                <div class="flex items-center gap-3 mt-1.5">
                  <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatDate(quote.created_at) }}</p>
                  <span class="font-sans text-xs px-1.5 py-0.5" :class="statusPillClass(quote.status)">
                    {{ statusLabel(quote.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar column -->
      <div class="lg:col-span-4 lg:pl-8 pb-8">

        <!-- Quick Links -->
        <div class="mb-8 pb-6 border-b border-dashed border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
              Quick Links
            </p>
          </div>
          <div class="space-y-1">
            <NuxtLink to="/dashboard/lists"
              class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors"
            >
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Manage Lists</span>
              <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/favourites"
              class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors"
            >
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">View Favourites</span>
              <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/my-quotes/drafts"
              class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors"
            >
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">My Drafts</span>
              <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
            </NuxtLink>
            <NuxtLink to="/dashboard/sponsors"
              class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors"
            >
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">My Sponsorships</span>
              <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
            </NuxtLink>
          </div>
        </div>

        <!-- My Lists -->
        <div class="mb-8 pb-6 border-b border-dashed border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                My Lists
              </p>
            </div>
            <NuxtLink to="/dashboard/lists" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              See All &rarr;
            </NuxtLink>
          </div>

          <div v-if="dataLoaded && recentCollections.length === 0" class="py-6 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
            <p class="font-sans text-sm text-gray-400 dark:text-gray-500 italic mb-3">No collections yet</p>
            <NuxtLink to="/dashboard/lists" class="font-sans text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 inline-block hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Create List &rarr;
            </NuxtLink>
          </div>

          <div v-else-if="!dataLoaded" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-1" />
              <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
            </div>
          </div>

          <div v-else class="space-y-1">
            <NuxtLink v-for="collection in recentCollections" :key="collection.id"
              :to="`/dashboard/lists/${collection.id}`"
              class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors"
            >
              <div class="min-w-0 flex-1">
                <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {{ collection.name }}
                </p>
                <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ collection.quotes_count }} {{ collection.quotes_count === 1 ? 'quote' : 'quotes' }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                <span v-if="collection.is_public" class="font-sans text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5">Public</span>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Submit Quote CTA -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
              Submit a Quote
            </p>
          </div>
          <p class="font-body text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Share a quote that moved you. Find it in your drafts after submitting.
          </p>
          <NuxtLink to="/dashboard/my-quotes/drafts"
            class="inline-flex items-center gap-1.5 font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
          >
            Submit Quote &rarr;
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/time-formatter'

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

const dataLoaded = ref(false)

const today = new Date()
const currentDate = today.toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
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
    recentCollections.value = Array.isArray(collectionsData?.data?.results) ? collectionsData.data.results : []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    dataLoaded.value = true
  }
}

const statusDotClass = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-500'
    case 'rejected': return 'bg-red-500'
    case 'draft': return 'bg-yellow-500'
    case 'pending': return 'bg-blue-400'
    default: return 'bg-gray-400'
  }
}

const statusPillClass = (status: string) => {
  switch (status) {
    case 'approved': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'rejected': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'draft': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'pending': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'draft': return 'Draft'
    case 'pending': return 'Pending'
    default: return status
  }
}

const formatStatsLabel = (key: string) => {
  switch (key) {
    case 'submitted': return 'Submitted'
    case 'approved': return 'Published'
    case 'likes': return 'Likes Received'
    case 'collections': return 'Collections'
    case 'likes_given': return 'Likes Given'
    default: return 'Submitted'
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
