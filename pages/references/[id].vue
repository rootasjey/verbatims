<template>
  <div class="min-h-screen">
    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || pending" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !hydrated ? 'Loading...' : (!isLanguageReady ? 'Initializing...' : 'Loading reference...') }}
        </span>
      </div>
    </div>

    <div v-else-if="reference">
      <ClientOnly>
        <ReferenceTopHeader
          :header-title="headerTitle"
          :reference="{
            ...reference,
            urls: reference.urls ? JSON.stringify(reference.urls) : '',
          }"
          :share-pending="sharePending"
          :like-pending="likePending"
          :is-liked="isLiked"
          :has-user="!!user"
          :copy-state="copyState"
          :header-menu-items="headerMenuItems"
          :format-number="formatNumber"
          :format-type="formatReferenceType"
          :format-release-date="formatReleaseDate"
          @share="shareReference"
          @toggle-like="toggleLike"
          @copy-link="copyLink"
          @scroll-top="scrollToTop"
          @navigate-back="navigateToReferencesList"
        />
      </ClientOnly>
      
      <header class="mt-12 p-8">
        <!-- Reserve vertical space to avoid layout shift when the badge fades in -->
        <div class="flex items-center justify-center gap-4 min-h-8">
          <Transition name="fade-up" appear>
            <NBadge
              v-if="showTypeBadge"
              :badge="`outline-${getTypeColor(reference.primary_type)}`"
              :style="{ 'border-width': '0.2px' }"
              size="sm"
            >
              {{ formatReferenceType(reference.primary_type) }}
            </NBadge>
          </Transition>
        </div>

        <div class="text-center mb-6">
          <h1
            class="font-title text-size-18 sm:text-size-24 md:text-size-42 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(0)"
          >
            {{ reference.name }}
          </h1>

          <span v-if="reference.release_date" 
            class="font-serif text-gray-600 dark:text-gray-400 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ formatReleaseDate(reference.release_date) }}
          </span>

          <p
            v-if="reference.secondary_type"
            class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ reference.secondary_type }}
          </p>

          <p v-if="reference.description"
            class="font-body text-size-4 md:text-size-5 font-200 text-gray-600
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            {{ reference.description }}
          </p>

          <div v-if="reference.original_language && reference.original_language !== 'en'" class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <NIcon name="i-ph-globe" class="w-4 h-4" />
            <span>Original Language: {{ formatLanguage(reference.original_language as langCode) }}</span>
          </div>
        </div>
      </header>

      <div v-if="reference?.urls" class="px-8 mb-16">
        <ExternalLinksBadges :links="reference.urls" />
      </div>
      
      <!-- Quotes Section -->
      <div class="px-8 pb-16">
        <!-- Sort / Filters -->
        <div class="font-body mb-8">
          <!-- Desktop controls -->
          <div class="hidden md:flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ referenceQuotes.length }} quotes</p>
            <span>•</span>
            <span class="whitespace-nowrap font-600 text-gray-600 dark:text-gray-500">
              sorted by
            </span>
            <NSelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              item-key="label"
              value-key="label"
              @change="loadQuotes"
            />
            <LanguageSelector class="hidden md:block" @language-changed="onLanguageChange" />
          </div>

          <!-- Mobile controls: filter button opens drawer -->
          <div class="md:hidden flex items-center justify-between max-w-xl mx-auto">
            <p class="font-600 text-gray-600 dark:text-gray-300">{{ referenceQuotes.length }} quotes</p>
            <NButton size="sm" btn="outline-gray" class="rounded-full" @click="mobileFiltersOpen = true">
              <NIcon name="i-ph-faders" class="w-4 h-4 mr-1" />
              Filters
            </NButton>
          </div>
        </div>

        <div v-if="quotesLoading" class="mb-12">
          <MasonryGrid>
            <div v-for="i in 12" :key="i" class="quote-skeleton animate-pulse">
              <div class="border-b border-dashed border-gray-200 dark:border-gray-400 pb-2 mb-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          </MasonryGrid>
        </div>

        <!-- Quotes Display -->
        <div v-else-if="referenceQuotes.length > 0" class="mb-12">
          <!-- Desktop: Masonry Grid -->
          <div class="hidden md:block">
            <MasonryGrid>
              <QuoteMasonryItem
                v-for="(quote, index) in referenceQuotes"
                :key="quote.id"
                :quote="quote"
                :index="index"
                class="fade-in"
              />
            </MasonryGrid>
          </div>

          <!-- Mobile: List -->
          <div class="md:hidden space-y-4">
            <QuoteListItem
              v-for="quote in referenceQuotes"
              :key="quote.id"
              :quote="{
                  ...quote,
                  tags: [],
                  result_type: 'quote',
                }"
              class="border rounded-1 border-gray-100 dark:border-dark-400"
            />
          </div>
        </div>

        <div v-else class="text-center py-16">
          <NIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote from {{ reference.name }}!
          </p>
        </div>

        <div v-if="hasMoreQuotes && !quotesLoading" class="text-center">
          <NButton
            @click="loadMoreQuotes"
            :loading="loadingMoreQuotes"
            :disabled="loadingMoreQuotes"
            size="sm"
            btn="solid-black"
            class="px-8 py-6 w-full rounded-3 hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
          >
            {{ loadingMoreQuotes ? 'Loading...' : 'Load More Quotes' }}
          </NButton>
        </div>
      </div>
    </div>

    <div v-else class="p-8">
      <div class="text-center py-16">
        <NIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Reference Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The reference you're looking for doesn't exist or has been removed.
        </p>
        <NButton to="/references" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse References
        </NButton>
      </div>
    </div>

    <ClientOnly>
      <AddReferenceDialog
        v-if="isEditDialogOpen && reference"
        v-model="isEditDialogOpen"
        :edit-reference="{
          ...reference,
          urls: reference.urls ? JSON.stringify(reference.urls) : '',
        }"
        @reference-updated="onReferenceUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <DeleteReferenceDialog
        v-if="isDeleteDialogOpen && reference"
        v-model="isDeleteDialogOpen"
        :reference="{
          ...reference,
        }"
        @reference-deleted="onReferenceDeleted"
      />
    </ClientOnly>

    <ClientOnly>
      <ReportDialog
        v-if="reference"
        v-model="showReportDialog"
        targetType="reference"
        :targetId="reference.id"
      />
    </ClientOnly>
  </div>

  <ClientOnly>
    <MobileAuthorFiltersDrawer
      v-if="isMobile"
      v-model:open="mobileFiltersOpen"
      v-model:sortBy="sortBy"
      :sortOptions="sortOptions"
      @language-changed="onLanguageChange"
    />
  </ClientOnly>
</template>

<script lang="ts" setup>
// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

import type { Quote, QuoteReferenceWithMetadata } from '~/types'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const route = useRoute()
const { user } = useUserSession()
const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()
type langCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh'

const id = String(route.params.id || '')
const { data: referenceData, pending } = await useLazyFetch(`/api/references/${id}`)
const reference = computed<QuoteReferenceWithMetadata | undefined>(() => {
  const val = referenceData.value
  if (!val || !('data' in val)) {
    return undefined
  }

  // If data is an array, return the first item, else return as is
  return Array.isArray(val.data) ? val.data[0] : val.data
})

useHead(() => ({
  title: reference.value ? `${reference.value.name} - References - Verbatims` : 'Reference - Verbatims',
  meta: [
    {
      name: 'description',
      content: reference.value
        ? `Discover quotes from ${reference.value.name}. ${reference.value.description || ''}`
        : 'View reference details and quotes on Verbatims'
    }
  ]
}))

const referenceQuotes = ref<Quote[]>([])
const quotesLoading = ref<boolean>(false)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(true)
const currentQuotePage = ref<number>(1)
const sortBy = ref<{ label: string; value: string }>({ label: 'Most Recent', value: 'created_at' })
const mobileFiltersOpen = ref<boolean>(false)

const sortOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Popular', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' }
]

const isLiked = ref<boolean>(false)
const likePending = ref<boolean>(false)
const sharePending = ref<boolean>(false)
const copyState = ref<'idle' | 'copied'>('idle')
const headerIn = ref<boolean>(false)
const showTypeBadge = ref<boolean>(false)

// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = reference.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

const headerMenuItems = computed(() => {
  const items: Array<{ label: string; leading: string; onclick: () => void }> = []

  if (canEditReference.value) {
    items.push({
      label: 'Edit',
      leading: 'i-ph-pencil-simple-line',
      onclick: () => openEditReference()
    })
    items.push({
      label: 'Delete',
      leading: 'i-ph-trash',
      onclick: () => openDeleteReference()
    })
  }

  items.push(
    {
      label: 'Copy link',
      leading: 'i-ph-link',
      onclick: () => copyLink()
    },
    {
      label: 'Share',
      leading: 'i-ph-share-network',
      onclick: () => shareReference()
    },
    {
      label: 'Report',
      leading: 'i-ph-flag',
      onclick: () => reportReference()
    }
  )

  return items
})

const canEditReference = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'moderator'
})

const isEditDialogOpen = ref(false)
const openEditReference = () => {
  if (!reference.value) return
  isEditDialogOpen.value = true
}

const isDeleteDialogOpen = ref(false)
const openDeleteReference = () => {
  if (!reference.value) return
  isDeleteDialogOpen.value = true
}

const onReferenceDeleted = async () => {
  await navigateTo('/references')
}

const onReferenceUpdated = async () => {
  try {
    const refreshed = await $fetch(`/api/references/${route.params.id}`)
    referenceData.value = refreshed
  } catch (error) {
    console.error('Failed to refresh reference after update:', error)
  }
}

const totalQuoteLikes = computed(() => {
  return referenceQuotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

const loadQuotes = async (reset = true) => {
  if (!reference.value) return
  await waitForLanguageStore()

  if (reset) {
    quotesLoading.value = true
    currentQuotePage.value = 1
    referenceQuotes.value = []
  } else {
    loadingMoreQuotes.value = true
  }

  try {
    const query = {
      reference_id: reference.value.id,
      page: currentQuotePage.value,
      limit: 12,
      sort_by: sortBy.value?.value,
      sort_order: 'DESC',
      ...languageStore.getLanguageQuery()
    }

    const response = await $fetch('/api/quotes', { query })

    if (reset) {
      referenceQuotes.value = response.data || []
    } else {
      referenceQuotes.value.push(...(response.data || []))
    }

    hasMoreQuotes.value = Boolean(response.pagination?.hasMore)
  } catch (error) {
    console.error('Failed to load quotes:', error)
    if (reset) {
      referenceQuotes.value = []
    }
    hasMoreQuotes.value = false
  } finally {
    quotesLoading.value = false
    loadingMoreQuotes.value = false
  }
}

const loadMoreQuotes = async () => {
  if (loadingMoreQuotes.value || !hasMoreQuotes.value) return

  currentQuotePage.value++
  await loadQuotes(false)
}

const onLanguageChange = async () => {
  currentQuotePage.value = 1
  hasMoreQuotes.value = true

  await loadQuotes(true)
}

const checkLikeStatus = async () => {
  if (!user.value || !reference.value) return

  try {
    const { data } = await $fetch(`/api/references/${reference.value.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !reference.value || likePending.value) return

  likePending.value = true
  try {
    const { data } = await $fetch(`/api/references/${reference.value.id}/like`, {
      method: 'POST'
    })
    isLiked.value = data.isLiked
    reference.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

const shareReference = async () => {
  if (!reference.value || sharePending.value) return

  sharePending.value = true
  const { toast } = useToast()

  try {
    const shareData = {
      title: `${reference.value.name} on Verbatims`,
      text: reference.value.description || reference.value.secondary_type || reference.value.name,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Reference shared successfully!' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: 'Reference link copied to clipboard!' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    reference.value.shares_count = (reference.value.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share reference:', error)
    toast({ title: 'Failed to share', description: 'Please try again.' })
  } finally {
    sharePending.value = false
  }
}

const copyLink = async () => {
  const { toast } = useToast()
  try {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) throw new Error('no-url')
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('clipboard-unavailable')
    }
    await navigator.clipboard.writeText(url)

    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Could not copy the link.' })
  }
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const navigateToReferencesList = async () => {
  await navigateTo('/references')
}

const showReportDialog = ref(false)
const reportReference = () => { showReportDialog.value = true }

// Global keyboard shortcut: Ctrl/Cmd + E to open edit dialog (admin/mod only)
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!(e && (e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E'))) return

  // Skip when typing in inputs/contenteditable elements
  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase?.() as string | undefined
  const isEditable = (target as any)?.isContentEditable || ['input', 'textarea', 'select'].includes(tag || '')
  if (isEditable) return

  if (reference.value && canEditReference.value) {
    e.preventDefault()
    isEditDialogOpen.value = true
  }
}

const formatReleaseDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

const formatLanguage = (langCode: langCode) => {
  const languages = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese'
  }
  return languages[langCode] || langCode.toUpperCase()
}

const formatNumber = (num: number | null | undefined) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'film': 'red',
    'book': 'blue',
    'tv_series': 'purple',
    'music': 'green',
    'speech': 'orange',
    'podcast': 'pink',
    'interview': 'yellow',
    'documentary': 'indigo',
    'media_stream': 'cyan',
    'writings': 'gray',
    'video_game': 'lime',
    'other': 'slate'
  }
  return colors[type] || 'gray'
}

const hydrated = ref(false)

onMounted(async () => {
  // Attach global shortcut as soon as component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }

  await waitForLanguageStore()
  if (!reference.value) return
  
  try { // Track view (dedup handled server-side)
    const res = await $fetch(`/api/references/${route.params.id}/view`, { method: 'POST' })
    if (res?.recorded) {
      reference.value.views_count = (reference.value.views_count || 0) + 1
    }
  } catch (error) { console.error('Failed to track reference view:', error) }

  loadQuotes()
  if (user.value) checkLikeStatus()

  // Trigger enter animation and delayed type badge
  await triggerHeaderEnter()
})

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})

watch(reference, (newReference) => {
  if (!newReference) return
  
  loadQuotes()
  if (user.value) checkLikeStatus()

  // retrigger header animation on reference change
  triggerHeaderEnter()
})

watch(user, (newUser) => {
  if (newUser && reference.value) {
    checkLikeStatus()
    return
  }

  isLiked.value = false
})

watch(sortBy, () => {
  loadQuotes()
})

// Small helper to stagger items
const enterAnim = (i: number): Record<string, string> => ({ transitionDelay: `${i * 80}ms` })

// Ensure animations run after initial render and when data finishes loading
const triggerHeaderEnter = async () => {
  headerIn.value = false
  showTypeBadge.value = false
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      headerIn.value = true
      setTimeout(() => { showTypeBadge.value = true }, 450)
    })
  })
}

// Re-run animations after client-side navigation when pending flips
watch(pending, (now, prev) => {
  if (prev && !now && reference.value) {
    triggerHeaderEnter()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})
</script>

<style scoped>
.fade-up-enter-from,
.fade-up-appear-from {
  opacity: 0;
  transform: translateY(6px);
  filter: blur(2px);
}
.fade-up-enter-active,
.fade-up-appear-active {
  transition: all 420ms cubic-bezier(.22,.61,.36,1);
}
.fade-up-enter-to,
.fade-up-appear-to {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
</style>
