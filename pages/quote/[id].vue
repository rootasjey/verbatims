<template>
  <div class="min-h-screen">
    <!-- Sticky Top Header: compact title + stats/actions -->
    <div v-if="quote" class="sticky top-[68px] z-30 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div class="flex items-center justify-between gap-3">
          <!-- Left: compact quote title and context -->
          <div class="min-w-0 flex items-center gap-3">
            <UIcon name="i-ph-quotes" class="w-5 h-5 text-gray-400" />
            <div class="truncate">
              <div class="text-sm font-serif text-gray-900 dark:text-white truncate">"{{ headerTitle }}"</div>
              <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <template v-if="quote.author || quote.reference">
                  <NuxtLink
                    v-if="quote.author"
                    :to="`/authors/${quote.author.id}`"
                    class="truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {{ quote.author.name }}
                  </NuxtLink>
                  <span v-if="quote.author && quote.reference" aria-hidden="true" class="mx-1">•</span>
                  <NuxtLink
                    v-if="quote.reference"
                    :to="`/references/${quote.reference.id}`"
                    class="inline-flex items-center truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon :name="getReferenceIcon(quote.reference.type)" class="w-3 h-3 mr-1 text-gray-400" />
                    <span class="truncate">{{ quote.reference.name }}</span>
                  </NuxtLink>
                </template>
                <span v-else>{{ getLanguageName(quote.language) }}</span>
              </div>
            </div>
          </div>

          <!-- Middle: stats chips -->
          <div class="hidden md:flex items-center gap-2">
            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
              <UIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
              <span class="font-medium">{{ formatNumber(quote.views_count || 0) }}</span>
            </div>

            <UButton
              btn="~"
              size="xs"
              :disabled="sharePending"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
              @click="shareQuote"
            >
              <UIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
              <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(quote.shares_count || 0) }}</span>
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
              <UIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart-duotone'" :class="['w-3.5 h-3.5 mr-1', likePending && 'animate-pulse']" />
              <span>{{ formatNumber(quote.likes_count || 0) }}</span>
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

            <UButton
              :btn="savedState === 'saved' ? 'soft-green' : 'soft-blue'"
              size="xs"
              :disabled="!user"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              @click="addToCollection"
            >
              <UIcon :name="savedState === 'saved' ? 'i-ph-check' : 'i-ph-bookmark-simple'" class="w-3.5 h-3.5 mr-1" />
              <span class="hidden sm:inline">{{ savedState === 'saved' ? 'Saved' : 'Save' }}</span>
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

    <!-- Loading State -->
    <div v-if="pending" class="px-8 py-16">
      <div class="max-w-4xl mx-auto">
        <div class="animate-pulse space-y-8">
          <div class="text-center space-y-4">
            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          </div>
          <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Quote Content -->
    <div v-else-if="quote" class="mt-16 px-8 py-16">
      <div class="max-w-4xl mx-auto">
        <!-- Main Quote Section -->
        <div class="text-center mb-16">
          <!-- Quote Text - Typography Focused -->
          <div class="relative mb-12">
            <blockquote class="font-serif font-600 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight text-gray-900 dark:text-white mb-8 px-4">
              {{ quote.name }}
            </blockquote>

            <!-- Decorative Elements -->
            <div class="absolute -top-4 -left-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
            <div class="absolute -bottom-4 -right-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
          </div>

          <!-- Attribution Section -->
          <div v-if="quote.author || quote.reference" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 space-y-2">
            <!-- Author -->
            <div v-if="quote.author" class="flex flex-col items-center justify-center">
              <NuxtLink :to="`/authors/${quote.author.id}`">
                <UAvatar
                  :src="quote.author.image_url"
                  :alt="quote.author.name"
                  size="xl"
                  class="ring-2 ring-gray-200 dark:ring-gray-700 hover:scale-105 active:scale-99 transition-transform"
                />
              </NuxtLink>
              <div class="mt-2">
                <NuxtLink
                  :to="`/authors/${quote.author.id}`"
                  class="font-body text-size-4  font-400 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
                >
                  {{ quote.author.name }}
                </NuxtLink>
                <UBadge
                  v-if="quote.author.is_fictional"
                  class="mt-1"
                  label="Fictional Character"
                />
              </div>
            </div>

            <!-- Reference -->
            <div v-if="quote.reference" class="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
              <UIcon :name="getReferenceIcon(quote.reference.type)" />
              <NuxtLink
                :to="`/references/${quote.reference.id}`"
                class="font-serif font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {{ quote.reference.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="quote.tags?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8">
          <div class="flex flex-wrap justify-center gap-3">
            <NuxtLink
              v-for="tag in quote.tags"
              :key="tag.name"
              :to="`/tags/${encodeURIComponent(tag.name)}`"
              class="inline-flex items-center px-4 py-2 border border-dashed rounded-lg text-sm font-medium font-sans transition-all hover:scale-105 hover:shadow-sm"
              :style="{
                backgroundColor: tag.color + '10',
                color: tag.color,
                borderColor: tag.color + '40'
              }"
            >
              #{{ tag.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="max-w-3xl mx-auto">
        <div class="rounded-xl border-0.5px border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-[#0C0A09]/50">
          <div class="border-b border-gray-200 dark:border-gray-800 mb-6 p-6">
            <h3 class="text-xl line-height-4 sm:text-size-4 font-title font-semibold text-gray-900 dark:text-white">
              Metadata
            </h3>
            <span class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
              All secondary information about the quote.
            </span>
          </div>

          <dl class="space-y-4 pb-4">
            <!-- Language -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <UIcon name="i-ph-translate" class="w-4 h-4 mr-2 text-gray-400" />
                Language
              </dt>
              <dd class="sm:col-span-2 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">
                {{ getLanguageName(quote.language) }}
              </dd>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-800"></div>

            <!-- Submitted by -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <UIcon name="i-ph-user" class="w-4 h-4 mr-2 text-gray-400" />
                Submitted by
              </dt>
              <dd class="sm:col-span-2 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ quote.user.name }}</dd>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-800"></div>

            <!-- Added on -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <UIcon name="i-ph-calendar" class="w-4 h-4 mr-2 text-gray-400" />
                Added on
              </dt>
              <dd class="sm:col-span-2 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ formatDate(quote.created_at) }}</dd>
            </div>

            <div v-if="quote.reference">
              <div class="border-t border-gray-200 dark:border-gray-800 my-4"></div>
              <!-- Reference type -->
              <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <UIcon :name="getReferenceIcon(quote.reference.type)" class="w-4 h-4 mr-2 text-gray-400" />
                  Reference type
                </dt>
                <dd class="sm:col-span-2 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white capitalize">{{ quote.reference.type.replace('_',' ') }}</dd>
              </div>
            </div>

            <div v-if="quote.is_featured">
              <div class="border-t border-gray-200 dark:border-gray-800 my-4"></div>
              <!-- Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <UIcon name="i-ph-star" class="w-4 h-4 mr-2 text-yellow-500" />
                  Status
                </dt>
                <dd class="sm:col-span-2">
                  <UBadge color="yellow" variant="subtle" class="font-sans">
                    <UIcon name="i-ph-sparkle" class="w-3 h-3 mr-1" />
                    Featured quote
                  </UBadge>
                </dd>
              </div>
            </div>
          </dl>
        </div>

        <!-- Related Quotes -->
        <div v-if="relatedQuotes?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-16 mt-16">
          <h3 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white text-center mb-12">Related Quotes</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div
              v-for="relatedQuote in relatedQuotes"
              :key="relatedQuote.id"
              class="border border-dashed border-gray-300 dark:border-gray-600 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
              @click="navigateTo(`/quote/${relatedQuote.id}`)"
            >
              <blockquote class="font-serif text-lg text-gray-800 dark:text-gray-200 mb-4 line-clamp-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                "{{ relatedQuote.name }}"
              </blockquote>
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span v-if="relatedQuote.author" class="font-sans">{{ relatedQuote.author.name }}</span>
                <div class="flex items-center space-x-4">
                  <span class="flex items-center space-x-1">
                    <UIcon name="i-ph-heart" class="w-4 h-4" />
                    <span>{{ relatedQuote.likes_count }}</span>
                  </span>
                  <span class="flex items-center space-x-1">
                    <UIcon name="i-ph-eye" class="w-4 h-4" />
                    <span>{{ formatNumber(relatedQuote.views_count) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="px-8 py-16">
      <div class="max-w-4xl mx-auto text-center">
        <UIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-4">Quote Not Found</h2>
        <p class="text-lg font-sans text-gray-600 dark:text-gray-400 mb-8">
          The quote you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/" size="lg" class="font-sans">Browse Quotes</UButton>
      </div>
    </div>
  </div>

  <AddToCollectionModal
    v-model="showAddToCollectionModal"
    :quote="quote"
    @added="onAddedToCollection"
  />

  <AddQuoteDialog
    v-model="showEditQuoteDialog"
    :editQuote="quote"
    @quote-updated="onQuoteUpdated"
  />

  <DeleteQuoteDialog
    v-if="quote"
    v-model="showDeleteQuoteDialog"
    :quote="quote"
    @quote-deleted="onQuoteDeleted"
  />

  <!-- Mobile Action Dock -->
  <div
    v-if="quote"
    class="lg:hidden fixed bottom-4 left-0 right-0 z-30 px-4"
  >
    <div class="max-w-xl mx-auto rounded-full border border-dashed border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-black/60 backdrop-blur supports-backdrop-blur:backdrop-blur-md shadow-lg">
      <div class="flex items-center justify-between px-2">
        <!-- Like -->
        <button
          @click="toggleLike"
          :disabled="!user || likePending"
          :class="[
            'm-1 inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
            isLiked
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
            !user && 'cursor-not-allowed opacity-50'
          ]"
        >
          <UIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" class="w-5 h-5" />
          <span class="text-sm font-sans">{{ quote.likes_count }}</span>
        </button>

        <!-- Save -->
        <button
          @click="addToCollection"
          :disabled="!user"
          :class="[
            'm-1 inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
            savedState === 'saved'
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
          ]"
        >
          <UIcon :name="savedState === 'saved' ? 'i-ph-check' : 'i-ph-bookmark-simple'" class="w-5 h-5" />
          <span class="text-sm font-sans">{{ savedState === 'saved' ? 'Saved' : 'Save' }}</span>
        </button>

        <!-- Share -->
        <button
          @click="shareQuote"
          :disabled="sharePending"
          class="m-1 inline-flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          <UIcon name="i-ph-share-network" class="w-5 h-5" />
          <span class="text-sm font-sans">Share</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const { user } = useUserSession()

const copyState = ref('idle')

// Fetch quote data
const { data: quoteData, pending } = await useFetch(`/api/quotes/${route.params.id}`)
const quote = computed(() => quoteData.value?.data)

// Fetch related quotes
const { data: relatedData } = await useFetch(`/api/quotes/${route.params.id}/related`)
const relatedQuotes = computed(() => relatedData.value?.data || [])

useHead(() => ({
  title: quote.value ? `"${quote.value.name.substring(0, 60)}..." - Verbatims` : 'Quote - Verbatims',
  meta: [
    { 
      name: 'description', 
      content: quote.value ? `${quote.value.name.substring(0, 160)}...` : 'View quote details on Verbatims' 
    },
    { property: 'og:title', content: quote.value ? `"${quote.value.name}"` : 'Quote' },
    { property: 'og:description', content: quote.value ? `${quote.value.author?.name ? `- ${quote.value.author.name}` : ''}` : '' },
    { property: 'og:type', content: 'article' }
  ]
}))

// Track view
onMounted(async () => {
  if (quote.value) {
    try {
      await $fetch(`/api/quotes/${route.params.id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }
})

const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
// Temporary saved UI state for Save buttons (header + mobile)
const savedState = ref('idle') // 'idle' | 'saved'
let savedTimeoutId

// Header title (truncated for compact sticky header)
const headerTitle = computed(() => {
  const text = quote.value?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})

// Edit dialog state
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)

const onQuoteUpdated = async () => {
  const { toast } = useToast()
  try {
    // Refresh main quote and related quotes after edit
    const fresh = await $fetch(`/api/quotes/${route.params.id}`)
    quoteData.value = fresh
    const freshRelated = await $fetch(`/api/quotes/${route.params.id}/related`)
    relatedData.value = freshRelated

    toast({ title: 'Quote updated', variant: 'success' })
  } catch (error) {
    console.error('Failed to refresh quote after update:', error)
  } finally {
    showEditQuoteDialog.value = false
  }
}

const onQuoteDeleted = async () => {
  await navigateTo('/')
}

const headerMenuItems = computed(() => {
  const items = []

  if (user.value && (user.value.role === 'admin' || user.value.role === 'moderator')) {
    items.push({
      label: 'Edit',
      leading: 'i-ph-pencil-simple',
      onclick: () => { showEditQuoteDialog.value = true }
    })
    items.push({
      label: 'Delete',
      leading: 'i-ph-trash',
      onclick: () => { showDeleteQuoteDialog.value = true }
    })
  }

  items.push(
    {
      label: 'Copy link',
      leading: 'i-ph-link',
      onclick: () => copyLink()
    },
    {
      label: 'Copy text',
      leading: 'i-ph-quotes',
      onclick: () => copyQuoteText()
    },
    {
      label: 'Share',
      leading: 'i-ph-share-network',
      onclick: () => shareQuote()
    },
    {
      label: 'Download image',
      leading: 'i-ph-download-simple',
      onclick: () => downloadQuote()
    },
    {
      label: 'Report',
      leading: 'i-ph-flag',
      onclick: () => reportQuote()
    }
  )

  return items
})

const checkLikeStatus = async () => {
  if (!user.value || !quote.value) return
  
  try {
    const { data } = await $fetch(`/api/quotes/${route.params.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || !quote.value || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/quotes/${route.params.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    quote.value.likes_count = data.likesCount
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

const shareQuote = async () => {
  if (!quote.value || sharePending.value) return

  sharePending.value = true
  const { toast } = useToast()

  try {
    const shareData = {
      title: 'Quote from Verbatims',
      text: `"${quote.value.name}" ${quote.value.author ? `- ${quote.value.author.name}` : ''}`,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
      toast({
        title: 'Quote shared successfully!',
        variant: 'success'
      })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({
        title: 'Quote link copied to clipboard!',
        variant: 'success'
      })
    }

    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
    toast({
      title: 'Failed to share quote',
      description: 'Please try again.',
      variant: 'error'
    })
  } finally {
    sharePending.value = false
  }
}

const showAddToCollectionModal = ref(false)

const addToCollection = () => {
  showAddToCollectionModal.value = true
}

const onAddedToCollection = (collection) => {
  // Show temporary Saved state (icon/text/green style) for a few seconds
  savedState.value = 'saved'
  if (savedTimeoutId) clearTimeout(savedTimeoutId)
  savedTimeoutId = setTimeout(() => {
    savedState.value = 'idle'
  }, 3000)
}

const downloadQuote = () => {
  // TODO: Generate and download quote image
}

const reportQuote = () => {
  // TODO: Open report modal
}

const copyQuoteText = async () => {
  if (!quote.value) return
  const { toast } = useToast()
  try {
    await navigator.clipboard.writeText(`"${quote.value.name}"${quote.value.author ? ` — ${quote.value.author.name}` : ''}${quote.value.reference ? ` (${quote.value.reference.name})` : ''}`)
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Clipboard is not available.', variant: 'error' })
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

const getReferenceIcon = (type) => {
  const icons = {
    film: 'i-ph-film-strip',
    book: 'i-ph-book',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video',
    other: 'i-solar-document-broken'
  }
  return icons[type] || 'i-solar-document-broken'
}

const getLanguageName = (code) => {
  const languages = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese'
  }
  return languages[code] || code.toUpperCase()
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Check like status on mount
onMounted(() => {
  if (user.value && quote.value) {
    checkLikeStatus()
  }
})

watch(user, (newUser) => {
  if (newUser && quote.value) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})

onUnmounted(() => {
  if (savedTimeoutId) clearTimeout(savedTimeoutId)
})
</script>
