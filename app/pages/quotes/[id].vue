<template>
  <div class="quote-detail-page min-h-screen bg-[#F7F5EF] dark:bg-[#0C0A09]">
    <!-- Sticky Header (client-only to avoid SSR hydration mismatch due to teleports/popovers) -->
    <ClientOnly>
      <QuoteStickyHeader
        v-if="quote"
        class="animate-fade-in animate-duration-300 animate-ease-out"
        :quote="quote"
        :user="user || undefined"
        :is-liked="isLiked"
        :like-pending="likePending"
        :share-pending="sharePending"
        :saved-state="savedState"
        :visible="showQuoteContextBar"
        :copy-state="copyState"
        :menu-items="headerMenuItems"
        @toggle-like="toggleLike"
        @share="shareQuote"
        @add-to-collection="addToCollection"
        @copy-link="copyLink"
        @navigate-back="navigateToQuotesList"
      />
    </ClientOnly>

    <ClientOnly>
      <NDrawer
        v-model:open="showActionsDrawer"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-[#F7F5EF] dark:bg-[#1C1917] shadow-2xl', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
          <div v-if="quote" id="quote-actions-drawer" class="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <NButton
                  v-if="showActionDrawerMetadata"
                  icon
                  btn="ghost-gray"
                  label="i-ph-arrow-left"
                  size="sm"
                  :aria-label="String($t('components.quote_sticky.more'))"
                  @click="showActionDrawerMetadata = false"
                />
                <h2 class="truncate font-serif text-2xl text-gray-900 dark:text-gray-100">
                  {{ showActionDrawerMetadata ? $t('components.quote_sticky.metadata') : $ts('components.quote_sticky.more') }}
                </h2>
              </div>
              <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="showActionsDrawer = false" />
            </div>
            <Transition name="quote-drawer-content" mode="out-in">
              <QuoteMetadata v-if="showActionDrawerMetadata" :key="'metadata'" :quote="quote" :show-trigger="false" class="mt-5" />
              <div v-else key="'actions'" class="mt-4 space-y-1">
                <button
                  v-for="item in mobileHeaderMenuItems"
                  :key="item.id || item.label"
                  type="button"
                  class="flex min-h-14 w-full items-center gap-4 rounded-xl px-4 text-left font-sans text-base font-500 text-gray-800 transition-colors hover:bg-black/5 active:scale-[0.99] dark:text-gray-100 dark:hover:bg-white/8"
                  @click="handleMobileMenuItem(item)"
                >
                  <NIcon :name="item.leading" class="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </template>
      </NDrawer>
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

    <div v-else-if="quote" class="px-4 md:px-8 py-6 md:py-12">
      <div class="relative max-w-6xl mx-auto">
        <div
          v-if="quotePullActive"
          class="pointer-events-none absolute inset-x-0 top-10 z-20 flex justify-center md:hidden"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-2 font-sans text-[10px] font-600 uppercase tracking-[0.14em] text-stone-500/80 dark:text-stone-400/80">
            <NIcon name="i-ph-arrow-down" class="h-3.5 w-3.5 transition-transform duration-200" :class="quotePullReady ? 'rotate-180' : ''" aria-hidden="true" />
            <span>{{ quotePullHint }}</span>
          </div>
        </div>

        <!-- Quote Hero -->
        <div
          ref="quoteHero"
          class="quote-detail-hero mx-auto max-w-5xl rounded-[2rem] bg-[#EEECE5] px-5 dark:bg-[#17181D] md:rounded-none md:bg-transparent md:dark:bg-transparent"
          :class="[quoteHeroSpacing, quotePullActive ? 'relative z-10 transition-none' : 'transition-transform duration-300 ease-out motion-reduce:transition-none']"
          :style="quotePullStyle"
        >
          <div class="px-1 md:px-2">
            <blockquote
              class="mx-auto max-w-4xl font-serif font-300 leading-[0.98] tracking-[-0.04em] break-words wrap-anywhere text-gray-900 dark:text-white text-center transform-gpu transition-all duration-1000 ease-out"
              :class="[quoteTextSize, quoteTextIn ? 'opacity-100 blur-0' : 'opacity-0 blur-sm']"
              @touchstart.passive="handleQuoteTouchStart"
              @touchmove="handleQuoteTouchMove"
              @touchend.passive="handleQuoteTouchEnd"
              @touchcancel.passive="handleQuoteTouchCancel"
            >
              {{ quote.name }}
            </blockquote>
            <div class="mt-14 grid grid-cols-1 items-end gap-y-2 md:grid-cols-2 transform-gpu transition-all duration-700 ease-out"
              :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'">
              <button
                type="button"
                class="hidden min-h-11 items-center gap-2 px-1 font-sans text-xs font-600 uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100 md:col-start-1 md:row-start-1 md:inline-flex"
                @click="navigateToQuotesList"
              >
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
                <span>{{ $ts('components.quote_sticky.back') }}</span>
              </button>
              <div class="md:col-start-2 md:row-start-1">
                <MobileQuoteAuthorReference v-if="isMobile" :quote="quote" signature />
                <QuoteAuthorReference v-else :quote="quote" signature />
              </div>
            </div>
          </div>
        </div>

        <!-- Quiet actions -->
        <div class="mt-6 mb-2 flex flex-nowrap items-center justify-center gap-x-5 overflow-x-auto px-2 text-xs font-600 uppercase tracking-[0.12em] text-stone-500 scrollbar-none dark:text-stone-400 md:mt-18 md:overflow-visible" :class="quotePullActive ? 'transition-none' : 'transition-opacity duration-200 ease-out'" :style="quotePullControlsStyle">
          <button v-if="user" type="button" :aria-label="isLiked ? $ts('components.mobile_actions.unlike') : $ts('components.mobile_actions.like')" class="quote-action inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center transition-colors hover:text-stone-900 dark:hover:text-stone-100 md:min-h-0 md:min-w-0" @click="toggleLike">
            <NIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" class="h-4 w-4 md:hidden" />
            <span class="hidden md:inline">{{ isLiked ? $ts('components.mobile_actions.unlike') : $ts('components.mobile_actions.like') }}</span>
          </button>
          <button type="button" :aria-label="$ts('components.quote_actions.share')" class="quote-action inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center transition-colors hover:text-stone-900 dark:hover:text-stone-100 md:min-h-0 md:min-w-0" @click="shareQuote">
            <NIcon name="i-lucide-share" class="h-4 w-4 md:hidden" />
            <span class="hidden md:inline">{{ $ts('components.quote_actions.share') }}</span>
          </button>
          <button type="button" :aria-label="$ts('components.quote_actions.download_image')" class="quote-action inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center transition-colors hover:text-stone-900 dark:hover:text-stone-100 md:min-h-0 md:min-w-0" @click="downloadQuote">
            <NIcon name="i-lucide-download" class="h-4 w-4 md:hidden" />
            <span class="hidden md:inline">{{ $ts('components.quote_actions.download_image') }}</span>
          </button>
          <button
            type="button"
            :aria-label="$ts('components.quote_sticky.more')"
            aria-haspopup="dialog"
            :aria-expanded="showActionsDrawer"
            aria-controls="quote-actions-drawer"
            class="quote-action inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center transition-colors hover:text-stone-900 dark:hover:text-stone-100 md:hidden"
            @click="openMobileActionsDrawer"
          >
            <NIcon name="i-lucide-ellipsis" class="h-4 w-4" aria-hidden="true" />
          </button>
          <NDropdownMenu :items="headerMenuItems" :modal="false" :_dropdown-menu-content="{ side: 'bottom', align: 'center' }" class="hidden font-sans md:block">
            <button type="button" :aria-label="$ts('components.quote_sticky.more')" class="quote-action hidden min-h-11 min-w-11 shrink-0 items-center justify-center transition-colors hover:text-stone-900 dark:hover:text-stone-100 md:inline-flex md:min-h-0 md:min-w-0">
              <span>{{ $ts('components.quote_sticky.more') }}</span>
            </button>
          </NDropdownMenu>
        </div>

        <!-- Tags -->
        <div v-if="quote.tags?.length"
          class="mt-3"
          :class="[
            signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            quotePullActive ? 'transition-none' : 'transition-opacity duration-200 ease-out'
          ]"
          :style="quotePullControlsStyle">
          <div class="flex flex-nowrap justify-center gap-x-5 overflow-x-auto pb-2 scrollbar-none md:flex-wrap md:overflow-visible md:pb-8">
              <NuxtLink
                v-for="tag in quote.tags"
                :key="tag.name"
                :to="`/tags/${encodeURIComponent(tag.name)}`"
                :style="{ '--tag-color': tag.color || '' }"
                class="inline-flex shrink-0 items-center py-1 text-xs font-600 font-sans uppercase tracking-[0.12em] transition-colors text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 tag-chip"
              >
                <span class="inline-block w-1.5 h-1.5 mr-2 rounded-full flex-shrink-0" :style="{ backgroundColor: tag.color || '' }" aria-hidden="true"></span>
                {{ tag.name }}
              </NuxtLink>
          </div>
        </div>

        <!-- Quote Metadata (desktop) -->
        <div
          class="hidden md:block"
          :style="quotePullControlsStyle"
          :class="[
            signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            quotePullActive ? 'transition-none' : 'transition-all duration-700 ease-out'
          ]">
          <QuoteMetadata :quote="quote" class="flex flex-col items-center md:mx-auto" />
        </div>

        <!-- Related Quotes -->
        <div
          class="mt-20 transform-gpu transition-all duration-700 ease-out"
          :class="signatureIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">
          <RelatedQuotes :quote="quote" :related-quotes="relatedQuotes" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="px-6 py-20 md:py-32 animate-fade-in animate-duration-500">
      <div class="max-w-3xl mx-auto text-center">
        <div class="flex items-center gap-3 mb-10">
          <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Erratum</span>
          <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <p class="font-sans text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500 mb-5">404 · Archives</p>
        <h2 class="font-serif text-4xl md:text-6xl font-300 text-gray-900 dark:text-gray-100 leading-tight text-balance">
          {{ $ts('quote_detail_not_found_title') }}
        </h2>
        <p class="max-w-xl mx-auto mt-5 font-sans text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          {{ $ts('quote_detail_not_found_desc') }}
        </p>
        <div class="flex flex-wrap justify-center items-center gap-x-5 gap-y-3 mt-10">
          <HomeNavLink to="/" class="px-4 py-1">{{ $ts('quote_detail_browse') }}</HomeNavLink>
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <HomeNavLink to="/quotes" class="px-4 py-1">{{ $ts('home.nav.quotes') }}</HomeNavLink>
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
      :category="reportCategory"
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

<script setup lang="ts">
import { useJsonLd } from '../../composables/useSeo'
import { useQuotesFeedStore } from '~/stores/quotes'
import type { QuoteWithRelations } from '~/../shared/types/quote'
import type { CollectionWithStats } from '~/../shared/types/user-interactions'
const { $t, $ts } = useI18n()
const { isMobile } = useMobileDetection()
const route = useRoute()
const router = useRouter()
const { user } = useUserSession()
const copyState = ref('idle')
const quotesFeedStore = useQuotesFeedStore()

// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const { data: quoteData, pending } = await useFetch<{ data?: QuoteWithRelations }>(`/api/quotes/${route.params.id}`)
const quote = computed(() => quoteData.value?.data)
const quoteHero = ref(null)
const showQuoteContextBar = ref(false)
const showActionsDrawer = ref(false)
const showActionDrawerMetadata = ref(false)
const quotePullDistance = ref(0)
const quotePullActive = ref(false)
const quotePullThreshold = 96
const quotePullFadeDistance = 72
const quotePullProgress = computed(() => Math.min(quotePullDistance.value / quotePullFadeDistance, 1))
const quotePullReady = computed(() => quotePullDistance.value >= quotePullThreshold)
const quotePullHint = computed(() => $ts(
  quotePullReady.value
    ? 'components.quote_sticky.release_to_go_back'
    : 'components.quote_sticky.pull_to_go_back'
))
const quotePullStyle = computed(() => ({
  transform: quotePullDistance.value > 0 ? `translate3d(0, ${quotePullDistance.value}px, 0)` : undefined
}))
const quotePullControlsStyle = computed(() => ({
  opacity: 1 - quotePullProgress.value,
  translate: `0 ${quotePullProgress.value * 8}px`,
  pointerEvents: quotePullActive.value ? 'none' as const : 'auto' as const
}))

interface QuotePullGesture {
  startX: number
  startY: number
  startedAtTop: boolean
}

let quotePullGesture: QuotePullGesture | null = null

const handleQuoteTouchStart = (event: TouchEvent) => {
  if (!isMobile.value || event.touches.length !== 1 || typeof window === 'undefined') {
    quotePullGesture = null
    return
  }

  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, input, textarea, select, [contenteditable="true"]')) {
    quotePullGesture = null
    return
  }

  const touch = event.touches[0]
  if (!touch) return

  quotePullGesture = {
    startX: touch.clientX,
    startY: touch.clientY,
    startedAtTop: window.scrollY <= 1
  }
}

const handleQuoteTouchMove = (event: TouchEvent) => {
  const gesture = quotePullGesture
  const touch = event.touches[0]
  if (!gesture || !gesture.startedAtTop || !touch) return
  if (event.touches.length !== 1) {
    resetQuotePull()
    return
  }

  const deltaX = touch.clientX - gesture.startX
  const deltaY = touch.clientY - gesture.startY

  if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
    quotePullGesture = null
    return
  }

  if (deltaY < 8 || deltaY < Math.abs(deltaX)) return

  if (event.cancelable) event.preventDefault()
  quotePullActive.value = true
  quotePullDistance.value = Math.min(deltaY, 128)
}

const resetQuotePull = () => {
  quotePullGesture = null
  quotePullActive.value = false
  quotePullDistance.value = 0
}

const handleQuoteTouchEnd = async () => {
  const shouldGoBack = quotePullActive.value && quotePullDistance.value >= quotePullThreshold
  quotePullGesture = null

  if (shouldGoBack) {
    try {
      await navigateToQuotesList()
    } finally {
      resetQuotePull()
    }
  } else {
    resetQuotePull()
  }
}

const handleQuoteTouchCancel = () => {
  resetQuotePull()
}

const quoteTextSize = computed(() => {
  const length = quote.value?.name?.length || 0
  if (length <= 60) return 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl'
  if (length <= 120) return 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl'
  if (length <= 200) return 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl'
  return 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl'
})

const quoteHeroSpacing = computed(() => {
  const length = quote.value?.name?.length || 0
  if (length > 300) return 'py-8 md:py-14'
  if (length > 200) return 'py-10 md:py-18'
  return 'py-12 md:py-24'
})

onMounted(() => {
  if (!quoteHero.value || typeof IntersectionObserver === 'undefined') return
  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry) showQuoteContextBar.value = !entry.isIntersecting
  }, { threshold: 0.05 })
  observer.observe(quoteHero.value)
  onBeforeUnmount(() => observer.disconnect())
})

const { data: relatedData } = await useFetch<{ data?: RelatedQuote[] }>(`/api/quotes/${route.params.id}/related`)
const relatedQuotes = computed(() => relatedData.value?.data || [])

useVerbatimsSeo(() => {
  const currentQuote = quote.value

  if (!currentQuote) {
    return {
      title: $ts('quote_detail_meta_title_fallback'),
      description: $ts('quote_detail_meta_desc_fallback'),
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
    author: { '@type': 'Person', name: q.author?.name || $ts('quote_detail_jsonld_unknown') },
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
let savedTimeoutId: ReturnType<typeof setTimeout> | undefined

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
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!e || !quote.value) return

  // ignore interactive elements
  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toLowerCase?.()
  const isEditable = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tag || '')
  if (isEditable) return

  // ignore if modifier keys are pressed (to allow browser/default shortcuts)
  if (e.metaKey || e.altKey || e.ctrlKey) return

  const role = user.value?.role
  const isAdminMod = role === 'admin' || role === 'moderator'
  const isOwnerDraft = !!user.value
    && !!quote.value.user
    && quote.value.user.id === user.value.id
    && quote.value.status === 'draft'
  const canManageQuote = isAdminMod || isOwnerDraft
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
      if (canManageQuote) {
        e.preventDefault()
        showDeleteQuoteDialog.value = true
      }
      break
    case 'e':
      if (canManageQuote) {
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
      if (canManageQuote) {
        e.preventDefault()
        showEditTagsDialog.value = true
      }
      break
  }
}

const onQuoteUpdated = async () => {
  try {
    // Refresh main quote and related quotes after edit
    const fresh = await $fetch<{ data?: QuoteWithRelations }>(`/api/quotes/${route.params.id}`)
    quoteData.value = fresh
    const freshRelated = await $fetch<{ data?: RelatedQuote[] }>(`/api/quotes/${route.params.id}/related`)
    relatedData.value = freshRelated

  } catch (error) {
    console.error('Failed to refresh quote after update:', error)
    useErrorToast().showErrorToast(error, 'Update failed')
  } finally {
    showEditQuoteDialog.value = false
  }
}

const onQuoteDeleted = async () => {
  await navigateTo('/')
}

const onTagsUpdated = async () => {
  try {
    const fresh = await $fetch<{ data?: QuoteWithRelations }>(`/api/quotes/${route.params.id}`)
    quoteData.value = fresh
  } catch (e) {
    console.error('Failed to refresh quote after tags update', e)
  }
}

interface QuoteMenuItem {
  id?: string
  label: string
  leading: string
  shortcut?: string
  onclick: () => void
}

const headerMenuItems = computed<QuoteMenuItem[]>(() => {
  const items: QuoteMenuItem[] = []

  const isAdminMod = user.value && (user.value.role === 'admin' || user.value.role === 'moderator')
  const isOwnerDraft = user.value && quote.value && quote.value.user && quote.value.user.id === user.value.id && quote.value.status === 'draft'
  if (isAdminMod || isOwnerDraft) {
    items.push({
      label: $ts('quote_detail_menu_edit'),
      leading: 'i-lucide-pencil',
      shortcut: 'E',
      onclick: () => openDialogAfterMenuCloses(() => { showEditQuoteDialog.value = true })
    })
    items.push({
      label: $ts('quote_detail_menu_edit_tag'),
      leading: 'i-lucide-tag',
      shortcut: 'T',
      onclick: () => { showEditTagsDialog.value = true }
    })
    items.push({
      label: $ts('quote_detail_menu_delete'),
      leading: 'i-lucide-trash-2',
      shortcut: 'D',
      onclick: () => { showDeleteQuoteDialog.value = true }
    })
  }

  items.push(
    {
      label: $ts('quote_detail_menu_copy_link'),
      leading: 'i-lucide-link',
      onclick: () => copyLink()
    },
    {
      label: $ts('quote_detail_menu_copy_text'),
      leading: 'i-lucide-copy',
      onclick: () => copyQuoteText()
    },
    {
      label: $ts('quote_detail_menu_suggest_edit'),
      leading: 'i-lucide-pencil',
      onclick: () => openDialogAfterMenuCloses(() => suggestQuoteEdit())
    },
    {
      label: $ts('quote_detail_menu_report'),
      leading: 'i-lucide-flag',
      shortcut: 'R',
      onclick: () => openDialogAfterMenuCloses(() => reportQuote())
    }
  )

  if (user.value) {
    items.push({
      label: savedState.value === 'saved' ? 'Saved' : 'Save to collection',
      leading: 'i-ph-folder-plus',
      shortcut: 'A',
      onclick: () => addToCollection()
    })
  }

  return items
})

const mobileHeaderMenuItems = computed<QuoteMenuItem[]>(() => [
  {
    id: 'metadata',
    label: $ts('components.quote_sticky.metadata'),
    leading: 'i-ph-list-bullets',
    onclick: () => { showActionDrawerMetadata.value = true }
  },
  ...headerMenuItems.value
])

const openMobileActionsDrawer = () => {
  showActionDrawerMetadata.value = false
  showActionsDrawer.value = true
}

const handleMobileMenuItem = (item: QuoteMenuItem) => {
  if (item.id === 'metadata') {
    showActionDrawerMetadata.value = true
    return
  }

  showActionsDrawer.value = false
  item.onclick()
}

watch(showActionsDrawer, (isOpen) => {
  if (!isOpen) showActionDrawerMetadata.value = false
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
      title: $ts('quote_detail_share_title'),
      text: `"${quote.value.name}" ${quote.value.author ? `- ${quote.value.author.name}` : ''}`,
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(shareData)
      // native share succeeded
      useToast().toast({ title: $ts('quote_detail_toast_shared'), toast: 'outline-success' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      // fallback copy succeeded
      useToast().toast({ title: $ts('quote_detail_toast_link_copied'), toast: 'outline-success' })
    }

    // Track share
    await $fetch(`/api/quotes/${route.params.id}/share`, { method: 'POST' })
    quote.value.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
    useErrorToast().showErrorToast(error, $ts('quote_detail_toast_share_failed'))
  } finally {
    sharePending.value = false
  }
}

const showAddQuoteToCollectionModal = ref(false)

const addToCollection = () => {
  showAddQuoteToCollectionModal.value = true
}

const onAddedToCollection = (_collection: CollectionWithStats) => {
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

const onDownloadDrawerOpenChange = (v: boolean) => { showDownloadDrawer.value = v }

const showReportDialog = ref(false)
const reportCategory = ref<ReportCategory>('bug')
const openDialogAfterMenuCloses = (open: () => void) => {
  // The dropdown restores focus to its trigger after its exit transition. Wait
  // for that focus restoration before mounting a dialog, or it is dismissed as
  // an outside interaction.
  setTimeout(open, 250)
}

const reportQuote = () => {
  reportCategory.value = 'bug'
  showReportDialog.value = true
}
const suggestQuoteEdit = () => {
  reportCategory.value = 'content'
  showReportDialog.value = true
}

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
    useErrorToast().showErrorToast(error, $ts('quote_detail_toast_copy_failed'))
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
    useErrorToast().showErrorToast(error, $ts('quote_detail_toast_copy_failed'))
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
    useErrorToast().showErrorToast(error, $ts('quote_detail_toast_copy_failed'))
  }
}

const navigateToQuotesList = async () => {
  if (import.meta.client && window.history.state?.back) {
    await router.back()
    return
  }

  await navigateTo('/quotes')
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
.quote-action:focus-visible {
  outline: 2px solid #57534e;
  outline-offset: 4px;
}
.dark .quote-action:focus-visible {
  outline-color: #d6d3d1;
}
.quote-drawer-content-enter-active,
.quote-drawer-content-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
.quote-drawer-content-enter-from {
  opacity: 0;
  transform: translateX(6px);
}
.quote-drawer-content-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .quote-drawer-content-enter-active,
  .quote-drawer-content-leave-active {
    transition-duration: 1ms;
  }
}
</style>
