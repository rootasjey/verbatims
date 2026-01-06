<template>
  <div class="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F5F5F5] to-[#F0F0F0] dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A]">
    <!-- Sticky Header (client-only to avoid SSR hydration mismatch due to teleports/popovers) -->
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

    <div v-if="pending" class="px-4 md:px-8 py-16 md:py-24">
      <div class="max-w-5xl mx-auto">
        <div class="animate-pulse space-y-8">
          <div class="text-center space-y-6">
            <div class="h-16 bg-white/40 dark:bg-gray-800/40 rounded-3xl w-3/4 mx-auto backdrop-blur-sm"></div>
            <div class="h-8 bg-white/40 dark:bg-gray-800/40 rounded-2xl w-1/2 mx-auto backdrop-blur-sm"></div>
            <div class="h-6 bg-white/40 dark:bg-gray-800/40 rounded-2xl w-1/3 mx-auto backdrop-blur-sm"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="h-32 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm"></div>
            <div class="h-32 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm"></div>
            <div class="h-32 bg-white/40 dark:bg-gray-800/40 rounded-3xl backdrop-blur-sm"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="quote" class="mt-12 md:mt-16 px-4 md:px-8 py-8 md:py-16 animate-fade-in animate-duration-700 animate-ease-out">
      <div class="max-w-5xl mx-auto space-y-8">
        <!-- Main Quote Card -->
        <div class="relative light:bg-white/60 dark:bg-[#0C0A09] md:dark:bg-transparent
          backdrop-blur-lg rounded-3xl p-8 md:p-12 lg:p-16 
          shadow-lg shadow-gray-200/50 dark:shadow-black/20 
          border md:border-none border-gray-200/40 dark:border-gray-800 transition-all duration-300"
        >
          <!-- Decorative gradient orb -->
          <div class="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-gray-200/20 via-gray-300/20 to-gray-200/20 dark:from-gray-700/10 dark:via-gray-600/10 dark:to-gray-700/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-gray-300/20 via-gray-200/20 to-gray-300/20 dark:from-gray-600/10 dark:via-gray-700/10 dark:to-gray-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-1">
            <!-- Quote Text -->
            <div class="text-center mt-4">
              <div class="relative mb-6">
                <blockquote class="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight text-gray-900 dark:text-white">
                  {{ quote.name }}
                </blockquote>

                <!-- Decorative quote marks -->
                <div class="absolute -top-6 -left-2 md:-left-6 text-7xl md:text-8xl text-gray-300/30 dark:text-gray-700/30 font-serif leading-none">"</div>
                <div class="absolute -bottom-6 -right-2 md:-right-6 text-7xl md:text-8xl text-gray-300/30 dark:text-gray-700/30 font-serif leading-none">"</div>
              </div>
            </div>

            <!-- Author & Reference -->
            <div class="text-center mb-8">
              <MobileQuoteAuthorReference :quote="quote" v-if="isMobile" />
              <QuoteAuthorReference :quote="quote" v-else />
            </div>
          </div>
        </div>

        <!-- Action Bar for Mobile -->
        <div v-if="isMobile" class="mt-8">
          <ClientOnly>
            <MobileQuoteActionBar
              class="animate-fade-in animate-duration-500 animate-delay-150"
              :is-liked="isLiked"
              :like-pending="likePending"
              :share-pending="sharePending"
              :saved-state="savedState"
              :like-count="quote.likes_count || 0"
              :share-count="quote.shares_count || 0"
              :view-count="quote.views_count || 0"
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

        <!-- Tags -->
        <div v-if="quote.tags?.length" class="animate-fade-in animate-duration-500 animate-delay-200">
          <div class="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-gray-200/40 dark:border-gray-700/40">
            <h3 class="text-base md:text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4 text-center">Topics</h3>
            <div class="flex flex-wrap justify-center gap-2.5">
              <NuxtLink
                v-for="tag in quote.tags"
                :key="tag.name"
                :to="`/tags/${encodeURIComponent(tag.name)}`"
                class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium font-sans transition-all hover:scale-105 bg-white/60 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              >
                <NIcon name="i-ph-tag" class="w-3.5 h-3.5 mr-1.5" />
                {{ tag.name }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Quote Metadata -->
        <div class="animate-fade-in animate-duration-500 animate-delay-250">
          <QuoteMetadata :quote="quote" class="flex flex-col items-center md:mx-auto" />
        </div>

        <!-- Related Quotes -->
        <RelatedQuotes :quote="quote" :related-quotes="relatedQuotes" class="animate-fade-in animate-duration-500 animate-delay-300" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="px-4 md:px-8 py-16 md:py-24 animate-fade-in animate-duration-500">
      <div class="max-w-2xl mx-auto">
        <div class="bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl p-12 md:p-16 text-center shadow-lg border border-gray-200/40 dark:border-gray-800/40">
          <div class="bg-gray-100 dark:bg-gray-800 w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-8 flex items-center justify-center">
            <NIcon name="i-ph-warning-circle" class="w-12 h-12 md:w-16 md:h-16 text-gray-500 dark:text-gray-400" />
          </div>
          <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">Quote Not Found</h2>
          <p class="text-lg font-sans text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            The quote you're looking for doesn't exist or has been removed.
          </p>
          <NButton to="/" size="lg" class="font-sans">
            Browse Quotes
          </NButton>
        </div>
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
