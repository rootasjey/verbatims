<template>
  <div class="min-h-screen">
    <!-- Loading State for Language Store -->
    <div v-if="!isLanguageReady" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    </div>

    <!-- Loading State for Author Data -->
    <div v-else-if="pending" class="p-8">
      <div class="animate-pulse">
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      </div>
    </div>

    <!-- Author Content -->
    <div v-else-if="author">
      <!-- Sticky Top Header: compact title + stats/actions -->
      <div class="sticky top-[68px] z-30 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div class="flex items-center justify-between gap-3">
            <!-- Left: compact author title and context -->
            <div class="min-w-0 flex items-center gap-3">
              <UIcon name="i-ph-user" class="w-5 h-5 text-gray-400" />
              <div class="truncate">
                <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
                <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <template v-if="author.job">
                    <span class="truncate">{{ author.job }}</span>
                  </template>
                  <template v-else-if="author.birth_date || author.death_date">
                    <span class="truncate">{{ formatLifeDates(author.birth_date, author.death_date) }}</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Middle: stats chips -->
            <div class="hidden md:flex items-center gap-2">
              <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
                <UIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
                <span class="font-medium">{{ formatNumber(author.views_count || 0) }}</span>
              </div>

              <UButton
                btn="~"
                size="xs"
                :disabled="sharePending"
                class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                @click="shareAuthor"
              >
                <UIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
                <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(author.shares_count || 0) }}</span>
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
                <span>{{ formatNumber(author.likes_count || 0) }}</span>
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
      <!-- Author Header -->
      <header class="mt-12 p-8">
        <!-- Author Type -->
        <div class="flex items-center justify-center gap-4">
          <UBadge
            :color="author.is_fictional ? 'purple' : 'blue'"
            variant="subtle"
            size="sm"
          >
            {{ author.is_fictional ? 'Fictional Character' : 'Real Person' }}
          </UBadge>
        </div>

        <div class="text-center mb-6">
          <h1 class="font-title text-size-54 font-600 line-height-none uppercase mb-4">
            {{ author.name }}
          </h1>

          <span v-if="!author.is_fictional && (author.birth_date || author.death_date)" class="font-serif font-600 text-gray-600 dark:text-gray-400">
            {{ formatLifeDates(author.birth_date, author.death_date) }}
          </span>

          <!-- Job Title -->
          <p v-if="author.job" class="font-title text-lg text-gray-600 dark:text-gray-400 mb-4">
            {{ author.job }}
          </p>

          <!-- Description -->
          <p v-if="author.description" 
            class="font-body text-size-5 font-200 text-gray-600 
            dark:text-gray-400 max-w-2xl mx-auto mb-6
            border-t border-b border-dashed border-gray-300 dark:border-gray-600 p-6"
          >
            {{ author.description }}
          </p>

          <!-- Location Info -->
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

      <!-- Social Links -->
      <div v-if="author.socials && author.socials.length > 0" class="px-8 mb-8">
        <div class="text-center">
          <h3 class="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton
              v-for="social in author.socials"
              :key="social.url"
              :to="social.url"
              external
              btn="outline"
              size="sm"
            >
              <UIcon :name="getSocialIcon(social.platform)" />
              <span>{{ social.platform }}</span>
            </UButton>
          </div>
        </div>
      </div>

      <UBadge :badge="isMetaBadgeOpen ? 'solid-gray' : 'soft'" rounded="full" 
        :class="[
          'z-2 fixed top-20 right-12 overflow-hidden text-sm font-medium transition-all', 
          isMetaBadgeOpen ? 'w-auto px-4 text-center hover:scale-101 active:scale-99' : 'w-9 hover:scale-105 active:scale-99'
        ]">
        <div class="flex gap-4 justify-center items-center">
          <div :class="['gap-4', isMetaBadgeOpen ? 'flex' : 'hidden']">
            <div class="flex items-center">{{ formatNumber(author.views_count) }} views</div>
            <div class="flex items-center">{{ formatNumber(totalQuoteLikes) }} quote likes</div>
            <UButton
              btn="~"
              @click="toggleLike"
              :disabled="!user || likePending"
              :class="[
                'min-w-0 min-h-0 h-auto w-auto p-0 flex items-center transition-all',
                isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                !user && 'cursor-not-allowed opacity-50'
              ]"
            >
              <UIcon
                :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'"
                :class="[likePending && 'animate-pulse']"
              />
              <span>{{ formatNumber(author.likes_count) }}</span>
            </UButton>
          </div>
          <UButton 
            icon btn="text-pink" 
            :label="isMetaBadgeOpen ? 'i-ph-x-bold' : 'i-ph-asterisk-bold'" 
            :class="['min-w-0 min-h-0 h-auto w-auto p-0', isMetaBadgeOpen ? 'hover:animate-pulse' : 'hover:animate-spin']" size="xs" 
            @click="isMetaBadgeOpen = !isMetaBadgeOpen"
          />
        </div>
      </UBadge>

      <!-- Quotes Section -->
      <div class="px-8 pb-16">
        <!-- Sort Options -->
        <div class="font-body mb-8">
          <div class="flex gap-4 max-w-2xl mx-auto items-center justify-center">
            <p class="whitespace-nowrap font-600 color-gray-600 dark:text-gray-300">{{ authorQuotes.length }} quotes</p>
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
          </div>

          <!-- Language Selector -->
          <div class="flex items-center justify-center mt-4">
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
        <div v-else-if="authorQuotes.length > 0" class="mb-12">
          <!-- Masonry Grid Layout -->
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

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No quotes yet</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            Be the first to submit a quote by {{ author.name }}!
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
        <h2 class="font-title text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
        <p class="font-serif text-gray-600 dark:text-gray-400 mb-6">
          The author you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/authors" size="sm" btn="solid-black" class="px-8 py-3 rounded-3">
          Browse Authors
        </UButton>
      </div>
    </div>
    <!-- Edit Author Dialog (re-uses AddAuthorDialog in edit mode) -->
    <AddAuthorDialog
      v-model="showEditAuthorDialog"
      :editAuthor="author"
      @author-updated="onAuthorUpdated"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

const languageStore = useLanguageStore()
const { waitForLanguageStore, isLanguageReady } = useLanguageReady()

const { data: authorData, pending } = await useLazyFetch(`/api/authors/${route.params.id}`)
const author = computed(() => authorData.value?.data)

useHead(() => ({
  title: author.value ? `${author.value.name} - Authors - Verbatims` : 'Author - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: author.value 
        ? `Discover quotes by ${author.value.name}. ${author.value.description || ''}`
        : 'View author details and quotes on Verbatims' 
    }
  ]
}))

const authorQuotes = ref([])
const quotesLoading = ref(false)
const loadingMoreQuotes = ref(false)
const hasMoreQuotes = ref(true)
const currentQuotePage = ref(1)
const sortBy = ref({ label: 'Most Recent', value: 'created_at' })

const isMetaBadgeOpen = ref(false)

const sortOptions = [
  { label: 'Most Recent', value: 'created_at' },
  { label: 'Most Popular', value: 'likes_count' },
  { label: 'Most Viewed', value: 'views_count' }
]

// Like functionality
const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
const copyState = ref('idle')
const showEditAuthorDialog = ref(false)

// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = author.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

const headerMenuItems = computed(() => {
  const items = []

  if (user.value && (user.value.role === 'admin' || user.value.role === 'moderator')) {
    items.push({
      label: 'Edit',
      leading: 'i-ph-pencil-simple',
  onclick: () => { showEditAuthorDialog.value = true }
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

const totalQuoteLikes = computed(() => {
  return authorQuotes.value.reduce((sum, quote) => sum + (quote.likes_count || 0), 0)
})

const loadQuotes = async (reset = true) => {
  if (!author.value) return

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
      author_id: author.value.id,
      page: currentQuotePage.value,
      limit: 12,
      sort_by: sortBy.value,
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
    const fresh = await $fetch(`/api/authors/${route.params.id}`)
    authorData.value = fresh
    toast({ title: 'Author updated', variant: 'success' })
  } catch (error) {
    console.error('Failed to refresh author after update:', error)
  } finally {
    showEditAuthorDialog.value = false
  }
}

const loadMoreQuotes = async () => {
  if (loadingMoreQuotes.value || !hasMoreQuotes.value) return

  currentQuotePage.value++
  await loadQuotes(false)
}

const onLanguageChange = async () => {
  // Reset pagination when language changes
  currentQuotePage.value = 1
  hasMoreQuotes.value = true

  // Reload quotes with new language filter
  await loadQuotes(true)
}

// Like functionality
const checkLikeStatus = async () => {
  if (!user.value || !author.value) return
  
  try {
    const { data } = await $fetch(`/api/authors/${author.value.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !author.value || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/authors/${author.value.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    author.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

const shareAuthor = async () => {
  if (!author.value || sharePending.value) return

  sharePending.value = true
  const { toast } = useToast()

  try {
    const shareData = {
      title: `${author.value.name} on Verbatims`,
      text: author.value.description || author.value.job || author.value.name,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (navigator.share) {
      await navigator.share(shareData)
      toast({ title: 'Author shared successfully!', variant: 'success' })
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: 'Author link copied to clipboard!', variant: 'success' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    author.value.shares_count = (author.value.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share author:', error)
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

const reportAuthor = () => {
  // TODO: Open report modal for author
}

// Utility functions
const formatLifeDates = (birthDate, deathDate) => {
  if (!birthDate && !deathDate) return ''
  
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  
  return `${birth} - ${death}`
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

const getSocialIcon = (platform) => {
  const icons = {
    twitter: 'i-ph-twitter-logo-duotone',
    facebook: 'i-ph-facebook-logo-duotone',
    instagram: 'i-ph-instagram-logo-duotone',
    linkedin: 'i-ph-linkedin-logo-duotone',
    youtube: 'i-ph-youtube-logo-duotone',
    website: 'i-ph-globe-duotone'
  }
  return icons[platform.toLowerCase()] || 'i-ph-link'
}

onMounted(async () => {
  await waitForLanguageStore()

  if (author.value) {
    // Track view
    try {
      await $fetch(`/api/authors/${route.params.id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to track author view:', error)
    }

    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

watch(author, (newAuthor) => {
  if (newAuthor) {
    loadQuotes()
    if (user.value) {
      checkLikeStatus()
    }
  }
})

watch(user, (newUser) => {
  if (newUser && author.value) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})

watch(sortBy, () => {
  loadQuotes()
})
</script>


