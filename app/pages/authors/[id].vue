<template>
  <div class="min-h-screen">
    <!-- Initial-only loading: render identically on SSR and during hydration -->
    <div v-if="!hydrated || !isLanguageReady || pending" class="grid min-h-[calc(100svh-3.5rem)] place-items-center px-4 md:min-h-screen">
      <LoadingWord
        :label="!hydrated
          ? String($t('common.loading'))
          : (!isLanguageReady ? String($t('common.initializing')) : String($t('author_detail_loading')))"
      />
    </div>

    <div v-else-if="author">
      <ClientOnly>
        <AuthorTopHeader
          :visible="showAuthorContextBar"
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

      <div class="grid grid-cols-1 gap-0">
        <!-- Content column -->
        <div ref="authorHero" class="lg:col-span-12 px-6 py-10 md:px-8 md:py-12 lg:px-16">
          <div class="mb-2 md:mb-8 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
                {{ $ts('author_detail_label') }}
              </span>
              <template v-if="author.job">
                <span class="text-gray-300 dark:text-gray-700" aria-hidden="true">/</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ author.job }}</span>
              </template>
              <template v-if="!author.is_fictional && (author.birth_year || author.birth_date || author.death_year || author.death_date)">
                <span class="text-gray-300 dark:text-gray-700" aria-hidden="true">/</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ formatLifeDates(author) }}</span>
              </template>
              <template v-if="author.birth_location">
                <span class="text-gray-300 dark:text-gray-700" aria-hidden="true">/</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">Born in {{ author.birth_location }}</span>
              </template>
              <template v-if="author.death_location && author.death_location !== author.birth_location">
                <span class="text-gray-300 dark:text-gray-700" aria-hidden="true">/</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">Died in {{ author.death_location }}</span>
              </template>
            </div>
          <div class="grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start md:gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <div>
              <h1
                class="max-w-5xl font-serif font-400 hyphens-auto break-words leading-[1.05] tracking-[-0.035em] mb-8 transform-gpu transition-all duration-700 ease-out"
                :class="[titleSizeClass, headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]']"
                :style="enterAnim(0)"
              >
                {{ author.name }}
              </h1>

              <div v-if="author.description"
                class="mb-8 transform-gpu transition-all duration-700 ease-out"
                :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
                :style="enterAnim(2)"
              >
                <p class="max-w-3xl font-serif text-lg font-400 leading-relaxed text-gray-700 dark:text-gray-300 md:text-xl">
                  {{ author.description }}
                </p>
              </div>

              <button
                v-if="author.description"
                type="button"
                class="mb-8 inline-flex min-h-11 items-center gap-2 px-1 font-sans text-xs font-600 uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100"
                @click="navigateBack"
              >
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
                <span>{{ $ts('components.quote_sticky.back') }}</span>
              </button>

              <div
                class="transform-gpu transition-all duration-700 ease-out"
                :class="headerIn ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'"
                :style="enterAnim(3)"
              >
                <ExternalLinksBadges :links="author.socials" :show-actions="canEditAuthorLinks">
                  <template #actions>
                    <NButton
                      v-if="canEditAuthorLinks"
                      btn="soft-gray"
                      size="sm"
                      type="button"
                      class="rounded-full bg-gray-100/80 px-3 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
                      @click="openEditLinks"
                    >
                      <NIcon name="i-ph-pencil-simple" class="h-3.5 w-3.5" />
                      {{ $ts('author_detail_edit_links') }}
                    </NButton>
                  </template>
                </ExternalLinksBadges>
                <button
                  v-if="!author.description"
                  type="button"
                  class="mt-8 inline-flex min-h-11 items-center gap-2 px-1 font-sans text-xs font-600 uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100"
                  @click="navigateBack"
                >
                  <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
                  <span>{{ $ts('components.quote_sticky.back') }}</span>
                </button>
              </div>
            </div>

            <div v-if="author.image_url" class="mx-auto w-full max-w-[14rem] md:sticky md:top-24 md:mt-2 md:max-w-none md:self-start lg:max-w-[20rem]">
              <button
                type="button"
                ref="avatarRef"
                class="group block w-full cursor-zoom-in text-left transition-transform duration-150 active:scale-99 motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100"
                :aria-label="$ts('components.dialogs.avatar_preview')"
                @click="openAvatarPreview"
                @contextmenu="openAvatarImageContextMenu"
              >
                <img
                  :src="author.image_url"
                  :alt="author.image_alt || author.name"
                  class="avatar-entrance aspect-square h-auto w-full rounded-2xl object-cover grayscale transition duration-500 group-hover:grayscale-0"
                  :class="headerIn ? 'scale-in' : 'scale-out'"
                >
              </button>
              <EntityImageAttribution
                :credit="author.image_credit"
                :source-url="author.image_source_url"
                :license="author.image_license"
                :date="author.image_date"
                :location="author.image_location"
                reportable
                :report-label="String($t('home.report_image'))"
                @report="showImageReportDialog = true"
              >
                <template #actions>
                  <NTooltip v-if="canEditAuthorLinks" :content="$ts('author_detail_edit_image')">
                    <NButton
                      type="button"
                      icon
                      btn="ghost-gray"
                      size="sm"
                      class="h-10 w-10 shrink-0 rounded-xl bg-gray-100/80 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
                      label="i-ph-pencil-simple-line"
                      :aria-label="$ts('author_detail_edit_image')"
                      @click="openEditAuthorImage"
                    />
                  </NTooltip>
                </template>
              </EntityImageAttribution>
            </div>
          </div>
        </div>

        <!-- Quotes  -->
        <div id="quotes" class="lg:col-span-12 mx-4 mb-14 mt-14 rounded-2 bg-[#eeece6] px-4 py-6 md:mx-6 md:px-8 lg:mx-16 lg:mt-20 lg:px-16 lg:py-16 dark:bg-[#1f1e1b]">
          <div class="mx-auto max-w-7xl">
            <div class="flex items-end justify-between gap-4">
              <div>
                <h2 class="font-serif text-4xl font-600 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-5xl">
                  {{ $ts('author_detail_quotes_heading') }}
                </h2>
                <p class="mt-1 max-w-md font-sans text-sm font-500 italic leading-relaxed text-gray-500 dark:text-gray-400">
                  {{ $ts('author_detail_quotes_description') }}
                </p>
                <div class="mt-2 mb-10 flex max-w-2xl flex-wrap items-center gap-x-5 gap-y-2 font-sans text-xs text-gray-500 dark:text-gray-400">
                  <div class="reference-sort-selector">
                    <NCombobox
                      v-model="sortBy"
                      :items="sortOptions"
                      by="value"
                      :_combobox-input="{ placeholder: $ts('author_detail_sort_placeholder') }"
                      :_combobox-list="{ class: '!w-max !min-w-48' }"
                      :_combobox-trigger="{
                        class: 'reference-sort-trigger !h-auto !min-h-0 !w-auto !max-w-max !border-0 !bg-transparent !p-0 !shadow-none !text-xs !font-500 !text-gray-500 dark:!text-gray-400',
                        block: false,
                        trailing: 'i-lucide-chevron-down'
                      }"
                    >
                      <template #trigger="{ modelValue }">
                        {{ modelValue?.label }}
                      </template>
                    </NCombobox>
                  </div>
                  <LanguageSelector compact @language-changed="onLanguageChange" />
                </div>
              </div>
            </div>

            <div class="mb-10 border-t border-stone-300/70 dark:border-stone-700/70" aria-hidden="true" />

            <div v-if="quotesLoading" class="space-y-4">
              <div v-for="i in 4" :key="i" class="animate-pulse">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                <div class="h-px bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>

            <div v-else-if="authorQuotes.length > 0" class="grid gap-y-8 md:grid-cols-2 md:gap-x-10 md:gap-y-10 lg:gap-x-16">
              <QuoteContextActions
                v-for="quote in authorQuotes"
                :key="quote.id"
                :quote="quote"
                v-slot="{ menuItems }"
                @edit="openRelatedQuoteEdit"
                @delete="openRelatedQuoteDelete"
                @report="openRelatedQuoteReport"
              >
                <div class="group pb-5">
                  <div v-if="quote.reference || quote.tags?.length" class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 md:mb-4">
                      <NuxtLink
                        v-if="quote.reference"
                        :to="`/references/${quote.reference.id}`"
                        class="transition-colors hover:text-gray-700 hover:underline hover:underline-offset-4 dark:hover:text-gray-300"
                      >
                        {{ quote.reference.name }}
                      </NuxtLink>
                      <QuoteTagDots :tags="quote.tags" />
                  </div>
                  <div class="relative">
                    <NLink :to="`/quotes/${quote.id}`" class="block group/quote">
                      <blockquote class="font-serif text-lg leading-relaxed text-gray-900 transition-colors group-hover/quote:text-gray-600 dark:text-gray-100 dark:group-hover/quote:text-gray-300 line-clamp-4 pr-10 md:pr-9 md:text-xl">
                        {{ quote.name }}
                      </blockquote>
                    </NLink>
                    <NDropdownMenu :items="menuItems" :modal="false">
                      <NButton
                        icon
                        btn="ghost-gray"
                        size="xs"
                        class="absolute bottom-0 right-0 z-1 h-10 w-10 rounded-full text-gray-500 opacity-100 transition-opacity motion-reduce:transition-none dark:text-gray-400 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                        label="i-ph-dots-three-vertical"
                        :aria-label="$t('components.quote_actions.quick_actions') as string"
                        @click.stop
                      />
                    </NDropdownMenu>
                  </div>
                </div>
              </QuoteContextActions>
            </div>

            <div v-else class="py-8 text-center">
              <template v-if="alternateQuotesLanguage">
                <p class="font-serif text-sm text-gray-400 dark:text-gray-500">
                  {{ $ts('author_detail_empty_language', { language: languageLabel(languageStore.currentLanguageValue) }) }}
                </p>
                <button
                  type="button"
                  class="mt-2 font-sans text-sm font-600 text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-500 dark:text-stone-300 dark:hover:text-white"
                  @click="switchQuotesLanguage(alternateQuotesLanguage)"
                >
                  {{ $ts('author_detail_view_language', { language: languageLabel(alternateQuotesLanguage) }) }}
                </button>
              </template>
              <p v-else class="font-serif text-sm text-gray-400 dark:text-gray-500">{{ $ts('author_detail_empty') }}</p>
            </div>

            <div v-if="hasMoreQuotes && !quotesLoading" class="mt-6 flex justify-center">
              <LoadMoreButton
                :idleText="$ts('author_detail_load_more')"
                :loadingText="$ts('author_detail_loading_more')"
                :isLoading="loadingMoreQuotes"
                @load="loadMoreQuotes"
              />
            </div>
          </div>
        </div>
      </div>

      <SimilarAuthors :authors="similarAuthors" />
    </div>

    <!-- Error State -->
    <EditorialNotFound
      v-else
      :title="$ts('author_detail_not_found_title')"
      :description="$ts('author_detail_not_found_desc')"
      :primary-label="$ts('author_detail_browse')"
      primary-to="/authors"
    />

    <ClientOnly>
      <AddAuthorDialog
        v-model="showEditAuthorDialog"
        :editAuthor="authorAsEditAuthor"
        :initial-tab="authorEditorInitialTab"
        @author-updated="onAuthorUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <EditLinksDialog
        v-if="author"
        v-model="showEditLinksDialog"
        entity-type="author"
        :entity-id="author.id"
        :links="author.socials"
        @saved="onLinksSaved"
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
      <AddQuoteDialog
        v-model="showRelatedQuoteEditDialog"
        :edit-quote="selectedRelatedQuote as QuoteWithRelations | null"
        @quote-updated="refreshRelatedQuotes"
      />
      <DeleteQuoteDialog
        v-model="showRelatedQuoteDeleteDialog"
        :quote="selectedRelatedQuote as QuoteWithMetadata | null"
        @quote-deleted="refreshRelatedQuotes"
      />
      <ReportDialog
        v-model="showRelatedQuoteReportDialog"
        targetType="quote"
        :targetId="selectedRelatedQuote?.id"
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
      <ReportDialog
        v-if="author && !isMobile"
        v-model="showImageReportDialog"
        :entity-image-report="{ targetType: 'author', targetId: author.id }"
      />
      <ReportDrawer
        v-else-if="author"
        v-model:open="showImageReportDialog"
        :entity-image-report="{ targetType: 'author', targetId: author.id }"
      />
    </ClientOnly>

    <ClientOnly>
      <ImagePreview
        v-model="avatarPreviewOpen"
        :src="author?.image_url || ''"
        :alt="author?.name || ''"
        :transition-origin="avatarRef"
        :closeOnScroll="true"
        :mask-closable="true"
      />
    </ClientOnly>

    <NDropdownMenu
      v-if="canEditAuthorLinks && avatarImageContextMenuPosition"
      :open="avatarImageContextMenuOpen"
      :items="avatarImageContextMenuItems"
      :modal="false"
      :_dropdown-menu-content="{ side: 'bottom', align: 'start', sideOffset: 4 }"
      @update:open="avatarImageContextMenuOpen = $event"
    >
      <span aria-hidden="true" class="fixed z-50 h-px w-px" :style="avatarImageContextMenuPosition" />
    </NDropdownMenu>
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
import { authorLifeDateFromFields, formatAuthorLifeSpan } from '#shared/utils/author-life-date'
import type { ComputedRef, Ref } from 'vue'
import type { QuoteWithRelations } from '~/types'

const { isMobile } = useMobileDetection()
// Use a stable initial layout for SSR/hydration; switch after Nuxt is ready on the client
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { user } = useUserSession()
const { $t, $ts } = useI18n()
const { locale } = useI18nLocale()

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
      title: $ts('author_detail_meta_title_fallback'),
      description: $ts('author_detail_meta_desc_fallback'),
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
const alternateQuotesLanguage = ref<string | null>(null)
const quotesLoading = ref<boolean>(false)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(true)
const currentQuotePage = ref<number>(1)
const sortOptions: SortOption[] = [
  { label: $ts('author_detail_sort_most_recent'), value: 'created_at' },
  { label: $ts('author_detail_sort_most_popular'), value: 'likes_count' },
  { label: $ts('author_detail_sort_most_viewed'), value: 'views_count' }
]

const sortBy = ref<SortOption>(sortOptions[0]!)
const mobileFiltersOpen = ref<boolean>(false)

const headerIn = ref(false)
const authorHero = ref<HTMLElement | null>(null)
const showAuthorContextBar = ref(false)

const isLiked = ref(false)
const likePending = ref(false)
const sharePending = ref(false)
const copyState = ref<'idle' | 'copying' | 'copied'>('idle')
const showEditAuthorDialog = ref(false)
const authorEditorInitialTab = ref<'profile' | 'image'>('profile')
const showDeleteAuthorDialog = ref(false)
const showEditLinksDialog = ref(false)
const similarAuthors = ref<any[]>([])

// Avatar preview state (opened when clicking the avatar)
const avatarPreviewOpen = ref(false)
const avatarRef = ref<any>(null)
const avatarImageContextMenuOpen = ref(false)
const avatarImageContextMenuPosition = ref<{ left: string; top: string } | null>(null)
const avatarImageContextMenuItems = computed(() => [{
  label: $ts('author_detail_edit_image'),
  leading: 'i-ph-pencil-simple-line',
  onclick: openAvatarImageContextMenuEdit
}])
let authorHeroObserver: IntersectionObserver | null = null

const observeAuthorHero = (hero: HTMLElement | null) => {
  authorHeroObserver?.disconnect()
  authorHeroObserver = null
  if (!hero || typeof IntersectionObserver === 'undefined') return

  authorHeroObserver = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry) showAuthorContextBar.value = !entry.isIntersecting
  }, { threshold: 0.05 })
  authorHeroObserver.observe(hero)
}

watch(authorHero, observeAuthorHero, { flush: 'post' })

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
        openAuthorEditor()
      }
      break
    case 'k':
      if (isAdminMod) {
        e.preventDefault()
        openEditLinks()
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
  if (len <= 20) return 'text-5xl md:text-7xl lg:text-8xl'
  if (len <= 40) return 'text-4xl md:text-6xl lg:text-7xl'
  if (len <= 60) return 'text-3xl md:text-5xl lg:text-6xl'
  return 'text-3xl md:text-4xl lg:text-5xl'
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
      label: $ts('author_detail_menu_edit'),
      leading: 'i-ph-pencil-simple',
      onclick: () => openAuthorEditor()
    })
    items.push({
      label: $ts('author_detail_menu_delete'),
      leading: 'i-ph-trash',
      onclick: () => { showDeleteAuthorDialog.value = true }
    })
  }

  items.push(
    {
      label: $ts('author_detail_menu_copy_link'),
      leading: 'i-ph-link',
      onclick: () => copyLink()
    },
    {
      label: $ts('author_detail_menu_share'),
      leading: 'i-ph-share-network',
      onclick: () => shareAuthor()
    },
    {
      label: $ts('author_detail_menu_report'),
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
    alternateQuotesLanguage.value = null
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
      if (!authorQuotes.value.length && languageStore.currentLanguageValue !== 'all') {
        try {
          const anyLanguageResponse = await $fetch<ApiResponse<Array<{ language?: string }>>>('/api/quotes', {
            query: {
              author_id: currentAuthor.id,
              page: 1,
              limit: 1,
              sort_by: sortBy.value.value,
              sort_order: 'DESC'
            }
          })
          const candidateLanguage = anyLanguageResponse?.data?.[0]?.language
          if (candidateLanguage && candidateLanguage !== languageStore.currentLanguageValue && languageStore.availableLanguages.some(language => language.value === candidateLanguage)) {
            alternateQuotesLanguage.value = candidateLanguage
          }
        } catch (error) {
          console.warn('Failed to check for quotes in other languages:', error)
        }
      }
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

const languageLabel = (code: string) => {
  if (!code) return ''
  return $ts(`languages.${code}`) || code.toUpperCase()
}

const switchQuotesLanguage = async (code: string) => {
  await languageStore.setLanguageByValue(code)
  await onLanguageChange()
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

const canEditAuthorLinks = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'moderator'
})

const openEditLinks = () => {
  showEditLinksDialog.value = true
}

const openEditAuthorImage = () => {
  if (!canEditAuthorLinks.value) return
  openAuthorEditor('image')
}

const openAuthorEditor = (initialTab: 'profile' | 'image' = 'profile') => {
  authorEditorInitialTab.value = initialTab
  showEditAuthorDialog.value = true
}

const openAvatarImageContextMenuEdit = () => {
  avatarImageContextMenuOpen.value = false
  avatarImageContextMenuPosition.value = null
  void nextTick(() => openEditAuthorImage())
}

const openAvatarImageContextMenu = (event: MouseEvent) => {
  if (!canEditAuthorLinks.value) return
  event.preventDefault()
  avatarImageContextMenuPosition.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`
  }
  avatarImageContextMenuOpen.value = true
}

const onLinksSaved = async () => {
  try {
    const fresh = await $fetch<ApiResponse<AuthorWithSocials>>(`/api/authors/${route.params.id}`)
    authorData.value = fresh
  } catch (error) {
    console.error('Failed to refresh author after links update:', error)
  } finally {
    showEditLinksDialog.value = false
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
      toast({ title: $ts('author_detail_toast_shared'), toast: 'outline-success' })
    } else {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable')
      }
      await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.url}`)
      toast({ title: $ts('author_detail_toast_link_copied'), toast: 'outline-success' })
    }

    // Optimistically increment local share count (no server endpoint yet)
    currentAuthor.shares_count = (currentAuthor.shares_count || 0) + 1
  } catch (error) {
    console.error('Failed to share author:', error)
    showErrorToast(error, $ts('author_detail_toast_share_failed'))
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
    useErrorToast().showErrorToast(error, $ts('author_detail_toast_copy_failed'))
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
    useErrorToast().showErrorToast(error, $ts('author_detail_toast_copy_failed'))
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
const showImageReportDialog = ref(false)
const selectedRelatedQuote = ref<QuoteWithMetadata | QuoteWithRelations | null>(null)
const showRelatedQuoteEditDialog = ref(false)
const showRelatedQuoteDeleteDialog = ref(false)
const showRelatedQuoteReportDialog = ref(false)

const openRelatedQuoteEdit = (quote: QuoteWithMetadata | QuoteWithRelations) => {
  selectedRelatedQuote.value = quote
  showRelatedQuoteEditDialog.value = true
}

const openRelatedQuoteDelete = (quote: QuoteWithMetadata | QuoteWithRelations) => {
  selectedRelatedQuote.value = quote
  showRelatedQuoteDeleteDialog.value = true
}

const openRelatedQuoteReport = (quote: QuoteWithMetadata | QuoteWithRelations) => {
  selectedRelatedQuote.value = quote
  showRelatedQuoteReportDialog.value = true
}

const refreshRelatedQuotes = async () => {
  showRelatedQuoteEditDialog.value = false
  showRelatedQuoteDeleteDialog.value = false
  await loadQuotes()
}

const formatLifeDates = (author: Pick<Author, 'birth_date' | 'birth_year' | 'birth_era' | 'birth_month' | 'birth_day' | 'birth_is_approximate' | 'birth_calendar' | 'death_date' | 'death_year' | 'death_era' | 'death_month' | 'death_day' | 'death_is_approximate' | 'death_calendar'>): string => {
  const birth = authorLifeDateFromFields({ year: author.birth_year, era: author.birth_era, month: author.birth_month, day: author.birth_day, approximate: author.birth_is_approximate, calendar: author.birth_calendar, legacy: author.birth_date })
  const death = authorLifeDateFromFields({ year: author.death_year, era: author.death_era, month: author.death_month, day: author.death_day, approximate: author.death_is_approximate, calendar: author.death_calendar, legacy: author.death_date })
  return formatAuthorLifeSpan(birth, death, locale.value ?? 'en')
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
    const similarRes = await $fetch(`/api/authors/${currentAuthor.id}/similar`, {
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
      const viewRes = await $fetch<{ data: { recorded: boolean } } | undefined>(`/api/authors/${route.params.id}/view`, { method: 'POST' })
      if (!viewRes?.data?.recorded) throw new Error('View not recorded')
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
  authorHeroObserver?.disconnect()
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

.reference-sort-selector {
  display: inline-block;
  width: max-content;
}

.reference-sort-selector :deep([data-slot='combobox-anchor']),
.reference-sort-selector :deep([data-slot='combobox-trigger']) {
  width: max-content !important;
  min-width: 0 !important;
}

.reference-sort-selector :deep(button),
.reference-sort-selector :deep([data-slot='combobox-trigger']),
.reference-sort-selector :deep(.reference-sort-trigger) {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

</style>
