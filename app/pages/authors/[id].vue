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
        @navigate-back="navigateBack"
        @scroll-to-quotes="scrollToQuotes"
      />
      </ClientOnly>

      <!-- 2-column newspaper layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b b-dashed border-gray-300 dark:border-gray-700">
        <!-- Content column -->
        <div class="lg:col-span-9 lg:border-r b-dashed border-gray-300 dark:border-gray-700 p-6 md:p-8 md:pr-12 lg:pr-16">
          <div class="flex items-center gap-3 mb-4">
            <div class="rounded-full flex ring-2 p-0.5 cursor-pointer shrink-0"
              :class="author.is_fictional ? 'ring-purple-500/60' : 'ring-blue-500/60'"
              @click="openAvatarPreview"
            >
              <NAvatar
                ref="avatarRef"
                :src="author.image_url || undefined"
                :alt="author.name"
                size="xs"
                :fallback="getAuthorInitials(author.name)"
                class="avatar-entrance"
                :class="headerIn ? 'scale-in' : 'scale-out'"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="author.is_fictional ? 'bg-purple-500' : 'bg-blue-500'" />
              <span class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Author</span>
              <template v-if="author.job">
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-400 dark:text-gray-400">{{ author.job }}</span>
              </template>
              <template v-if="!author.is_fictional && (author.birth_date || author.death_date)">
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-400 dark:text-gray-400">{{ formatLifeDates(author.birth_date, author.death_date) }}</span>
              </template>
              <template v-if="author.birth_location">
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-400 dark:text-gray-400">Born in {{ author.birth_location }}</span>
              </template>
              <template v-if="author.death_location && author.death_location !== author.birth_location">
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-400 dark:text-gray-400">Died in {{ author.death_location }}</span>
              </template>
            </div>
          </div>
          <h1
            class="font-title font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="[titleSizeClass, headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]']"
            :style="enterAnim(0)"
          >
            {{ author.name }}
          </h1>

          <div v-if="author.description"
            class="mb-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            <div class="relative">
              <p class="font-serif text-base md:text-lg lg:text-5xl font-200 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {{ author.description }}
              </p>
            </div>
          </div>

          <div
            class="transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(3)"
          >
            <ExternalLinksBadges :links="author.socials" />
          </div>
        </div>

        <!-- Quotes sidebar -->
        <div id="quotes" class="lg:col-span-3 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div class="p-6 md:p-8">
            <div class="flex items-center gap-3 mb-6">
              <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex-shrink-0 whitespace-nowrap">
                Quotes · {{ authorQuotes.length }}
              </p>
              <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div class="mb-6 space-y-3">
              <NSelect
                v-model="sortBy"
                :items="sortOptions"
                placeholder="Sort"
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

            <div v-else-if="authorQuotes.length > 0" class="space-y-4">
              <div
                v-for="quote in authorQuotes"
                :key="quote.id"
                class="pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <NLink
                  :to="`/quotes/${quote.id}`"
                  class="block group"
                >
                  <blockquote
                    class="font-body font-600 text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-3"
                    :class="{
                      'text-md': (quote.name || '').length <= 100,
                      'text-sm': (quote.name || '').length > 100
                    }"
                  >
                    {{ quote.name }}
                  </blockquote>
                </NLink>
                <div class="mt-2 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                  <NuxtLink
                    v-if="quote.reference"
                    :to="`/references/${quote.reference.id}`"
                    class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors truncate"
                  >
                    {{ quote.reference.name }}
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

            <div v-else class="text-center py-8">
              <p class="font-serif text-sm text-gray-400 dark:text-gray-500">No quotes yet</p>
            </div>

            <div v-if="hasMoreQuotes && !quotesLoading" class="mt-6 flex justify-center">
              <LoadMoreButton
                idleText="Load More Quotes"
                loadingText="Loading Quotes..."
                :isLoading="loadingMoreQuotes"
                @load="loadMoreQuotes"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="lg:hidden">
        <SimilarAuthors :authors="similarAuthors" />
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

<script lang="ts" setup>import { useJsonLd } from '../../composables/useSeo'
import type { ComputedRef, Ref } from 'vue'

const { isMobile } = useMobileDetection()
// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
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

watchEffect(() => {
  const a = author.value
  if (!a) return
  const { protocol, host } = useRequestURL()
  const site = `${protocol}//${host}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: a.name,
    description: a.description || `Discover quotes by ${a.name} on Verbatims.`,
    image: a.image_url ? (a.image_url.startsWith('http') ? a.image_url : `${site}${a.image_url}`) : `${site}/api/og/authors/${a.id}.png`,
    url: `${site}/authors/${a.id}`
  }
  useJsonLd(jsonLd)
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

const sortBy = ref<SortOption>(sortOptions[0]!)
const mobileFiltersOpen = ref<boolean>(false)

const headerIn = ref(false)

const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
const copyState = ref<'idle' | 'copying' | 'copied'>('idle')
const showEditAuthorDialog = ref(false)
const showDeleteAuthorDialog = ref(false)
const similarAuthors = ref<any[]>([])

// Avatar preview state (opened when clicking the avatar)
const avatarPreviewOpen = ref(false)
const avatarRef = ref<any>(null)

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

const titleSizeClass = computed(() => {
  const len = (author.value?.name || '').length
  if (len <= 20) return 'text-size-24 md:text-size-42 lg:text-size-48'
  if (len <= 40) return 'text-size-20 md:text-size-34 lg:text-size-40'
  if (len <= 60) return 'text-size-18 md:text-size-28 lg:text-size-34'
  return 'text-size-16 md:text-size-24 lg:text-size-28'
})

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

    const response = await $fetch<ApiResponse<QuoteWithMetadata[]> & { pagination?: { hasMore?: boolean; total?: number; page?: number; limit?: number } }>('/api/quotes', { query })

    if (reset) {
      authorQuotes.value = response?.data || []
    } else {
      authorQuotes.value.push(...(response?.data || []))
    }

    hasMoreQuotes.value = response?.pagination?.hasMore || false
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
  try {
    const fresh = await $fetch<ApiResponse<AuthorWithSocials>>(`/api/authors/${route.params.id}`)
    authorData.value = fresh
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
    const likeStatusRes = await $fetch<ApiResponse<{ isLiked: boolean }>>(`/api/authors/${currentAuthor.id}/like-status`)
    isLiked.value = likeStatusRes?.data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  const currentAuthor = author.value
  if (!user.value || !currentAuthor || likePending.value) return

  likePending.value = true
  try {
    const likeRes = await $fetch<ApiResponse<{ isLiked: boolean; likesCount: number | null }>>(`/api/authors/${currentAuthor.id}/like`, {
      method: 'POST'
    })

    isLiked.value = likeRes?.data?.isLiked ?? false
    currentAuthor.likes_count = likeRes?.data?.likesCount ?? currentAuthor.likes_count
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
  const { showErrorToast } = useErrorToast()

  try {
    const shareData = {
      title: `${currentAuthor.name} on Verbatims`,
      text: currentAuthor.description || currentAuthor.job || currentAuthor.name,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Author shared successfully!', toast: 'outline-success' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: 'Author link copied to clipboard!', toast: 'outline-success' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    currentAuthor.shares_count = (currentAuthor.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share author:', error)
    showErrorToast(error, 'Failed to share')
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
    useErrorToast().showErrorToast(error, 'Copy failed')
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
    useErrorToast().showErrorToast(error, 'Copy failed')
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

  navigateToAuthorsList()
}

const navigateToAuthorsList = async () => {
  if (typeof window !== 'undefined' && authorsListStore.shouldRestore && window.history.length > 1) {
    router.back()
    return
  }

  await navigateTo('/authors')
}

const authorsListStore = useAuthorsListStore()
onBeforeRouteLeave((to) => {
  if (!to.path.startsWith('/authors')) {
    authorsListStore.clearRestoreRequest()
  }
})

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

const loadSimilarAuthors = async () => {
  const currentAuthor = author.value
  if (!currentAuthor) return

  try {
    const similarRes = await $fetch<ApiResponse<Author[]>>(`/api/authors/${currentAuthor.id}/similar`, {
      query: { limit: 6 }
    })
    similarAuthors.value = similarRes?.data || []
  } catch (error) {
    console.error('Failed to load similar authors:', error)
    similarAuthors.value = []
  }
}

const hydrated = ref(false)

onNuxtReady(() => {
  hydrated.value = true
})

onMounted(async () => {
  await waitForLanguageStore()

  if (author.value) {
    try {
      const viewRes = await $fetch<{ recorded: boolean } | undefined>(`/api/authors/${route.params.id}/view`, { method: 'POST' })
      if (!viewRes?.recorded) throw new Error('View not recorded')
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
  }
})

watch(author, (newAuthor) => {
  if (newAuthor) {
    loadQuotes()
    loadSimilarAuthors()
    if (user.value) {
      checkLikeStatus()
    }

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
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      headerIn.value = true
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
