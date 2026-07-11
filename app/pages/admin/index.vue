<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-center justify-between gap-4">
        <h1 class="font-serif text-3xl md:text-5xl font-200 text-gray-900 dark:text-gray-100 leading-tight">
          {{ $t('title') }}
        </h1>
        <p class="font-sans text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{{ currentDate }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-8">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 md:flex">
        <div v-for="i in 6" :key="i" class="px-4 py-4 md:flex-1 animate-pulse">
          <div class="h-6 bg-gray-100 dark:bg-gray-800 rounded w-16 mb-2" />
          <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div class="lg:col-span-8 lg:border-r border-dashed border-gray-200 dark:border-gray-700 lg:pr-8 pb-8">
          <div class="space-y-4">
            <div v-for="i in 5" :key="i" class="flex items-start gap-3 animate-pulse">
              <div class="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-1.5 flex-shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Editorial Stats Bar -->
      <div class="border border-dashed border-gray-200 dark:border-gray-700 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 md:flex mb-8">
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.quotes?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_total_quotes') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.quotes?.approved || 0 }} {{ $t('stat_approved') }} &middot; {{ stats.quotes?.pending || 0 }} {{ $t('stat_pending') }}</p>
        </div>
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.users?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_total_users') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.users?.active || 0 }} {{ $t('stat_active') }}</p>
        </div>
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.authors?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_authors') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.authors?.fictional || 0 }} {{ $t('stat_fictional') }}</p>
        </div>
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.collections?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_collections') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.collections?.public || 0 }} {{ $t('stat_public') }}</p>
        </div>
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.likes?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_total_likes') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.likes?.unique_users || 0 }} {{ $t('stat_users') }}</p>
        </div>
        <div class="px-4 py-4 md:flex-1">
          <p class="font-serif text-2xl md:text-3xl font-600 text-gray-900 dark:text-gray-100 tabular-nums leading-none">{{ stats.views?.total || 0 }}</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">{{ $t('stat_total_views') }}</p>
          <p class="font-sans text-[10px] text-gray-400 dark:text-gray-500">{{ stats.views?.unique_users || 0 }} {{ $t('stat_users') }}</p>
        </div>
      </div>

      <!-- Two-column editorial layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <!-- Main column: Recent Activity -->
        <div class="lg:col-span-8 lg:border-r border-dashed border-gray-300 dark:border-gray-700 lg:pr-8 pb-8">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                {{ $t('section_recent_activity') }}
              </p>
            </div>
            <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('period_30_days') }}</span>
          </div>

          <div v-if="stats.recent_activity && stats.recent_activity.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="(activity, idx) in stats.recent_activity"
              :key="activity.timestamp + activity.type + activity.user_name"
              class="flex items-start gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in-up"
              :style="{ animationDelay: `${idx * 0.03}s` }"
            >
              <div class="mt-0.5 flex-shrink-0">
                <img
                  v-if="activity.user_avatar"
                  :src="activity.user_avatar"
                  :alt="activity.user_name"
                  class="w-6 h-6 rounded-full"
                />
                <div
                  v-else
                  class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <span class="font-sans text-xs font-500 text-gray-400 dark:text-gray-500">{{ activity.user_name.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-sans text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  <span class="font-500 text-gray-900 dark:text-gray-100">{{ activity.user_name }}</span>
                  <span class="text-gray-500 dark:text-gray-400 ml-1">{{ getActionText(activity) }}</span>
                  <NTooltip v-if="activity.description" :content="activity.description" :_tooltip-content="{ class: 'max-w-xs font-sans text-xs' }">
                    <NuxtLink
                      v-if="activity.quote_status === 'approved'"
                      :to="`/quotes/${activity.quote_id}`"
                      class="text-gray-900 dark:text-gray-100 ml-1 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                      target="_blank"
                    >&ldquo;{{ truncate(activity.description, 50) }}&rdquo;</NuxtLink>
                    <span v-else class="text-gray-900 dark:text-gray-100 ml-1">&ldquo;{{ truncate(activity.description, 50) }}&rdquo;</span>
                  </NTooltip>
                </p>
                <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {{ formatRelativeTime(activity.timestamp) }}
                  <span v-if="activity.secondary_info" class="text-gray-400 dark:text-gray-500"> &middot; {{ activity.secondary_info }}</span>
                </p>
              </div>
            </div>
          </div>
          <div v-else class="py-10 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
            <p class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">{{ $t('empty_activity') }}</p>
          </div>
        </div>

        <!-- Sidebar column -->
        <div class="lg:col-span-4 lg:pl-8 pb-8">
          <!-- Quick Actions -->
          <div class="mb-8 pb-6 border-b border-dashed border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                {{ $t('section_quick_actions') }}
              </p>
            </div>
            <div class="space-y-1">
              <NuxtLink to="/admin/quotes/pending" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-clock" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('action_review_pending') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <NBadge v-if="stats.quotes?.pending > 0" :label="`${stats.quotes.pending}`" badge="soft-gray" size="xs" />
                  <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
                </div>
              </NuxtLink>
              <NuxtLink to="/admin/quotes/published" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-check-circle" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('action_published_quotes') }}</span>
                </div>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </NuxtLink>
              <NuxtLink to="/admin/quotes/drafts" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-file-dashed" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('action_draft_quotes') }}</span>
                </div>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </NuxtLink>
              <NuxtLink to="/admin/authors" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-user" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('admin.nav.authors') }}</span>
                </div>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </NuxtLink>
              <NuxtLink to="/admin/import" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-upload" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('action_import_data') }}</span>
                </div>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </NuxtLink>
              <NuxtLink to="/admin/export" class="group flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 -mx-2 px-2 rounded-sm transition-colors last:border-b-0">
                <div class="flex items-center gap-2">
                  <NIcon name="i-ph-download" class="w-4 h-4 text-gray-400" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ $t('action_export_data') }}</span>
                </div>
                <span class="font-sans text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Top Contributors -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                {{ $t('section_top_contributors') }}
              </p>
            </div>

            <div v-if="stats.top_contributors && stats.top_contributors.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="(contributor, idx) in stats.top_contributors"
                :key="contributor.id"
                class="flex items-center gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in-up"
                :style="{ animationDelay: `${idx * 0.05}s` }"
              >
                <span class="font-sans text-sm text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">{{ idx + 1 }}.</span>
                <NAvatar
                  :src="contributor.avatar_url"
                  :alt="contributor.name"
                  size="xs"
                />
                <div class="min-w-0 flex-1">
                  <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ contributor.name }}</p>
                  <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ contributor.quote_count }} {{ $t('stat_quotes') }} &middot; {{ contributor.total_likes }} {{ $t('stat_likes') }}</p>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
              <p class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">{{ $t('empty_contributors') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatRelativeTime } from '~/utils/time-formatter'

function getActionText(activity) {
  if (activity.type === 'quote_submitted') return String($t('action_submitted'))
  if (activity.type === 'quote_moderated') return activity.action?.toLowerCase() || String($t('action_moderated'))
  if (activity.type === 'user_registered') return String($t('action_registered'))
  return activity.action?.toLowerCase() || ''
}

function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { $t } = useI18n()

useHead({
  title: String($t('meta_title'))
})

const stats = ref({})
const loading = ref(true)

const today = new Date()
const currentDate = today.toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const loadStats = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load admin stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})

const refreshInterval = setInterval(loadStats, 5 * 60 * 1000)

onUnmounted(() => {
  clearInterval(refreshInterval)
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
</style>
