<template>
  <div class="min-h-screen">
    <!-- Loading State for Language Store -->
    <div v-if="!isLanguageReady" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>

    <div v-else-if="pending" class="p-8">
      <div class="animate-pulse">
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>

    <div v-else-if="author">
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
        :scroll-to-top="scrollToTop"
        :share-author="shareAuthor"
        :toggle-like="toggleLike"
        :copy-link="copyLink"
      />

      <header class="mt-12 p-8">
        <!-- Author Type (appears after header content animates) -->
        <!-- Reserve vertical space to avoid layout shift when the badge fades in -->
        <div class="flex items-center justify-center gap-4 min-h-8">
          <Transition name="fade-up" appear>
            <UBadge
              v-if="showTypeBadge"
              :color="author.is_fictional ? 'purple' : 'blue'"
              size="sm"
            >
              {{ author.is_fictional ? 'Fictional Character' : 'Real Person' }}
            </UBadge>
          </Transition>
        </div>

        <div class="text-center mb-6 w-full">
          <h1
            class="font-title text-size-24 md:text-size-42 md:text-size-54 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(0)"
          >
            {{ author.name }}
          </h1>

          <span
            v-if="!author.is_fictional && (author.birth_date || author.death_date)"
            class="block font-serif font-600 text-gray-600 dark:text-gray-400 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ formatLifeDates(author.birth_date, author.death_date) }}
          </span>

          <p
            v-if="author.job"
            class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            {{ author.job }}
          </p>

          <p v-if="author.description"
            class="font-body text-size-4 md:text-size-5 font-200 text-gray-600 
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(3)"
          >
            {{ author.description }}
          </p>

          <div v-if="author.birth_location || author.death_location" class="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div v-if="author.birth_location" class="flex items-center space-x-1">
              <UIcon name="i-ph-map-pin" class="w-4 h-4" />
              <span>Born in {{ author.birth_location }}</span>
            </div>
            <div v-if="author.death_location && author.death_location !== author.birth_location" class="flex items-center space-x-1">
              <UIcon name="i-ph-map-pin" class="w-4 h-4" />
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
            <USelect
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
            <UButton size="sm" btn="outline-gray" class="rounded-full" @click="mobileFiltersOpen = true">
              <UIcon name="i-ph-faders" class="w-4 h-4 mr-1" />
              Filters
            </UButton>
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
          <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote by {{ author.name }}!
          </p>
        </div>

        <div v-if="hasMoreQuotes && !quotesLoading" class="text-center">
          <UButton
            @click="loadMoreQuotes"
            :loading="loadingMoreQuotes"
            :disabled="loadingMoreQuotes"
            size="sm"
            btn="solid-black"
            class="px-8 py-6 w-full rounded-3 hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
          >
            {{ loadingMoreQuotes ? 'Loading...' : 'Load More Quotes' }}
          </UButton>
        </div>
      </div>
  </div>

    <!-- Error State -->
    <div v-else class="p-8">
      <div class="text-center py-16">
        <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The author you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/authors" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse Authors
        </UButton>
      </div>
    </div>
    
    <AddAuthorDialog
      v-model="showEditAuthorDialog"
      :editAuthor="authorAsEditAuthor"
      @author-updated="onAuthorUpdated"
    />

    <DeleteAuthorDialog
      v-if="author"
      v-model="showDeleteAuthorDialog"
      :author="authorAsEditAuthor"
      @author-deleted="onAuthorDeleted"
    />

    <ReportDialog
      v-if="author"
      v-model="showReportDialog"
      targetType="author"
      :targetId="author.id"
    />
  </div>

  <MobileAuthorFiltersDrawer
    v-if="isMobile"
    v-model:open="mobileFiltersOpen"
    v-model:sortBy="sortBy"
    :sortOptions="sortOptions"
    @language-changed="onLanguageChange"
  />
</template>

<script lang="ts" setup>
import type { ApiResponse, AuthorWithSocials, Quote, QuoteWithMetadata } from '~/types'
import type { ComputedRef, Ref } from 'vue'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
definePageMeta({ layout: false })

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

useHead(() => ({
  title: author.value ? `${author.value.name} • Verbatims` : 'Author - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: author.value 
        ? `Discover quotes by ${author.value.name}. ${author.value.description || ''}`
        : 'View author details and quotes on Verbatims' 
    }
  ]
}))

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

// Convert AuthorWithSocials to Author for AddAuthorDialog
const authorAsEditAuthor = computed(() => {
  if (!author.value) return null
  // Omit or transform socials to string or undefined as required by Author type
  const { socials, ...rest } = author.value
  return { ...rest, socials: Array.isArray(socials) ? '' : socials }
})

// Global keyboard shortcut: Ctrl/Cmd + E to open edit dialog (admin/mod only)
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!(e && (e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E'))) return

  // Skip when typing in inputs/contenteditable elements
  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag || '')
  if (isEditable) return

  const role = user.value?.role
  if (author.value && (role === 'admin' || role === 'moderator')) {
    e.preventDefault()
    showEditAuthorDialog.value = true
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

    if (navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Author shared successfully!' })
    } else {
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

const copyLink = async () => {
  const { toast } = useToast()
  try {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) throw new Error('no-url')
    await navigator.clipboard.writeText(url)

    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Could not copy the link.' })
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

onMounted(async () => {
  setPageLayout(currentLayout.value)
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
    if (user.value) checkLikeStatus()
    
    // Trigger enter animation once content is available
    await triggerHeaderEnter()
  }

  // Attach global shortcut
  window.addEventListener('keydown', handleGlobalKeydown)
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

watch(author, (newAuthor) => {
  if (newAuthor) {
    loadQuotes()
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

// When navigating client-side, author fetch sets `pending` true -> false.
// Trigger animation right after pending turns false and author is present.
watch(pending, (now, prev) => {
  if (prev && !now && author.value) {
    triggerHeaderEnter()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
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
