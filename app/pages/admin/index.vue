<template>
  <main>
    <div v-if="loading" aria-label="Loading admin overview" class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="animate-pulse space-y-4">
        <div class="h-9 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        <div class="h-10 w-48 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
      <div class="animate-pulse space-y-4">
        <div class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div class="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
        <div class="h-8 w-56 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>

    <div v-else-if="loadError" class="border-y border-gray-200 py-8 dark:border-gray-800">
      <p class="text-base text-gray-800 dark:text-gray-200">{{ $t('load_error') }}</p>
      <button class="mt-3 text-sm underline underline-offset-4" @click="loadStats()">{{ $t('retry') }}</button>
    </div>

    <div v-else>
      <section class="grid gap-10 border-b border-gray-200 pb-10 dark:border-gray-800 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div>
          <div class="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h2 class="font-serif text-3xl text-gray-950 dark:text-gray-50">{{ $t('section_moderation') }}</h2>
            <span class="text-sm tabular-nums text-gray-500 dark:text-gray-400">
              {{ stats.quotes?.pending || 0 }} {{ $t('pending_heading') }}
            </span>
          </div>
          <p class="mt-3 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-400">
            {{ stats.quotes?.pending ? $t('pending_description') : $t('pending_clear') }}
          </p>
          <NuxtLink
            to="/admin/quotes/pending"
            class="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-gray-950 px-5 text-sm font-600 text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gray-500 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white"
          >
            {{ $t('action_review_pending') }}
            <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div class="border-t border-gray-200 pt-6 dark:border-gray-800 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <h2 class="font-serif text-2xl text-gray-950 dark:text-gray-50">{{ $t('section_editorial') }}</h2>
          <p class="mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
            {{ $t('editorial_description') }}
          </p>
          <nav aria-label="Editorial tools" class="mt-5 divide-y divide-gray-200 dark:divide-gray-800">
            <NuxtLink to="/admin/themes" class="group flex min-h-12 items-center justify-between gap-4 py-3 text-base text-gray-800 transition-colors hover:text-gray-500 dark:text-gray-200 dark:hover:text-gray-400">
              <span class="flex items-center gap-3"><NIcon name="i-ph-palette" class="h-5 w-5 text-gray-500" />{{ $t('action_manage_themes') }}</span>
              <NIcon name="i-ph-arrow-up-right" class="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </NuxtLink>
            <NuxtLink to="/admin/authors" class="group flex min-h-12 items-center justify-between gap-4 py-3 text-base text-gray-800 transition-colors hover:text-gray-500 dark:text-gray-200 dark:hover:text-gray-400">
              <span class="flex items-center gap-3"><NIcon name="i-ph-user" class="h-5 w-5 text-gray-500" />{{ $t('admin.nav.authors') }}</span>
              <NIcon name="i-ph-arrow-up-right" class="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </NuxtLink>
            <NuxtLink to="/admin/references" class="group flex min-h-12 items-center justify-between gap-4 py-3 text-base text-gray-800 transition-colors hover:text-gray-500 dark:text-gray-200 dark:hover:text-gray-400">
              <span class="flex items-center gap-3"><NIcon name="i-ph-books" class="h-5 w-5 text-gray-500" />{{ $t('admin.nav.references') }}</span>
              <NIcon name="i-ph-arrow-up-right" class="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </NuxtLink>
          </nav>
        </div>
      </section>

      <section class="pt-8" aria-labelledby="recent-activity-title">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="recent-activity-title" class="font-serif text-2xl text-gray-950 dark:text-gray-50">
            {{ $t('section_recent_activity') }}
          </h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t('period_30_days') }}</span>
        </div>

        <div v-if="recentActivity.length" class="divide-y divide-gray-200 dark:divide-gray-800">
          <article
            v-for="activity in recentActivity"
            :key="activity.timestamp + activity.type + activity.user_name"
            class="flex items-start gap-3 py-4 first:pt-2"
          >
            <NAvatar :src="activity.user_avatar" :alt="activity.user_name" size="xs" class="mt-0.5 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm leading-6 text-gray-700 dark:text-gray-300">
                <span class="font-600 text-gray-950 dark:text-gray-50">{{ activity.user_name }}</span>
                <span class="ml-1">{{ getActionText(activity) }}</span>
                <NTooltip v-if="activity.description" :content="activity.description" :_tooltip-content="{ class: 'max-w-xs text-xs' }">
                  <NuxtLink
                    v-if="activity.target_type === 'quote' && activity.quote_status === 'approved'"
                    :to="`/quotes/${activity.target_id}`"
                    class="ml-1 text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-700 dark:text-gray-50 dark:decoration-gray-700 dark:hover:decoration-gray-300"
                    target="_blank"
                  >&ldquo;{{ truncate(activity.description, 50) }}&rdquo;</NuxtLink>
                  <NuxtLink
                    v-else-if="activity.target_type === 'author'"
                    :to="`/authors/${activity.target_id}`"
                    class="ml-1 text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-700 dark:text-gray-50 dark:decoration-gray-700 dark:hover:decoration-gray-300"
                    target="_blank"
                  >{{ truncate(activity.description, 50) }}</NuxtLink>
                  <NuxtLink
                    v-else-if="activity.target_type === 'reference'"
                    :to="`/references/${activity.target_id}`"
                    class="ml-1 text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-700 dark:text-gray-50 dark:decoration-gray-700 dark:hover:decoration-gray-300"
                    target="_blank"
                  >{{ truncate(activity.description, 50) }}</NuxtLink>
                  <span v-else class="ml-1 text-gray-950 dark:text-gray-50">&ldquo;{{ truncate(activity.description, 50) }}&rdquo;</span>
                </NTooltip>
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(activity.timestamp) }}
                <span v-if="activity.secondary_info"> · {{ activity.secondary_info }}</span>
              </p>
            </div>
          </article>
        </div>
        <p v-else class="border-t border-gray-200 py-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {{ $t('empty_activity') }}
        </p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $t } = useI18n()
useHead({ title: String($t('meta_title')) })

const stats = ref<Record<string, any>>({})
const loading = ref(true)
const loadError = ref(false)
const hasLoaded = ref(false)
const recentActivity = computed(() => stats.value.recent_activity?.slice(0, 8) ?? [])

function getActionText(activity: any) {
  if (activity.type === 'quote_submitted') return String($t('action_submitted'))
  if (activity.type === 'quote_moderated') return activity.action?.toLowerCase() || String($t('action_moderated'))
  if (activity.type === 'user_registered') return String($t('action_registered'))
  return activity.action?.toLowerCase() || ''
}

function truncate(text: string, max: number) {
  return text?.length > max ? `${text.slice(0, max)}…` : text || ''
}

async function loadStats() {
  loading.value = !hasLoaded.value
  loadError.value = false
  try {
    const response = await $fetch<{ data: Record<string, any> }>('/api/admin/stats')
    stats.value = response.data || {}
    hasLoaded.value = true
  } catch (error) {
    console.error('Failed to load admin stats:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

let refreshInterval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  loadStats()
  refreshInterval = setInterval(loadStats, 5 * 60 * 1000)
})
onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>
