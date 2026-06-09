<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0C0A09]">
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
        @navigate-back="navigateToQuotesList"
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

    <div v-else-if="quote" class="px-4 md:px-8 py-8 md:py-16">
      <div class="max-w-5xl mx-auto space-y-8">
        <!-- Quote Hero -->
        <div class="py-20 md:py-32 relative overflow-hidden">
          <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px] opacity-80" />
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div class="relative px-4">
            <blockquote
              class="font-serif font-300 leading-tight text-gray-900 dark:text-white text-center transform-gpu transition-all duration-1000 ease-out"
              :class="[quoteTextSize, quoteTextIn ? 'opacity-100 blur-0' : 'opacity-0 blur-sm']">
              {{ quote.name }}
            </blockquote>
            <div class="mt-12 transform-gpu transition-all duration-700 ease-out"
              :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'">
              <MobileQuoteAuthorReference :quote="quote" v-if="isMobile" />
              <QuoteAuthorReference v-else :quote="quote" signature />
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
        <div v-if="quote.tags?.length"
          class="transform-gpu transition-all duration-700 ease-out"
          :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">
          <div class="flex flex-wrap justify-center gap-2.5">
              <NuxtLink
                v-for="tag in quote.tags"
                :key="tag.name"
                :to="`/tags/${encodeURIComponent(tag.name)}`"
                :style="{ '--tag-color': tag.color }"
                class="inline-flex items-center px-4 py-2 rounded-12 text-sm 
                  font-medium font-sans transition-all hover:scale-102 active:scale-99 
                  bg-white/60 dark:bg-gray-800/60 border border-gray-200/60 
                  dark:border-gray-700/60 text-gray-700 dark:text-gray-300 
                  tag-chip"
              >
                <span class="inline-block w-3.5 h-3.5 mr-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: tag.color }" aria-hidden="true"></span>
                {{ tag.name }}
              </NuxtLink>
          </div>
        </div>

        <!-- Quote Metadata -->
        <div
          class="transform-gpu transition-all duration-700 ease-out"
          :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">
          <QuoteMetadata :quote="quote" class="flex flex-col items-center md:mx-auto" />
        </div>

        <!-- Related Quotes -->
        <div
          class="transform-gpu transition-all duration-700 ease-out"
          :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">
          <RelatedQuotes :quote="quote" :related-quotes="relatedQuotes" />
        </div>
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
    <AddQuoteToCollectionModal
      v-if="quote"
      v-model="showAddQuoteToCollectionModal"
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
      :quote-text="quote.name"
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

<script setup>import { useJsonLd } from '../../composables/useSeo'
import { useQuotesFeedStore } from '~/stores/quotes'
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const route = useRoute()
const { user } = useUserSession()
const copyState = ref('idle')
const quotesFeedStore = useQuotesFeedStore()

// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const { data: quoteData, pending } = await useFetch(`/api/quotes/${route.params.id}`)
const quote = computed(() => quoteData.value?.data)

const quoteTextSize = computed(() => {
  const length = quote.value?.name?.length || 0
  if (length <= 60) return 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl'
  if (length <= 120) return 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl'
  if (length <= 200) return 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl'
  return 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl'
})

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

watchEffect(() => {
  const q = quote.value
  if (!q) return
  const { protocol, host } = useRequestURL()
  const site = `${protocol}//${host}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: q.name,
    description: q.name,
    image: `${site}/api/og/quotes/${q.id}.png`,
    author: { '@type': 'Person', name: q.author?.name || 'Unknown' },
    datePublished: q.created_at,
    url: `${site}/quotes/${q.id}`,
    publisher: { '@type': 'Organization', name: 'Verbatims', url: 'https://verbatims.cc' }
  }
  useJsonLd(jsonLd)
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

const quoteTextIn = ref(false)
const signatureIn = ref(false)

const triggerStagger = async () => {
  quoteTextIn.value = false
  signatureIn.value = false
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      quoteTextIn.value = true
    })
  })
}

watch(quoteTextIn, (val) => {
  if (val) {
    setTimeout(() => { signatureIn.value = true }, 400)
  }
})

const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showEditTagsDialog = ref(false)

// Global keyboard shortcuts (letters)
const handleGlobalKeydown = (e) => {
  if (!e || !quote.value) return

  // ignore interactive elements
  const target = e.target
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag)
  if (isEditable) return

  // ignore if modifier keys are pressed (to allow browser/default shortcuts)
  if (e.metaKey || e.altKey || e.ctrlKey) return

  const role = user.value?.role
  const isAdminMod = role === 'admin' || role === 'moderator'
  const key = e.key.toLowerCase()

  // handle single-letter shortcuts
  if (e.key === 'Escape') {
    e.preventDefault()
    navigateToQuotesList()
    return
  }

  switch (key) {
    case 'a':
      if (user.value) {
        e.preventDefault()
        showAddQuoteToCollectionModal.value = true
      }
      break
    case 'c':
      e.preventDefault()
      copyTextAndLink()
      break
    case 'd':
      if (isAdminMod) {
        e.preventDefault()
        showDeleteQuoteDialog.value = true
      }
      break
    case 'e':
      if (isAdminMod) {
        e.preventDefault()
        showEditQuoteDialog.value = true
      }
      break
    case 'i':
      e.preventDefault()
      downloadQuote()
      break
    case 'l':
      if (user.value) {
        e.preventDefault()
        toggleLike()
      }
      break
    case 'r':
      e.preventDefault()
      reportQuote()
      break
    case 's':
      e.preventDefault()
      shareQuote()
      break
    case 't':
      if (isAdminMod) {
        e.preventDefault()
        showEditTagsDialog.value = true
      }
      break
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
    useToast().toast({ title: 'Update failed', description: 'Could not refresh quote.', toast: 'soft-error' })
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
      // native share succeeded
      useToast().toast({ title: 'Quote shared!', toast: 'outline-success' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      // fallback copy succeeded
      useToast().toast({ title: 'Quote link copied', toast: 'outline-success' })
    }

    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
    useToast().toast({
      title: 'Failed to share quote',
      description: 'Please try again.',
      toast: 'soft-error',
    })
  } finally {
    sharePending.value = false
  }
}

const showAddQuoteToCollectionModal = ref(false)

const addToCollection = () => {
  showAddQuoteToCollectionModal.value = true
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
      description: 'Clipboard is not available.', toast: 'soft-error',
    })
  }
}

// copy both quote text and current URL link in one go
const copyTextAndLink = async () => {
  if (!quote.value) return
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('clipboard-unavailable')
    }

    const authorName = quote.value.author?.name ? ` — ${quote.value.author.name}` : ''
    const referenceName = quote.value.reference?.name ? ` (${quote.value.reference.name})` : ''
    const url = typeof window !== 'undefined' ? window.location.href : ''

    await navigator.clipboard.writeText(`"${quote.value.name}"${authorName}${referenceName}\n\n${url}`)

    copyState.value = 'copied'
    setTimeout(() => { copyState.value = 'idle' }, 2000)
  } catch (error) {
    useToast().toast({
      title: 'Copy failed',
      description: 'Clipboard is not available.', toast: 'soft-error',
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
    useToast().toast({ title: 'Copy failed', description: 'Could not copy the link.', toast: 'soft-error' })
  }
}

const navigateToQuotesList = async () => {
  const restorePath = quotesFeedStore.snapshot?.sourcePath || '/quotes'

  await navigateTo(restorePath)
}

// Delay layout switch until Nuxt is fully hydrated to avoid hydration mismatch
const hydrated = ref(false)

onMounted(() => {
  if (user.value && quote.value) {
    checkLikeStatus()
  }

  if (quote.value) {
    triggerStagger()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

watch(pending, (now, prev) => {
  if (prev && !now && quote.value) {
    triggerStagger()
  }
})

onBeforeRouteLeave((to) => {
  const restorePath = quotesFeedStore.snapshot?.sourcePath

  if (to.path.startsWith('/quotes/') || (restorePath && to.path === restorePath)) {
    return
  }

  if (!to.path.startsWith('/quotes')) {
    quotesFeedStore.clearRestoreRequest()
    quotesFeedStore.clearRestoreSnapshot()
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

<style scoped>
.tag-chip {
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
}
.tag-chip:hover {
  border-color: var(--tag-color);
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
}
.tag-chip:focus-visible {
  outline: 2px solid var(--tag-color);
  outline-offset: 2px;
}
</style>
