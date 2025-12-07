<template>
  <div class="min-h-screen">
    <!-- Desktop-only Sticky Header (client-only to avoid SSR hydration mismatch due to teleports/popovers) -->
    <ClientOnly>
      <QuoteStickyHeader
        v-if="quote"
        class="animate-fade-in animate-duration-300 animate-ease-out"
        :quote="quote"
        :user="user"
        :is-liked="isLiked"
        :like-pending="likePending"
        :share-pending="sharePending"
        :saved-state="savedState"
        :copy-state="copyState"
        :menu-items="headerMenuItems"
        @toggle-like="toggleLike"
        @share="shareQuote"
        @add-to-collection="addToCollection"
        @copy-link="copyLink"
      />
    </ClientOnly>

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

    <div v-else-if="quote" class="mt-16 px-8 py-16 animate-fade-in animate-duration-700 animate-ease-out">
      <div class="max-w-4xl mx-auto">
        <!-- Main Quote Section -->
        <div class="text-center mb-16">
          <div class="relative mb-12">
            <blockquote class="font-serif text-4xl sm:text-4xl lg:text-5xl xl:text-6xl md:font-600 leading-tight text-gray-900 dark:text-white mb-8 md:px-4">
              {{ quote.name }}
            </blockquote>

            <!-- Decorative Elements -->
            <div class="absolute -top-4 -left-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
            <div class="absolute -bottom-4 -right-4 text-6xl text-gray-200 dark:text-gray-700 font-serif">"</div>
          </div>

          <MobileQuoteAuthorReference :quote="quote" v-if="isMobile" />
          <QuoteAuthorReference :quote="quote" v-else />

          <div v-if="isMobile">
            <ClientOnly>
              <MobileQuoteActionBar
                class="animate-fade-in animate-duration-500 animate-delay-150"
                :is-liked="isLiked"
                :like-pending="likePending"
                :share-pending="sharePending"
                :saved-state="savedState"
                :likes-count="quote.likes_count || 0"
                :can-interact="!!user"
                @toggle-like="toggleLike"
                @save="addToCollection"
                @share="shareQuote"
                @copy-link="copyLink"
                @copy-text="copyQuoteText"
                @download-image="downloadQuote"
              />
            </ClientOnly>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="quote.tags?.length" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 animate-fade-in animate-duration-500 animate-delay-200">
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

      <QuoteMetadata :quote="quote" class="flex flex-col items-center md:mx-auto" />
      <RelatedQuotes :quote="quote" :related-quotes="relatedQuotes" class="mt-16 animate-fade-in animate-duration-500 animate-delay-300" />
    </div>

    <!-- Error State -->
    <div v-else class="px-8 py-16 animate-fade-in animate-duration-500">
      <div class="max-w-4xl mx-auto text-center">
        <NIcon name="i-ph-warning" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-3xl font-serif font-semibold text-gray-900 dark:text-white mb-4">Quote Not Found</h2>
        <p class="text-lg font-sans text-gray-600 dark:text-gray-400 mb-8">
          The quote you're looking for doesn't exist or has been removed.
        </p>
        <NButton to="/" size="lg" class="font-sans">Browse Quotes</NButton>
      </div>
    </div>
  </div>

  <ClientOnly>
    <AddToCollectionModal
      v-if="quote"
      v-model="showAddToCollectionModal"
      :quote="quote"
      @added="onAddedToCollection"
    />
  </ClientOnly>

  <ClientOnly>
    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :editQuote="quote"
      @quote-updated="onQuoteUpdated"
    />
  </ClientOnly>

  <ClientOnly>
    <DeleteQuoteDialog
      v-if="quote"
      v-model="showDeleteQuoteDialog"
      :quote="quote"
      @quote-deleted="onQuoteDeleted"
    />
  </ClientOnly>

  <ClientOnly>
    <EditQuoteTagsDialog
      v-if="quote"
      v-model="showEditTagsDialog"
      :quote-id="quote.id"
      @tags-updated="onTagsUpdated"
    />
  </ClientOnly>

  <ClientOnly>
    <ReportDialog
      v-if="quote"
      v-model="showReportDialog"
      targetType="quote"
      :targetId="quote.id"
    />
  </ClientOnly>

  <!-- Download Image Modal / Drawer -->
  <ClientOnly>
    <DownloadQuoteDialog
      v-if="quote && !isMobile"
      v-model="showDownloadDialog"
      :quote="quote"
      @downloaded="onDownloadedImage"
    />
    <DownloadQuoteDrawer
      v-if="quote && isMobile"
      :open="showDownloadDrawer"
      :quote="quote"
      @update:open="onDownloadDrawerOpenChange"
      @downloaded="onDownloadedImage"
    />
  </ClientOnly>
</template>

<script setup>
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const route = useRoute()
const { user } = useUserSession()
const copyState = ref('idle')

// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const { data: quoteData, pending } = await useFetch(`/api/quotes/${route.params.id}`)
const quote = computed(() => quoteData.value?.data)

const { data: relatedData } = await useFetch(`/api/quotes/${route.params.id}/related`)
const relatedQuotes = computed(() => relatedData.value?.data || [])

useVerbatimsSeo(() => {
  const currentQuote = quote.value

  if (!currentQuote) {
    return {
      title: 'Quote - Verbatims',
      description: 'Explore curated quotes, authors, and references on Verbatims.',
      type: 'article'
    }
  }

  const trimmedQuote = currentQuote.name.length > 160
    ? `${currentQuote.name.slice(0, 157)}…`
    : currentQuote.name

  const headerTitle = currentQuote.name.length > 70
    ? `${currentQuote.name.slice(0, 67)}…`
    : currentQuote.name

  const metaDescriptionParts = [trimmedQuote]
  if (currentQuote.author?.name) {
    metaDescriptionParts.push(`— ${currentQuote.author.name}`)
  }
  if (currentQuote.reference?.name) {
    metaDescriptionParts.push(`(${currentQuote.reference.name})`)
  }

  return {
    title: `"${headerTitle}" — Verbatims`,
    description: metaDescriptionParts.join(' '),
    imagePath: `/api/og/quotes/${currentQuote.id}.png`,
    imageAlt: currentQuote.author?.name
      ? `Quote by ${currentQuote.author.name}`
      : 'Quote shared from Verbatims',
    type: 'article'
  }
})

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
const savedState = ref('idle') // 'idle' | 'saved'
let savedTimeoutId


const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showEditTagsDialog = ref(false)

// Global keyboard shortcut: Ctrl/Cmd + E to edit (admin/moderator only)
const handleGlobalKeydown = (e) => {
  // Only react to Ctrl/Cmd + E
  if (!(e && (e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E'))) return

  // Ignore when typing in inputs, textareas, selects, or contenteditable elements
  const target = e.target
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag)
  if (isEditable) return

  const role = user.value?.role
  const isAdminMod = role === 'admin' || role === 'moderator'
  const isOwnerDraft = quote.value && user.value && quote.value.user?.id === user.value.id && quote.value.status === 'draft'
  if (quote.value && (isAdminMod || isOwnerDraft)) {
    e.preventDefault()
    showEditQuoteDialog.value = true
  }
}

const onQuoteUpdated = async () => {
  try {
    // Refresh main quote and related quotes after edit
    const fresh = await $fetch(`/api/quotes/${route.params.id}`)
    quoteData.value = fresh
    const freshRelated = await $fetch(`/api/quotes/${route.params.id}/related`)
    relatedData.value = freshRelated

  } catch (error) {
    console.error('Failed to refresh quote after update:', error)
    useToast().toast({ title: 'Update failed', description: 'Could not refresh quote.' })
  } finally {
    showEditQuoteDialog.value = false
  }
}

const onQuoteDeleted = async () => {
  await navigateTo('/')
}

const onTagsUpdated = async () => {
  try {
    const fresh = await $fetch(`/api/quotes/${route.params.id}`)
    quoteData.value = fresh
  } catch (e) {
    console.error('Failed to refresh quote after tags update', e)
  }
}

const headerMenuItems = computed(() => {
  const items = []

  const isAdminMod = user.value && (user.value.role === 'admin' || user.value.role === 'moderator')
  const isOwnerDraft = user.value && quote.value && quote.value.user && quote.value.user.id === user.value.id && quote.value.status === 'draft'
  if (isAdminMod || isOwnerDraft) {
    items.push({
      label: 'Edit',
      leading: 'i-ph-pencil-simple',
      onclick: () => { showEditQuoteDialog.value = true }
    })
    items.push({
      label: 'Edit tag',
      leading: 'i-ph-tag',
      onclick: () => { showEditTagsDialog.value = true }
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

  try {
    const shareData = {
      title: 'Quote from Verbatims',
      text: `"${quote.value.name}" ${quote.value.author ? `- ${quote.value.author.name}` : ''}`,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
    }

    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
    useToast().toast({
      title: 'Failed to share quote',
      description: 'Please try again.',
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

const showDownloadDialog = ref(false)
const showDownloadDrawer = ref(false)

const downloadQuote = () => {
  if (!quote.value) return
  isMobile.value 
    ? showDownloadDrawer.value = true
    : showDownloadDialog.value = true
}

const onDownloadedImage = () => {
  // toast({ title: 'Image downloaded', variant: 'success' })
}

const onDownloadDrawerOpenChange = (v) => { showDownloadDrawer.value = v }

const showReportDialog = ref(false)
const reportQuote = () => { showReportDialog.value = true }

const copyQuoteText = async () => {
  if (!quote.value) return
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('clipboard-unavailable')
    }
    
    const authorName = quote.value.author?.name ? ` — ${quote.value.author.name}` : ''
    const referenceName = quote.value.reference?.name ? ` (${quote.value.reference.name})` : ''
    await navigator.clipboard.writeText(`"${quote.value.name}"${authorName}${referenceName}`)
  } catch (error) {
    useToast().toast({
      title: 'Copy failed',
      description: 'Clipboard is not available.', variant: 'error',
    })
  }
}

const copyLink = async () => {
  try {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) throw new Error('no-url')
    await navigator.clipboard.writeText(url)
    
    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    useToast().toast({ title: 'Copy failed', description: 'Could not copy the link.' })
  }
}

// Delay layout switch until Nuxt is fully hydrated to avoid hydration mismatch
const hydrated = ref(false)

onMounted(() => {
  if (user.value && quote.value) {
    checkLikeStatus()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
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
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
