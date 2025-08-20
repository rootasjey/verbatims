<template>
  <div class="min-h-screen">
    <!-- Loading State for Language Store -->
    <div v-if="!isLanguageReady" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>

    <!-- Loading State for Reference Data -->
    <div v-else-if="pending" class="p-8">
      <div class="animate-pulse">
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>

    <!-- Reference Content -->
    <div v-else-if="reference">
      <!-- Sticky Top Header: compact title + stats/actions -->
      <div class="sticky top-[68px] z-30 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div class="flex items-center justify-between gap-3">
            <!-- Left: compact reference title and context -->
            <div class="min-w-0 flex items-center gap-3">
              <UIcon name="i-ph-book" class="w-5 h-5 text-gray-400" />
              <div class="truncate">
                <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
                <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <template v-if="reference.secondary_type">
                    <span class="truncate">{{ reference.secondary_type }}</span>
                  </template>
                  <template v-else-if="reference.primary_type || reference.release_date">
                    <span class="truncate">
                      {{ formatType(reference.primary_type) }}
                      <template v-if="reference.release_date"> • {{ formatReleaseDate(reference.release_date) }}</template>
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Middle: stats chips -->
            <div class="hidden md:flex items-center gap-2">
              <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
                <UIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
                <span class="font-medium">{{ formatNumber(reference.views_count || 0) }}</span>
              </div>

              <UButton
                btn="~"
                size="xs"
                :disabled="sharePending"
                class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                @click="shareReference"
              >
                <UIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
                <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(reference.shares_count || 0) }}</span>
              </UButton>

              <UButton
                btn="~"
                size="xs"
                :disabled="!user || likePending"
                :class="[
                  'min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full',
                  isLiked
                    ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                    : 'text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20',
                  !user && 'cursor-not-allowed opacity-50'
                ]"
                @click="toggleLike"
              >
                <UIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'" :class="['w-3.5 h-3.5 mr-1', likePending && 'animate-pulse']" />
                <span>{{ formatNumber(reference.likes_count || 0) }}</span>
              </UButton>
            </div>

            <!-- Right: quick actions -->
            <div class="flex items-center gap-2">
              <UButton
                :btn="copyState === 'copied' ? 'soft-green' : 'soft-gray'"
                size="xs"
                class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
                @click="copyLink"
              >
                <UIcon :name="copyState === 'copied' ? 'i-ph-check' : 'i-ph-link'" class="w-3.5 h-3.5 mr-1" />
                <span class="hidden sm:inline">{{ copyState === 'copied' ? 'Copied' : 'Copy' }}</span>
              </UButton>

              <UDropdownMenu :items="headerMenuItems" :popper="{ placement: 'bottom-end' }" class="font-sans">
                <UButton
                  icon
                  btn="ghost-gray"
                  label="i-ph-dots-three-vertical-bold"
                  size="xs"
                  class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
                  title="More actions"
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reference Header -->
      <header class="mt-12 p-8">
        <!-- Reference Type and Release Date (badge appears after content animates) -->
        <!-- Reserve vertical space to avoid layout shift when the badge fades in -->
        <div class="flex items-center justify-center gap-4 min-h-8">
          <Transition name="fade-up" appear>
            <UBadge
              v-if="showTypeBadge"
              :color="getTypeColor(reference.primary_type)"
              variant="subtle"
              size="sm"
            >
              {{ formatType(reference.primary_type) }}
            </UBadge>
          </Transition>

          <span v-if="reference.release_date" class="font-serif text-gray-600 dark:text-gray-400">
            {{ formatReleaseDate(reference.release_date) }}
          </span>
        </div>

        <div class="text-center mb-6">
          <h1
            class="font-title text-size-54 font-600 line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(0)"
          >
            {{ reference.name }}
          </h1>

          <p
            v-if="reference.secondary_type"
            class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(1)"
          >
            {{ reference.secondary_type }}
          </p>

          <p v-if="reference.description"
            class="font-body text-size-5 font-200 text-gray-600
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6 transform-gpu transition-all duration-700 ease-out"
            :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
            :style="enterAnim(2)"
          >
            {{ reference.description }}
          </p>

          <div v-if="reference.original_language && reference.original_language !== 'en'" class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <UIcon name="i-ph-globe" class="w-4 h-4" />
            <span>Original Language: {{ formatLanguage(reference.original_language) }}</span>
          </div>
        </div>
      </header>

      <!-- External Links -->
      <div v-if="reference.urls && reference.urls.length > 0" class="px-8 mb-8">
        <div class="text-center">
          <h3 class="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-4">External Links</h3>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton
              v-for="(url, index) in reference.urls"
              :key="index"
              :to="url"
              external
              btn="outline"
              size="sm"
            >
              <UIcon name="i-ph-link" />
              <span>View Source</span>
            </UButton>
          </div>
        </div>
      </div>
      <!-- Quotes Section -->
      <div class="px-8 pb-16">
        <!-- Sort Options -->
        <div class="font-body mb-8">
          <div class="flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ referenceQuotes.length }} quotes</p>
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
            <LanguageSelector @language-changed="onLanguageChange" />
          </div>
        </div>

        <!-- Loading State -->
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
          <!-- Masonry Grid Layout -->
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

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote from {{ reference.name }}!
          </p>
        </div>

        <!-- Load More -->
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
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Reference Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The reference you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/references" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse References
        </UButton>
      </div>
    </div>

    <AddReferenceDialog
      v-if="isEditDialogOpen && reference"
      v-model="isEditDialogOpen"
      :edit-reference="reference"
      @reference-updated="onReferenceUpdated"
    />

    <DeleteReferenceDialog
      v-if="isDeleteDialogOpen && reference"
      v-model="isDeleteDialogOpen"
      :reference="reference"
      @reference-deleted="onReferenceDeleted"
    />

    <ReportDialog
      v-if="reference"
      v-model="showReportDialog"
      targetType="reference"
      :targetId="reference.id"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()

const { data: referenceData, pending } = await useLazyFetch(`/api/references/${route.params.id}`)
const reference = computed(() => referenceData.value?.data)

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

const referenceQuotes = ref([])
const quotesLoading = ref(false)
const loadingMoreQuotes = ref(false)
const hasMoreQuotes = ref(true)
const currentQuotePage = ref(1)
const sortBy = ref({ label: 'Most Recent', value: 'created_at' })

const sortOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Popular', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' }
]

const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
const copyState = ref('idle')
const headerIn = ref(false)
const showTypeBadge = ref(false)

// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = reference.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

const headerMenuItems = computed(() => {
  const items = []

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
      sort_by: sortBy.value.value || sortBy.value,
      sort_order: 'DESC',
      ...languageStore.getLanguageQuery()
    }

    const response = await $fetch('/api/quotes', { query })

    if (reset) {
      referenceQuotes.value = response.data || []
    } else {
      referenceQuotes.value.push(...(response.data || []))
    }

    hasMoreQuotes.value = response.pagination?.hasMore || false
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

    if (navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Reference shared successfully!', variant: 'success' })
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: 'Reference link copied to clipboard!', variant: 'success' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    reference.value.shares_count = (reference.value.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share reference:', error)
    toast({ title: 'Failed to share', description: 'Please try again.', variant: 'error' })
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
    toast({ title: 'Copy failed', description: 'Could not copy the link.', variant: 'error' })
  }
}

const showReportDialog = ref(false)
const reportReference = () => { showReportDialog.value = true }

// Global keyboard shortcut: Ctrl/Cmd + E to open edit dialog (admin/mod only)
const handleGlobalKeydown = (e) => {
  if (!(e && (e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E'))) return

  // Skip when typing in inputs/contenteditable elements
  const target = e.target
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag)
  if (isEditable) return

  if (reference.value && canEditReference.value) {
    e.preventDefault()
    isEditDialogOpen.value = true
  }
}

const formatReleaseDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.getFullYear()
}

const formatLanguage = (langCode) => {
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

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getTypeColor = (type) => {
  const colors = {
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

const formatType = (type) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

onMounted(async () => {
  // Attach global shortcut as soon as component mounts
  window.addEventListener('keydown', handleGlobalKeydown)

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
const enterAnim = (i) => ({ transitionDelay: `${i * 80}ms` })

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
