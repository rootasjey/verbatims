<template>
  <div class="min-h-screen">
    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || pending" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !hydrated ? $t('common.loading') : (!isLanguageReady ? $t('common.initializing') : $t('reference_detail_loading')) }}
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
          @navigate-back="navigateBack"
          @open-poster="openPosterPreview"
          @scroll-to-quotes="scrollToQuotes"
        />
      </ClientOnly>

      <!-- 3-column newspaper layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b b-dashed border-gray-300 dark:border-gray-700">
        <!-- Poster column -->
        <div class="lg:col-span-3 lg:border-r b-dashed border-gray-300 dark:border-gray-700">
          <div class="p-6 md:p-8">
            <div v-if="reference.imageUrl" class="group relative w-full shadow-xl overflow-hidden rounded-sm bg-gray-100 dark:bg-[#0C0A09] cursor-pointer" @click="openPosterPreview">
              <img
                :src="reference.imageUrl"
                :alt="reference.name"
                class="w-full object-cover hover:scale-102 transition-transform duration-300"
                style="aspect-ratio: 3/4;"
              />
              <button
                v-if="canEditReference"
                class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hidden lg:flex"
                @click.stop="openEditImageDialog"
                :title="$ts('reference_detail_edit_poster')"
              >
                <NIcon name="i-ph-pencil-simple-line" class="w-4 h-4" />
              </button>
            </div>
            <div v-else class="w-full aspect-[3/4] rounded-sm bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
          </div>
          <div class="hidden lg:block">
            <SimilarReferences :references="similarReferences" compact />
          </div>
        </div>

        <!-- Content column -->
        <div class="lg:col-span-6 lg:border-r b-dashed border-gray-300 dark:border-gray-700 p-6 md:p-8 md:pr-12 lg:pr-16">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getTypeDotColor(reference.primaryType) }" />
            <span class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-600">
              {{ reference.primaryType ? formatReferenceType(reference.primaryType) : $t('reference_detail_label') }}
            </span>
            <template v-if="reference.secondary_type || reference.release_date">
              <span class="text-gray-300 dark:text-gray-600">·</span>
              <span class="font-sans text-xs font-600 text-gray-400 dark:text-gray-400">
                <template v-if="reference.secondary_type">{{ reference.secondary_type }}</template>
                <template v-if="reference.secondary_type && reference.release_date"><span class="mx-2"> · </span></template>
                <template v-if="reference.release_date">{{ formatReleaseDate(reference.release_date) }}</template>
              </span>
            </template>
          </div>

          <h1
            class="font-title font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="[titleSizeClass, headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]']"
            :style="enterAnim(0)"
          >
            {{ reference.name }}
          </h1>

          <div v-if="reference.description"
            class="mb-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            <div class="relative">
              <p class="font-serif text-base md:text-lg font-400 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {{ reference.description }}
              </p>
            </div>
          </div>

          <div
            class="transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(3)"
          >
            <div v-if="reference.original_language && reference.original_language !== 'en'" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <NIcon name="i-ph-globe" class="w-4 h-4" />
              <span>{{ $t('reference_detail_original_language') }} {{ formatLanguage(reference.original_language as langCode) }}</span>
            </div>

            <ExternalLinksBadges :links="reference.urls" />
          </div>
        </div>

        <!-- Quotes sidebar -->
        <div id="quotes" class="lg:col-span-3 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div class="p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6">
              <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex-shrink-0 whitespace-nowrap">
                {{ $ts('reference_detail_quotes_heading') + ' ·' }} {{ referenceQuotes.length }}
              </p>
              <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div class="mb-6 space-y-3">
              <NSelect
                v-model="sortBy"
                :items="sortOptions"
                :placeholder="$ts('reference_detail_sort_placeholder')"
                item-key="label"
                value-key="label"
                size="sm"
              />
              <LanguageSelector @language-changed="onLanguageChange" />
            </div>

            <div v-if="quotesLoading" class="space-y-4">
              <div v-for="i in 4" :key="i" class="animate-pulse">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                <div class="h-px bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>

            <div v-else-if="referenceQuotes.length > 0" class="space-y-6">
              <div v-for="[authorName, quotes] in quotesByAuthor" :key="authorName">
                <p class="font-sans text-[10px] font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                  {{ authorName }}
                </p>
                <div class="space-y-4">
                  <div
                    v-for="quote in quotes"
                    :key="quote.id"
                    class="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <NLink
                      :to="`/quotes/${quote.id}`"
                      class="block group"
                    >
                      <blockquote
                        class="font-serif text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-3"
                        :class="{
                          'text-sm': (quote.name || '').length <= 100,
                          'text-xs': (quote.name || '').length > 100
                        }"
                      >
                        {{ quote.name }}
                      </blockquote>
                    </NLink>
                    <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                      <NuxtLink
                        v-if="quote.author"
                        :to="`/authors/${quote.author.id}`"
                        class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors truncate"
                      >
                        {{ quote.author.name }}
                      </NuxtLink>
                      <span class="flex items-center gap-1.5 ml-auto shrink-0">
                        <span class="flex items-center gap-0.5">
                          <NIcon name="i-ph-hand-heart" class="w-3 h-3" />
                          {{ formatNumber(quote.likes_count) }}
                        </span>
                        <span class="flex items-center gap-0.5">
                          <NIcon name="i-ph-eye" class="w-3 h-3" />
                          {{ formatNumber(quote.views_count) }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <p class="font-serif text-sm text-gray-400 dark:text-gray-500">{{ $ts('reference_detail_empty') }}</p>
            </div>

            <div v-if="hasMoreQuotes && !quotesLoading" class="mt-6 flex justify-center">
              <LoadMoreButton
                :idleText="$ts('reference_detail_load_more')"
                :loadingText="$ts('reference_detail_loading_more')"
                :isLoading="loadingMoreQuotes"
                @load="loadMoreQuotes"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="lg:hidden">
        <SimilarReferences :references="similarReferences" />
      </div>
    </div>

    <div v-else class="p-8">
      <div class="text-center py-16">
        <NIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ $ts('reference_detail_not_found_title') }}</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          {{ $ts('reference_detail_not_found_desc') }}
        </p>
        <NButton to="/references" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          {{ $ts('reference_detail_browse') }}
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
      >
        <template #actions>
          <NButton
            v-if="canEditReference"
            btn="ghost-gray"
            icon
            size="xs"
            label="i-ph-pencil-simple-line"
            square="2em"
            @click.stop="openEditImageDialog"
          />
        </template>
      </ImagePreview>
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
      <EditImageDialog
        v-if="reference"
        v-model="isEditImageDialogOpen"
        :reference-id="reference.id"
        :current-image-url="reference.imageUrl || null"
        @image-updated="onImageUpdated"
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

<script lang="ts" setup>import { useJsonLd } from '../../composables/useSeo'
import { useReferencesListStore } from '~/stores/references'
// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

import type { Quote, QuoteReferenceWithMetadata } from '~/types'
import { ofetch } from 'ofetch'

const { isMobile } = useMobileDetection()
const route = useRoute()
const { user } = useUserSession()
const router = useRouter()
const { $t, $ts } = useI18n()
const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()
const referencesListStore = useReferencesListStore()
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

useVerbatimsSeo(() => {
  const currentReference = reference.value

  if (!currentReference) {
    return {
      title: $ts('reference_detail_meta_title_fallback'),
      description: 'Discover reference pages and related quotes on Verbatims.',
      type: 'article'
    }
  }

  const trimmedName = currentReference.name.length > 90
    ? `${currentReference.name.slice(0, 87)}…`
    : currentReference.name

  const fallbackDescription = `Discover quotes from ${currentReference.name} on Verbatims.`
  const rawDescription = currentReference.description?.trim() || fallbackDescription
  const trimmedDescription = rawDescription.length > 180
    ? `${rawDescription.slice(0, 177)}…`
    : rawDescription

  return {
    title: `${trimmedName} • Verbatims`,
    description: trimmedDescription,
    imagePath: `/api/og/references/${currentReference.id}.png`,
    imageAlt: `Reference page for ${currentReference.name} on Verbatims`,
    type: 'article'
  }
})

watchEffect(() => {
  const refData = reference.value
  if (!refData) return
  const { protocol, host } = useRequestURL()
  const site = `${protocol}//${host}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: refData.name,
    description: refData.description || `Discover quotes from ${refData.name} on Verbatims.`,
    image: `${site}/api/og/references/${refData.id}.png`,
    author: refData.author ? { '@type': 'Person', name: refData.author } : undefined,
    datePublished: refData.year ? `${refData.year}-01-01` : undefined,
    url: `${site}/references/${refData.id}`
  }
  // Remove undefined values
  Object.keys(jsonLd).forEach(k => jsonLd[k as keyof typeof jsonLd] === undefined && delete jsonLd[k as keyof typeof jsonLd])
  useJsonLd(jsonLd)
})
const referenceQuotes = ref<Quote[]>([])
const quotesLoading = ref<boolean>(false)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(true)
const currentQuotePage = ref<number>(1)

const quotesByAuthor = computed(() => {
  const groups = new Map<string, Quote[]>()
  for (const quote of referenceQuotes.value) {
    const authorName = quote.author?.name?.trim() || 'Other'
    if (!groups.has(authorName)) {
      groups.set(authorName, [])
    }
    groups.get(authorName)!.push(quote)
  }
  const entries = Array.from(groups.entries())
  return entries.sort((a, b) => {
    if (a[0] === 'Other') return 1
    if (b[0] === 'Other') return -1
    return b[1].length - a[1].length
  })
})

const sortBy = ref<{ label: string; value: string }>({ label: $ts('reference_detail_sort_most_recent'), value: 'created_at' })
const mobileFiltersOpen = ref<boolean>(false)

const sortOptions = [
  { label: $ts('reference_detail_sort_most_recent'), value: 'created_at' },
  { label: $ts('reference_detail_sort_most_popular'), value: 'likes_count' },
  { label: $ts('reference_detail_sort_most_viewed'), value: 'views_count' }
]

const isLiked = ref<boolean>(false)
const likePending = ref<boolean>(false)
const sharePending = ref<boolean>(false)
const copyState = ref<'idle' | 'copied'>('idle')
const headerIn = ref<boolean>(false)
const showTypeBadge = ref<boolean>(false)
const similarReferences = ref<any[]>([])
// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = reference.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

const titleSizeClass = computed(() => {
  const len = (reference.value?.name || '').length
  if (len <= 20) return 'text-size-12 sm:text-size-18 md:text-size-28 lg:text-size-32'
  if (len <= 40) return 'text-size-11 sm:text-size-16 md:text-size-24 lg:text-size-28'
  if (len <= 60) return 'text-size-10 sm:text-size-14 md:text-size-16 lg:text-size-20'
  return 'text-size-9 sm:text-size-12 md:text-size-18 lg:text-size-20'
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
      label: $ts('reference_detail_menu_edit'),
      leading: 'i-ph-pencil-simple-line',
      onclick: () => openEditReference()
    })
    items.push({
      label: $ts('reference_detail_menu_delete'),
      leading: 'i-ph-trash',
      onclick: () => openDeleteReference()
    })
  }

  items.push(
    {
      label: $ts('reference_detail_menu_copy_link'),
      leading: 'i-ph-link',
      onclick: () => copyLink()
    },
    {
      label: $ts('reference_detail_menu_share'),
      leading: 'i-ph-share-network',
      onclick: () => shareReference()
    },
    {
      label: $ts('reference_detail_menu_report'),
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
const isEditImageDialogOpen = ref(false)
const openEditImageDialog = () => {
  if (!reference.value) return
  isEditImageDialogOpen.value = true
}

const onImageUpdated = (imageUrl: string | null) => {
  if (reference.value) {
    reference.value.imageUrl = imageUrl
  }
}

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
  return referenceQuotes.value.reduce<number>((sum: number, quote: any) => sum + (quote.likes_count || 0), 0)
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

    const response = await $fetch<ApiResponse<QuoteWithMetadata[]> & { pagination?: { hasMore?: boolean } }>('/api/quotes', { query })

    if (reset) {
      referenceQuotes.value = response?.data || []
    } else {
      referenceQuotes.value.push(...(response?.data || []))
    }

    hasMoreQuotes.value = Boolean(response?.pagination?.hasMore)
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
    const likeStatusRes = await $fetch<ApiResponse<{ isLiked: boolean }>>(`/api/references/${reference.value.id}/like-status`)
    isLiked.value = likeStatusRes?.data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !reference.value || likePending.value) return

  likePending.value = true
  try {
    const likeRes = await $fetch<ApiResponse<{ isLiked: boolean; likesCount: number | null }>>(`/api/references/${reference.value.id}/like`, {
      method: 'POST'
    })
    isLiked.value = likeRes?.data?.isLiked ?? false
    reference.value.likes_count = likeRes?.data?.likesCount ?? reference.value.likes_count
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
  const { showErrorToast } = useErrorToast()

  try {
    const shareData = {
      title: `${reference.value.name} on Verbatims`,
      text: reference.value.description || reference.value.secondary_type || reference.value.name,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
      toast({ title: $ts('reference_detail_toast_shared'), toast: 'outline-success' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: $ts('reference_detail_toast_link_copied'), toast: 'outline-success' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    reference.value.shares_count = (reference.value.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share reference:', error)
    showErrorToast(error, $ts('reference_detail_toast_share_failed'))
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
    useErrorToast().showErrorToast(error, $ts('reference_detail_toast_copy_failed'))
  }
}

const copyLink = async () => {
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
    useErrorToast().showErrorToast(error, $ts('reference_detail_toast_copy_failed'))
  }
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const scrollToQuotes = () => {
  if (typeof window !== 'undefined') {
    const el = document.getElementById('quotes')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const navigateBack = async () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
    return
  }

  navigateToReferencesList()
}

const navigateToReferencesList = async () => {
  if (typeof window !== 'undefined' && referencesListStore.shouldRestore && window.history.length > 1) {
    router.back()
    return
  }

  await navigateTo('/references')
}

onBeforeRouteLeave((to) => {
  if (!to.path.startsWith('/references')) {
    referencesListStore.clearRestoreRequest()
  }
})

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
  return $ts(`reference_types.${type}`)
}

const formatLanguage = (langCode: langCode) => {
  const t = $ts(`languages.${langCode}`)
  return t || langCode.toUpperCase()
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

const getTypeDotColor = (type: string | null | undefined): string => {
  const colors: Record<string, string> = {
    'film': '#E50914',
    'book': '#3C82F6',
    'tv_series': '#7C3AED',
    'tv_show': '#7C3AED',
    'music': '#10B981',
    'speech': '#F59E0B',
    'podcast': '#EC4899',
    'interview': '#FBBF24',
    'documentary': '#6366F1',
    'media_stream': '#06B6D4',
    'writings': '#6B7280',
    'video_game': '#84CC16',
    'other': '#94A3B8'
  }
  return colors[type || ''] || '#94A3B8'
}

const loadSimilarReferences = async () => {
  if (!reference.value) return

  try {
    const similarRes = await $fetch<ApiResponse<QuoteReference[]>>(`/api/references/${reference.value.id}/similar`, {
      query: { limit: 6 }
    })
    similarReferences.value = similarRes?.data || []
  } catch (error) {
    console.error('Failed to load similar references:', error)
    similarReferences.value = []
  }
}

const hydrated = ref(false)

onNuxtReady(() => {
  hydrated.value = true
})

onMounted(async () => {
  // Attach global shortcut as soon as component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }

  await waitForLanguageStore()
  if (!reference.value) return

  try { // Track view (dedup handled server-side)
    const res = await $fetch(`/api/references/${route.params.id}/view`, { method: 'POST' })
    if (res?.data?.recorded) {
      reference.value.views_count = (reference.value.views_count || 0) + 1
    }
  } catch (error) { console.error('Failed to track reference view:', error) }

  loadQuotes()
  loadSimilarReferences()
  if (user.value) checkLikeStatus()

  // Trigger enter animation and delayed type badge
  await triggerHeaderEnter()
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
