<template>
  <div class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <!-- Mobile Diary Interface -->
    <div v-if="isMobile" class="mobile-diary-page">
      <!-- Greeting -->
      <div class="px-6 pt-10 pb-6 animate-fade-in-up" style="animation-delay: 0s">
        <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-2">
          {{ formattedDate }}
        </p>
        <h1 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 leading-tight">
          {{ dayGreeting }}, <span class="font-600">{{ user?.name || $t('greeting_fallback') }}</span>.
        </h1>
      </div>

      <!-- Recent Quote (diary entry moment) -->
      <div v-if="recentQuote" class="px-6 pb-5 animate-fade-in-up" style="animation-delay: 0.05s">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_latest') }}</p>
          </div>
          <NuxtLink :to="`/quotes/${recentQuote.id}`" class="block group">
            <blockquote class="font-serif text-xl font-200 text-gray-900 dark:text-gray-100 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              &ldquo;{{ recentQuote.name }}&rdquo;
            </blockquote>
            <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ recentQuote.author?.name || $t('common.unknown') }}
              <template v-if="recentQuote.reference"> &mdash; {{ recentQuote.reference.name }}</template>
            </p>
          </NuxtLink>
        </div>
      </div>
      <div v-else-if="recentQuoteLoading" class="px-6 pb-5 animate-fade-in-up" style="animation-delay: 0.05s">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5">
          <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
          <div class="space-y-2">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5" />
          </div>
          <div class="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
        </div>
      </div>

      <!-- Stats (editorial inline pill) -->
      <div v-if="!statsLoading" class="px-6 pb-6 animate-fade-in-up" style="animation-delay: 0.1s">
        <div v-if="totalQuotes > 0" class="overflow-x-auto inline-flex items-center gap-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-3 py-2">
          <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">{{ totalQuotes }}</span>
          <span class="font-sans text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ $t('label_quotes') }}</span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">{{ userStats.approved }}</span>
          <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('label_published') }}</span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">{{ userStats.pending }}</span>
          <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('label_pending') }}</span>
        </div>
        <p v-else class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">
          {{ $t('empty_stats') }}
        </p>
      </div>
      <div v-else class="px-6 pb-6 animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="h-8 w-56 bg-gray-100 dark:bg-gray-800 rounded-sm animate-pulse" />
      </div>

      <div class="border-t border-dashed border-gray-200 dark:border-gray-700" />

      <!-- Quick Action: Add Quote (single editorial row) -->
      <div class="px-6 py-5 animate-fade-in-up" style="animation-delay: 0.15s">
        <button
          @click="showAddQuote = true"
          class="w-full flex items-center gap-3 group cursor-pointer"
        >
          <span class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            <NIcon name="i-ph-quotes" class="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
          </span>
          <div class="text-left">
            <p class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{{ $t('action_add') }}</p>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('action_add_desc') }}</p>
          </div>
          <span class="ml-auto font-sans text-sm text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors">&rarr;</span>
        </button>
      </div>

      <div class="border-t border-dashed border-gray-200 dark:border-gray-700" />

      <!-- Library (full-width list, no card wrapper) -->
      <div class="px-6 py-5 animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="flex items-center gap-2 mb-5">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_library') }}</p>
        </div>

        <div class="-mx-6">
          <NuxtLink
            v-for="item in libraryItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-between px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group border-b border-dashed border-gray-100 dark:border-gray-800 last:border-b-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="min-w-0">
                <p class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors truncate">{{ item.label }}</p>
                <p class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-3">
              <NBadge v-if="item.badge && userStats[item.badge.key] > 0" :badge="item.badge.variant" size="xs">
                {{ userStats[item.badge.key] }}
              </NBadge>
              <NIcon name="i-ph-caret-right" class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="border-t border-dashed border-gray-200 dark:border-gray-700" />

      <!-- Version -->
      <div class="px-6 py-6 text-center animate-fade-in-up" style="animation-delay: 0.5s">
        <NButton btn="~" link to="/about" class="font-body font-600 text-gray-500 dark:text-gray-400 rounded-2 bg-gray-100 dark:bg-gray-900 py-3">
          {{ $t('version', { version: config.public.appVersion }) }}
        </NButton>
      </div>
    </div>

    <!-- Desktop: Editorial placeholder with teaser -->
    <div v-else class="flex items-center justify-center min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
      <div class="text-center max-w-sm px-6">
        <div class="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-8" />
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-3 leading-tight">{{ $t('desktop_title') }}</h2>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {{ $t('desktop_desc') }}
        </p>

        <!-- Latest quote teaser -->
        <div v-if="recentQuote" class="text-left bg-gray-100 dark:bg-gray-800 rounded-sm px-4 py-4 mb-6">
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-2">{{ $t('section_latest') }}</p>
          <blockquote class="font-serif text-base font-200 text-gray-900 dark:text-gray-100 leading-snug">
            &ldquo;{{ recentQuote.name }}&rdquo;
          </blockquote>
          <p class="mt-1.5 font-sans text-xs text-gray-500 dark:text-gray-400">
             {{ recentQuote.author?.name || $t('common.unknown') }}
            <template v-if="recentQuote.reference"> &mdash; {{ recentQuote.reference.name }}</template>
          </p>
        </div>

        <!-- Stats teaser -->
        <div v-if="totalQuotes > 0" class="inline-flex items-center gap-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-3 py-2 mb-6">
          <span class="font-serif text-base font-600 text-gray-900 dark:text-gray-100 tabular-nums">{{ totalQuotes }}</span>
          <span class="font-sans text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ $t('label_quotes') }}</span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <span class="font-serif text-base font-600 text-gray-900 dark:text-gray-100 tabular-nums">{{ userStats.approved }}</span>
          <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('label_published') }}</span>
        </div>

        <NButton btn="solid-black" @click="navigateTo('/dashboard')">
          {{ $t('desktop_button') }}
        </NButton>
        <div class="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mt-8" />
      </div>
    </div>

    <AddQuoteDrawer
      v-if="isMobile"
      v-model:open="showAddQuote"
      @submitted="handleQuoteAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from 'nuxt/app'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { $t, locale: locale } = useI18n() as any

useHead({
  title: $t('meta_title') as string,
  meta: [
    {
      name: 'description',
      content: $t('meta_desc') as string,
    }
  ]
})

const config = useRuntimeConfig()
const { isMobile } = useMobileDetection()

const { user } = useUserSession()
const showAddQuote = ref(false)

const libraryItems = computed(() => [
  { to: '/dashboard/favourites', icon: 'i-ph-heart-duotone', label: $t('link_favourites'), description: $t('desc_favourites') },
  { to: '/dashboard/lists', icon: 'i-ph-bookmark-duotone', label: $t('link_collections'), description: $t('desc_collections') },
  { to: '/dashboard/my-quotes/drafts', icon: 'i-ph-pencil-duotone', label: $t('link_drafts'), description: $t('desc_drafts'), badge: { key: 'draft' as const, variant: 'soft-gray' as const } },
  { to: '/dashboard/my-quotes/pending', icon: 'i-ph-clock-duotone', label: $t('link_pending'), description: $t('desc_pending'), badge: { key: 'pending' as const, variant: 'soft-orange' as const } },
  { to: '/dashboard/my-quotes/published', icon: 'i-ph-check-circle-duotone', label: $t('link_published'), description: $t('desc_published'), badge: { key: 'approved' as const, variant: 'soft-blue' as const } },
  { to: '/dashboard/settings', icon: 'i-ph-gear-duotone', label: $t('link_settings'), description: $t('desc_settings') },
  { to: '/about', icon: 'i-ph-info-duotone', label: $t('link_about'), description: $t('desc_about') },
])

const today = new Date()
const dayName = today.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' })
const dayGreetings: Record<string, string> = {
  Monday: $t('greeting_monday') as string,
  Tuesday: $t('greeting_tuesday') as string,
  Wednesday: $t('greeting_wednesday') as string,
  Thursday: $t('greeting_thursday') as string,
  Friday: $t('greeting_friday') as string,
  Saturday: $t('greeting_saturday') as string,
  Sunday: $t('greeting_sunday') as string,
}
const dayGreeting = dayGreetings[dayName] || $t('greeting_fallback') as string

const formattedDate = today.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

interface UserStats {
  approved: number; pending: number; draft: number; collections: number;
  likes: number; likes_given: number; views: number; submitted: number;
}

const userStats = ref<UserStats>({
  approved: 0,
  pending: 0,
  draft: 0,
  collections: 0,
  likes: 0,
  likes_given: 0,
  views: 0,
  submitted: 0,
})

const totalQuotes = computed(() => userStats.value.approved + userStats.value.pending + userStats.value.draft)
const statsLoading = ref(true)

interface DiaryQuote {
  id: number
  name: string
  status: string
  createdAt: string
  author: { name: string; is_fictional: boolean } | null
  reference: { name: string; primary_type: string } | null
}

const recentQuote = ref<DiaryQuote | null>(null)
const recentQuoteLoading = ref(true)

const fetchRecentQuote = async () => {
  if (!user.value) return
  recentQuoteLoading.value = true
  try {
    const response = await $fetch<ApiResponse<DiaryQuote[]>>('/api/dashboard/submissions?limit=1&status=approved')
    if (response?.data && response.data.length > 0) {
      recentQuote.value = response.data[0] ?? null
    }
  } catch (error) {
    console.error('Failed to load recent quote:', error)
  } finally {
    recentQuoteLoading.value = false
  }
}

const loadUserStats = async () => {
  if (!user.value) return

  statsLoading.value = true
  try {
    const response = await $fetch<ApiResponse<UserStats>>('/api/dashboard/stats')
    if (response?.data) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to load user stats:', error)
  } finally {
    statsLoading.value = false
  }
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
  loadUserStats()
  fetchRecentQuote()
}

onMounted(() => {
  loadUserStats()
  fetchRecentQuote()
})

</script>

<style scoped>
.mobile-diary-page {
  min-height: calc(100vh - 80px);
  padding-bottom: 2rem;
}

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
