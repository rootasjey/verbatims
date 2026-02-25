<template>
  <div class="min-h-screen">
    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || pending" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">
          {{ !hydrated ? 'Loading...' : (!isLanguageReady ? 'Initializing...' : 'Loading author...') }}
        </span>
      </div>
    </div>

    <div v-else-if="author">
      <ClientOnly>
      <AuthorTopHeader
        :author="author"
        :header-title="headerTitle"
        :header-menu-items="headerMenuItems"
        :share-pending="sharePending"
        :like-pending="likePending"
        :is-liked="isLiked"
        :user="headerUser"
        :copy-state="copyState"
        :format-life-dates="formatLifeDates"
        :format-number="formatNumber"
        @scroll-to-top="scrollToTop"
        @share-author="shareAuthor"
        @toggle-like="toggleLike"
        @copy-link="copyLink"
        @navigate-back="navigateToAuthorsList"
      />
      </ClientOnly>

      <header class="mt-12 p-8">
        <!-- Avatar centered above badge (reserve space to prevent layout jump) -->
        <div class="flex items-center justify-center mb-4 min-h-[56px]">
          <Transition name="fade-up" appear>
            <NAvatar
              v-if="showTypeBadge"
              ref="avatarRef"
              role="button"
              tabindex="0"
              :aria-label="`Open ${author.name} image preview`"
              @click="openAvatarPreview"
              @keyup.enter.prevent="openAvatarPreview"
              @keyup.space.prevent="openAvatarPreview"
              :src="author.image_url || undefined"
              :alt="author.name"
              size="lg"
              :fallback="getAuthorInitials(author.name)"
              class="shadow-lg avatar-entrance cursor-pointer"
              :class="headerIn ? 'scale-in' : 'scale-out'"
            />
          </Transition>
        </div>

        <!-- Author Type (appears after header content animates) -->
        <div class="flex items-center justify-center gap-4 min-h-8">
          <Transition name="fade-up" appear>
            <NBadge
              v-if="showTypeBadge"
              :color="author.is_fictional ? 'purple' : 'blue'"
              size="sm"
              class="font-600"
            >
              {{ author.is_fictional ? 'Fictional Character' : 'Real Person' }}
            </NBadge>
          </Transition>
        </div>

        <div class="text-center w-full">
          <h1
            class="font-title text-size-24 md:text-size-42 md:text-size-54 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(0)"
          >
            {{ author.name }}
          </h1>

          <p
            v-if="author.job"
            class="font-subtitle italic text-xl font-500 text-gray-600 dark:text-gray-400 mb-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            {{ author.job }}
          </p>

          <span
            v-if="!author.is_fictional && (author.birth_date || author.death_date)"
            class="block font-subtitle text-size-8 font-600 text-gray-700 dark:text-gray-400 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ formatLifeDates(author.birth_date, author.death_date) }}
          </span>

          <div v-if="author.description"
            class="mt-28 max-w-4xl w-full mx-auto mb-6 border-t border-b border-dashed border-gray-300 dark:border-gray-600 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(3)"
          >
            <div class="p-6">
              <div
                ref="descriptionEl"
                class="description-clip overflow-hidden"
                :class="[descriptionExpanded ? 'expanded' : 'collapsed', (!descriptionExpanded && (isDescriptionOverflowing || isDescriptionLong(author.description))) ? 'has-ellipsis' : '']"
              >
                <p class="text-justify font-serif text-base md:text-size-8 font-400 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {{ author.description }}
                </p>
              </div>

              <NButton
                v-if="isDescriptionOverflowing || isDescriptionLong(author.description)"
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

          <div v-if="author.birth_location || author.death_location" class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div v-if="author.birth_location" class="flex items-center space-x-1">
              <NIcon name="i-ph-map-pin" class="w-4 h-4" />
              <span>Born in {{ author.birth_location }}</span>
            </div>
            <div v-if="author.death_location && author.death_location !== author.birth_location" class="flex items-center space-x-1">
              <NIcon name="i-ph-map-pin" class="w-4 h-4" />
              <span>Died in {{ author.death_location }}</span>
            </div>
          </div>
        </div>
      </header>

      <div v-if="author.socials && author.socials.length > 0" class="px-8 mb-8">
        <ExternalLinksBadges :links="author.socials" />
      </div>

      <!-- Quotes Section -->
      <div class="px-8 pb-16">
        <!-- Sort / Filters -->
        <div class="font-body mb-8">
          <!-- Desktop controls -->
          <div class="hidden md:flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ authorQuotes.length }} quotes</p>
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
            <p class="font-600 text-gray-600 dark:text-gray-300">{{ authorQuotes.length }} quotes</p>
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
        <div v-else-if="authorQuotes.length > 0" class="mb-12">
          <!-- Desktop: Masonry Grid -->
          <div class="hidden md:block">
            <MasonryGrid>
              <QuoteMasonryItem
                v-for="(quote, index) in authorQuotes"
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
              v-for="quote in authorQuotes"
              :key="quote.id"
              :quote="{
                ...quote,
                tags: [],
                result_type: 'quote',
                author: {
                  id: quote.author?.id ?? 0,
                  name: quote.author?.name ?? '',
                  image_url: quote.author?.image_url ?? '',
                  is_fictional: quote.author?.is_fictional ?? false
                },
                reference: {
                  id: quote.reference?.id ?? 0,
                  name: quote.reference?.name ?? '',
                  type: quote.reference?.primary_type ?? '',
                }
              }"
              class="border rounded-1 border-gray-100 dark:border-dark-400"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <NIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote by {{ author.name }}!
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

      <!-- Similar Authors Section -->
      <div v-if="similarAuthors.length > 0" class="px-8 pb-16">
        <h2 class="font-title text-2xl md:text-3xl font-600 text-center mb-8">
          Similar Authors
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          <div
            v-for="(similarAuthor, index) in similarAuthors"
            :key="similarAuthor.id"
            class="group cursor-pointer similar-item"
            :class="{ 'in': similarAuthors.length > 0 }"
            :style="{ transitionDelay: `${index * 60}ms` }"
            @click="navigateTo(`/authors/${similarAuthor.id}`)"
          >
            <div class="flex flex-col items-center text-center space-y-2 p-4 rounded-lg 
              border border-dashed border-gray-200 dark:border-gray-700 
              hover:b-solid hover:border-primary-500 dark:hover:border-primary-400 
              active:scale-99
              transition-all duration-300 hover:shadow-md">
              <NAvatar
                :src="similarAuthor.image_url || undefined"
                :alt="similarAuthor.name"
                size="md"
                :fallback="getAuthorInitials(similarAuthor.name)"
                class="group-hover:scale-110 transition-transform duration-300"
              />
              <div class="flex-1">
                <p class="font-medium text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ similarAuthor.name }}
                </p>
                <p v-if="similarAuthor.job" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                  {{ similarAuthor.job }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ formatNumber(similarAuthor.quotes_count) }} quotes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>

    <!-- Error State -->
    <div v-else class="p-8">
      <div class="text-center py-16">
        <NIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The author you're looking for doesn't exist or has been removed.
        </p>
        <NButton to="/authors" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse Authors
        </NButton>
      </div>
    </div>
    
    <ClientOnly>
      <AddAuthorDialog
        v-model="showEditAuthorDialog"
        :editAuthor="authorAsEditAuthor"
        @author-updated="onAuthorUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <DeleteAuthorDialog
        v-if="author"
        v-model="showDeleteAuthorDialog"
        :author="authorAsEditAuthor"
        @author-deleted="onAuthorDeleted"
      />
    </ClientOnly>

    <ClientOnly>
      <ReportDialog
        v-if="author"
        v-model="showReportDialog"
        targetType="author"
        :targetId="author.id"
      />
    </ClientOnly>

    <ClientOnly>
      <ImagePreview
        v-model="avatarPreviewOpen"
        :src="author?.image_url || ''"
        :alt="author?.name || ''"
        :closeOnScroll="true"
        :mask-closable="true"
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
import type { ComputedRef, Ref } from 'vue'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const route = useRoute()
const { user } = useUserSession()

interface SortOption {
  label: string
  value: string
}

interface HeaderMenuItem {
  label: string
  leading: string
  onclick: () => void
}

interface HeaderUser {
  id: number
  name: string
  role: 'admin' | 'moderator' | 'user'
}

const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()

// Lazy fetch author data; typed as any response shape from API
const { data: authorData, pending } = await useLazyFetch<ApiResponse<AuthorWithSocials>>(`/api/authors/${route.params.id}`)
const author: ComputedRef<AuthorWithSocials | null> = computed(() => {
  return authorData.value?.data ?? null
})

const headerUser = computed<HeaderUser | null>(() => {
  if (!user.value) return null

  const role = user.value.role === 'admin' || user.value.role === 'moderator' ? user.value.role : 'user'

  return {
    id: user.value.id,
    name: user.value.name,
    role
  }
})

useVerbatimsSeo(() => {
  const currentAuthor = author.value

  if (!currentAuthor) {
    return {
      title: 'Author - Verbatims',
      description: 'Discover author profiles and quotes on Verbatims.',
      type: 'profile'
    }
  }

  const trimmedName = currentAuthor.name.length > 80
    ? `${currentAuthor.name.slice(0, 77)}…`
    : currentAuthor.name

  const fallbackDescription = `Discover quotes by ${currentAuthor.name} on Verbatims.`
  const rawDescription = currentAuthor.description?.trim() || fallbackDescription
  const trimmedDescription = rawDescription.length > 180
    ? `${rawDescription.slice(0, 177)}…`
    : rawDescription

  return {
    title: `${trimmedName} • Verbatims`,
    description: trimmedDescription,
    imagePath: `/api/og/authors/${currentAuthor.id}.png`,
    imageAlt: `Profile of ${currentAuthor.name} on Verbatims`,
    type: 'profile'
  }
})

const authorQuotes: Ref<QuoteWithMetadata[]> = ref([])
const quotesLoading = ref<boolean>(false)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(true)
const currentQuotePage = ref<number>(1)
const sortOptions: SortOption[] = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Popular', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' }
]

const sortBy = ref<SortOption>(sortOptions[0])
const mobileFiltersOpen = ref<boolean>(false)

const headerIn = ref(false)
const showTypeBadge = ref(false)

const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
const copyState = ref<'idle' | 'copying' | 'copied'>('idle')
const showEditAuthorDialog = ref(false)
const showDeleteAuthorDialog = ref(false)
const descriptionExpanded = ref(false)
const descriptionEl = ref<HTMLElement | null>(null)
const isDescriptionOverflowing = ref(false)
let descriptionResizeObserver: ResizeObserver | null = null
const similarAuthors = ref<any[]>([])

// Avatar preview state (opened when clicking the avatar)
const avatarPreviewOpen = ref(false)
const avatarRef = ref<any>(null)

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

watch([() => author.value?.description, () => descriptionExpanded.value], () => {
  nextTick(checkDescriptionOverflow)
})

// Convert AuthorWithSocials to Author for AddAuthorDialog
const authorAsEditAuthor = computed(() => {
  if (!author.value) return null
  // Omit or transform socials to string or undefined as required by Author type
  const { socials, ...rest } = author.value
  return { ...rest, socials: Array.isArray(socials) ? '' : socials }
})

// Global keyboard shortcuts for author page (single letters)
// Ignored when a meta/ctrl/alt key is held so native browser shortcuts continue to work
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!e || !author.value) return

  // ignore interactive elements (inputs, textareas, contenteditable, etc.)
  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag || '')
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
        showDeleteAuthorDialog.value = true
      }
      break
    case 'e':
      if (isAdminMod) {
        e.preventDefault()
        showEditAuthorDialog.value = true
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
      reportAuthor()
      break
    case 's':
      e.preventDefault()
      shareAuthor()
      break
    default:
      break
  }
}

// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = author.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

const headerMenuItems = computed<HeaderMenuItem[]>(() => {
  const items: HeaderMenuItem[] = []

  if (user.value && (user.value.role === 'admin' || user.value.role === 'moderator')) {
    items.push({
      label: 'Edit',
      leading: 'i-ph-pencil-simple',
      onclick: () => { showEditAuthorDialog.value = true }
    })
    items.push({
      label: 'Delete',
      leading: 'i-ph-trash',
      onclick: () => { showDeleteAuthorDialog.value = true }
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
      onclick: () => shareAuthor()
    },
    {
      label: 'Report',
      leading: 'i-ph-flag',
      onclick: () => reportAuthor()
    }
  )

  return items
})

const loadQuotes = async (reset = true) => {
  const currentAuthor = author.value
  if (!currentAuthor) return

  // Wait for language store to be ready before loading quotes
  await waitForLanguageStore()

  if (reset) {
    quotesLoading.value = true
    currentQuotePage.value = 1
    authorQuotes.value = []
  } else {
    loadingMoreQuotes.value = true
  }

  try {
    const query = {
      author_id: currentAuthor.id,
      page: currentQuotePage.value,
      limit: 12,
      sort_by: sortBy.value.value,
      sort_order: 'DESC',
      ...languageStore.getLanguageQuery()
    }

    const response = await $fetch('/api/quotes', { query })

    if (reset) {
      authorQuotes.value = response.data || []
    } else {
      authorQuotes.value.push(...(response.data || []))
    }

    hasMoreQuotes.value = response.pagination?.hasMore || false
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // Reset quotes on error to show empty state
    if (reset) {
      authorQuotes.value = []
    }
    hasMoreQuotes.value = false
  } finally {
    quotesLoading.value = false
    loadingMoreQuotes.value = false
  }
}

const onAuthorUpdated = async () => {
  const { toast } = useToast()
  try {
    const fresh = await $fetch<ApiResponse<AuthorWithSocials>>(`/api/authors/${route.params.id}`)
    authorData.value = fresh
    toast({ title: 'Author updated' })
  } catch (error) {
    console.error('Failed to refresh author after update:', error)
  } finally {
    showEditAuthorDialog.value = false
  }
}

const onAuthorDeleted = async () => {
  await navigateTo('/authors')
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
  const currentAuthor = author.value
  if (!user.value || !currentAuthor) return
  
  try {
    const { data } = await $fetch(`/api/authors/${currentAuthor.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  const currentAuthor = author.value
  if (!user.value || !currentAuthor || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/authors/${currentAuthor.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    currentAuthor.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

const shareAuthor = async () => {
  const currentAuthor = author.value
  if (!currentAuthor || sharePending.value) return

  sharePending.value = true
  const { toast } = useToast()

  try {
    const shareData = {
      title: `${currentAuthor.name} on Verbatims`,
      text: currentAuthor.description || currentAuthor.job || currentAuthor.name,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Author shared successfully!' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: 'Author link copied to clipboard!' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    currentAuthor.shares_count = (currentAuthor.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share author:', error)
    toast({ title: 'Failed to share', description: 'Please try again.' })
  } finally {
    sharePending.value = false
  }
}

// copy author name plus current page url
const copyTextAndLink = async () => {
  const currentAuthor = author.value
  if (!currentAuthor) return
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('clipboard-unavailable')
    }
    const url = typeof window !== 'undefined' ? window.location.href : ''
    await navigator.clipboard.writeText(`${currentAuthor.name}\n\n${url}`)

    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    useToast().toast({ title: 'Copy failed', description: 'Clipboard not available.' })
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
    useToast().toast({ title: 'Copy failed', description: 'Could not copy the link.' })
  }
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const navigateToAuthorsList = async () => {
  await navigateTo('/authors')
}

const showReportDialog = ref(false)
const reportAuthor = () => { showReportDialog.value = true }

const formatLifeDates = (birthDate?: string | null, deathDate?: string | null): string => {
  if (!birthDate && !deathDate) return ''
  
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  
  return `${birth} - ${death}`
}

const formatNumber = (num?: number | null): string => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getAuthorInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getDescriptionPreview = (description: string): string => {
  if (!description) return ''
  const lines = description.split('\n').filter(line => line.trim())
  // Show first 2 lines or first 200 characters, whichever is shorter
  const preview = lines.slice(0, 2).join('\n')
  if (preview.length > 200) {
    return preview.substring(0, 200) + '...'
  }
  return preview + (lines.length > 2 ? '...' : '')
}

const isDescriptionLong = (description: string): boolean => {
  if (!description) return false
  // Check if description has more than 3 non-empty lines or is longer than 300 characters
  const lines = description.split('\n').filter(line => line.trim())
  return lines.length > 3 || description.length > 300
}

const loadSimilarAuthors = async () => {
  const currentAuthor = author.value
  if (!currentAuthor) return

  try {
    const response = await $fetch(`/api/authors/${currentAuthor.id}/similar`, {
      query: { limit: 6 }
    })
    similarAuthors.value = response.data || []
  } catch (error) {
    console.error('Failed to load similar authors:', error)
    similarAuthors.value = []
  }
}

const hydrated = ref(false)

onMounted(async () => {
  await waitForLanguageStore()

  if (author.value) {
    try {
      const res = await $fetch(`/api/authors/${route.params.id}/view`, { method: 'POST' })
      if (!res.recorded) throw new Error('View not recorded')
      const currentAuthor = author.value
      if (currentAuthor) currentAuthor.views_count = (currentAuthor.views_count || 0) + 1
    } catch (error) {
      console.error('Failed to track author view:', error)
    }

    loadQuotes()
    loadSimilarAuthors()
    if (user.value) checkLikeStatus()
    
    // Trigger enter animation once content is available
    await triggerHeaderEnter()
  }

  // Attach global shortcut
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
})

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})

watch(author, (newAuthor) => {
  if (newAuthor) {
    loadQuotes()
    loadSimilarAuthors()
    if (user.value) {
      checkLikeStatus()
    }
    
    // retrigger header animation on author change
    triggerHeaderEnter()
  }
})

watch(user, (newUser) => {
  if (newUser && author.value) checkLikeStatus()
  else isLiked.value = false
})

watch(sortBy, () => loadQuotes())

// Small helper to stagger items
const enterAnim = (i: number) => ({ transitionDelay: `${i * 80}ms` })

// Ensure animations run after initial render and when data finishes loading
const triggerHeaderEnter = async () => {
  headerIn.value = false
  showTypeBadge.value = false
  await nextTick()
  // double rAF to guarantee the browser paints the initial hidden state
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      headerIn.value = true
      setTimeout(() => { showTypeBadge.value = true }, 450)
    })
  })
}

// Avatar preview handlers — open/close
const openAvatarPreview = () => {
  if (!author.value?.image_url) return
  avatarPreviewOpen.value = true
}

// Restore focus to avatar when preview closes (regardless of how it closed)
watch(avatarPreviewOpen, (open, prev) => {
  if (prev && !open) {
    nextTick(() => {
      try {
        const el = (avatarRef.value?.$el ?? avatarRef.value) as HTMLElement | undefined
        el?.focus?.()
      } catch (err) { /* noop */ }
    })
  }
})

// When navigating client-side, author fetch sets `pending` true -> false.
// Trigger animation right after pending turns false and author is present.
watch(pending, (now, prev) => {
  if (prev && !now && author.value) {
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
  background: linear-gradient(180deg, rgba(255,255,255,0), #fff 85%);
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

/* Subtle staggered fade-up for similar authors */
.similar-item {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 420ms cubic-bezier(.22,.61,.36,1), transform 420ms cubic-bezier(.22,.61,.36,1);
}
.similar-item.in {
  opacity: 1;
  transform: translateY(0);
}

/* Avatar subtle scale on appear + hover
   reserve opacity transition so appearance doesn't cause a layout jump. */
.avatar-entrance {
  transition: transform 420ms cubic-bezier(.22,.61,.36,1), box-shadow 320ms ease, opacity 320ms ease;
  transform-origin: center;
  opacity: 1;
}
.avatar-entrance.scale-in { transform: scale(1); opacity: 1; }
.avatar-entrance.scale-out { transform: scale(0.96); opacity: 0; pointer-events: none; }
.avatar-entrance:hover { transform: scale(1.03); opacity: 1; }


</style>
