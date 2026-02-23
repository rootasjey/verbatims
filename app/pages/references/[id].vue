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
          ref="posterRef"
          :header-title="headerTitle"
          :reference="{
            ...reference,
            urls: reference.urls ? JSON.stringify(reference.urls) : '',
          }"
          :poster-url="reference.imageUrl"
          :poster-alt="reference.name"
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
          @open-poster="openPosterPreview"
        />
      </ClientOnly>
      
      <header class="mt-12 p-8">
    
        <!-- Reference Type Badge -->
        <div class="flex items-center justify-center gap-4 min-h-8">
          <Transition name="fade-up" appear>
            <NBadge
              v-if="showTypeBadge && reference.primaryType"
              :color="getTypeColor(reference.primaryType)"
              badge="outline"
              :style="{ 'border-width': '0.2px' }"
              size="sm"
              class="font-medium"
            >
              {{ formatReferenceType(reference.primaryType) }}
            </NBadge>
          </Transition>
        </div>

        <div class="text-center w-full">
          <h1
            class="font-title text-size-18 sm:text-size-24 md:text-size-42 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(0)"
          >
            {{ reference.name }}
          </h1>

          <span v-if="reference.release_date" 
            class="block font-serif text-lg font-500 text-gray-500 dark:text-gray-400 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ formatReleaseDate(reference.release_date) }}
          </span>

          <p
            v-if="reference.secondary_type"
            class="font-subtitle italic text-xl font-500 text-gray-600 dark:text-gray-400 mb-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ reference.secondary_type }}
          </p>

          <div v-if="reference.description"
            class="mt-28 max-w-4xl w-full mx-auto mb-6 border-t border-b border-dashed border-gray-300 dark:border-gray-600 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            <div class="p-6">
              <div
                ref="descriptionEl"
                class="description-clip overflow-hidden"
                :class="[descriptionExpanded ? 'expanded' : 'collapsed', (!descriptionExpanded && (isDescriptionOverflowing || isDescriptionLong(reference.description))) ? 'has-ellipsis' : '']"
              >
                <p class="text-justify font-serif text-base md:text-size-8 font-400 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {{ reference.description }}
                </p>
              </div>

              <NButton
                v-if="isDescriptionOverflowing || isDescriptionLong(reference.description)"
                btn="ghost-gray"
                size="sm"
                class="mt-3 text-xs font-medium"
                @click="descriptionExpanded = !descriptionExpanded"
              >
                <NIcon name="i-ph-caret-down" class="mr-1 icon-rotate" :class="{ rotated: descriptionExpanded }" />
                {{ descriptionExpanded ? 'Show Less' : 'Read More' }}
              </NButton>
            </div>
          </div>

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

        <div v-if="hasMoreQuotes && !quotesLoading" class="flex justify-center">
          <LoadMoreButton
            class="mb-4"
            idleText="Load More Quotes"
            loadingText="Loading Quotes..."
            :isLoading="loadingMoreQuotes"
            @load="loadMoreQuotes"
          />
        </div>
      </div>

      <!-- Similar References Section -->
      <div v-if="similarReferences.length > 0" class="px-8 pb-16">
        <h2 class="font-title text-2xl md:text-3xl font-600 text-center mb-8">
          Similar References
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          <div
            v-for="(similarRef, index) in similarReferences"
            :key="similarRef.id"
            class="group cursor-pointer similar-item"
            :class="{ 'in': similarReferences.length > 0 }"
            :style="{ transitionDelay: `${index * 60}ms` }"
            @click="navigateTo(`/references/${similarRef.id}`)"
          >
            <div class="flex flex-col items-center text-center space-y-2 p-2 rounded-lg">
              <div v-if="similarRef.image_url" class="w-full h-54 mb-2">
                <img
                  :src="similarRef.image_url"
                  :alt="similarRef.name"
                  class="w-full h-full object-cover rounded group-hover:scale-105 group-hover:shadow-xl group-active:shadow-none group-active:scale-99 transition-all duration-300"
                />
              </div>
              <div class="flex-1">
                <p class="font-medium text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ similarRef.name }}
                </p>
                <p v-if="similarRef.primary_type" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                  {{ formatReferenceType(similarRef.primary_type) }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ formatNumber(similarRef.quotes_count) }} quotes
                </p>
              </div>
            </div>
          </div>
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
      <ImagePreview
        v-model="posterPreviewOpen"
        :src="reference?.imageUrl || ''"
        :alt="reference?.name || ''"
        :closeOnScroll="true"
        :mask-closable="true"
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
import { ofetch } from 'ofetch'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const route = useRoute()
const { user } = useUserSession()
const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()
type langCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh'

const id = String(route.params.id || '')
type ReferenceApiResponse = { success: boolean; data: QuoteReferenceWithMetadata | QuoteReferenceWithMetadata[] }
const { data: referenceData, pending } = await useLazyFetch<ReferenceApiResponse>(`/api/references/${id}`)
const reference = computed<QuoteReferenceWithMetadata | undefined>(() => {
  const val = referenceData.value
  if (!val) {
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
const descriptionExpanded = ref(false)
const descriptionEl = ref<HTMLElement | null>(null)
const isDescriptionOverflowing = ref(false)
let descriptionResizeObserver: ResizeObserver | null = null
const similarReferences = ref<any[]>([])

const checkDescriptionOverflow = () => {
  const el = descriptionEl.value
  if (!el) {
    isDescriptionOverflowing.value = false
    return
  }
  // Use the collapsed max-height (6.5rem) as a stable threshold so
  // CSS transitions and intermediate clientHeight values don't
  // cause temporary false negatives.
  const rootFontSize = typeof window !== 'undefined'
    ? parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
    : 16
  const collapsedHeightPx = 6.5 * rootFontSize
  isDescriptionOverflowing.value = el.scrollHeight > collapsedHeightPx
}

watch([() => reference.value?.description, () => descriptionExpanded.value], () => {
  nextTick(checkDescriptionOverflow)
})
// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = reference.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

// poster preview state and focus
const posterPreviewOpen = ref(false)
const posterRef = ref<any>(null)

const openPosterPreview = () => {
  if (!reference.value?.imageUrl) return
  posterPreviewOpen.value = true
}

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
    const refreshed = await ofetch<ReferenceApiResponse>(`/api/references/${route.params.id}`)
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

// copy reference name plus current page url
const copyTextAndLink = async () => {
  const current = reference.value
  if (!current) return
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('clipboard-unavailable')
    }
    const url = typeof window !== 'undefined' ? window.location.href : ''
    await navigator.clipboard.writeText(`${current.name}\n\n${url}`)

    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    useToast().toast({ title: 'Copy failed', description: 'Clipboard not available.' })
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

// Global keyboard shortcuts for reference page (single letters)
// Ignored when a modifier key is held so native browser shortcuts continue to work
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!e || !reference.value) return

  // ignore interactive elements (inputs, textareas, contenteditable, etc.)
  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = (target as any)?.isContentEditable || ['input', 'textarea', 'select'].includes(tag || '')
  if (isEditable) return

  // ignore if any modifier key is pressed; shortcuts are single-letter only
  if (e.metaKey || e.ctrlKey || e.altKey) return

  const role = user.value?.role
  const isAdminMod = role === 'admin' || role === 'moderator'
  const key = e.key.toLowerCase()

  switch (key) {
    case 'c':
      e.preventDefault()
      copyTextAndLink()
      break
    case 'd':
      if (isAdminMod) {
        e.preventDefault()
        openDeleteReference()
      }
      break
    case 'e':
      if (isAdminMod) {
        e.preventDefault()
        openEditReference()
      }
      break
    case 'l':
      if (user.value) {
        e.preventDefault()
        toggleLike()
      }
      break
    case 'r':
      e.preventDefault()
      reportReference()
      break
    case 's':
      e.preventDefault()
      shareReference()
      break
    default:
      break
  }
}

const formatReleaseDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

const formatReferenceType = (type: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    'film': 'Film',
    'book': 'Book',
    'tv_series': 'TV Series',
    'tv_show': 'TV Show',
    'music': 'Music',
    'speech': 'Speech',
    'podcast': 'Podcast',
    'interview': 'Interview',
    'documentary': 'Documentary',
    'media_stream': 'Media Stream',
    'writings': 'Writings',
    'video_game': 'Video Game',
    'other': 'Other'
  }
  return typeMap[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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

const isDescriptionLong = (description: string): boolean => {
  if (!description) return false
  // Check if description has more than 3 non-empty lines or is longer than 300 characters
  const lines = description.split('\n').filter(line => line.trim())
  return lines.length > 3 || description.length > 300
}

const loadSimilarReferences = async () => {
  if (!reference.value) return

  try {
    const response = await $fetch(`/api/references/${reference.value.id}/similar`, {
      query: { limit: 6 }
    })
    similarReferences.value = response.data || []
  } catch (error) {
    console.error('Failed to load similar references:', error)
    similarReferences.value = []
  }
}

const hydrated = ref(false)

onMounted(async () => {
  // Attach global shortcut as soon as component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
    nextTick(() => {
      checkDescriptionOverflow()
      if (typeof ResizeObserver !== 'undefined') {
        descriptionResizeObserver = new ResizeObserver(checkDescriptionOverflow)
        if (descriptionEl.value) descriptionResizeObserver.observe(descriptionEl.value)
      }
      window.addEventListener('resize', checkDescriptionOverflow)
    })
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
  loadSimilarReferences()
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
  loadSimilarReferences()
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
  if (descriptionResizeObserver) descriptionResizeObserver.disconnect()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkDescriptionOverflow)
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

/* Description expand/collapse animation */
.description-clip {
  position: relative;
  transition: max-height 420ms cubic-bezier(.22,.61,.36,1), opacity 320ms ease;
  max-height: 6.5rem; /* collapsed height (~3 lines) */
}
.description-clip p { position: relative; z-index: 0; }
.description-clip.collapsed { max-height: 6.5rem; }
.description-clip.expanded { max-height: 1200px; }

/* Fade overlay when clipped */
.description-clip.collapsed.has-ellipsis::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3.2rem; /* covers the bottom area */
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(180deg, rgba(255,255,255,0), #FAFAF9 85%);
}
/* Dark mode variants */
.dark .description-clip.collapsed.has-ellipsis::after {
  background: linear-gradient(180deg, rgba(12,10,9,0), #0C0A09 85%);
}

/* Icon rotate for Read More button */
.icon-rotate {
  display: inline-block;
  transition: transform 220ms cubic-bezier(.22,.61,.36,1);
  transform-origin: center;
}
.icon-rotate.rotated {
  transform: rotate(180deg);
}

/* Subtle staggered fade-up for similar references */
.similar-item {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 420ms cubic-bezier(.22,.61,.36,1), transform 420ms cubic-bezier(.22,.61,.36,1);
}
.similar-item.in {
  opacity: 1;
  transform: translateY(0);
}
</style>
