<template>
  <div class="homepage-v3-desktop">
    <!-- Single-column editorial layout -->
    <div class="mx-auto w-full max-w-[1440px] px-4 lg:px-8">
      <!-- Center content -->
      <div class="w-full">
        <!-- Featured quote (Philosophy section) -->
        <div class="homepage-v3-cover mb-4 rounded-2xl px-6 py-16 lg:px-10 lg:py-24 shadow-sm" :class="{ 'homepage-v3-cover--with-image': props.theme?.image_url }" @mousemove="trackCoverPointer" @mouseleave="resetCoverPointer">
            <picture v-if="props.theme?.image_url" class="homepage-v3-cover-image">
              <img :src="props.theme.image_url" :alt="props.theme.image_alt || ''" class="homepage-v3-cover-image-content" />
            </picture>
            <div v-if="props.theme?.image_url" class="homepage-v3-cover-image-overlay" aria-hidden="true" />
            <template v-if="featuredQuote">
              <NuxtLink
                :to="`/quotes/${featuredQuote.id}`"
                class="homepage-v3-quote block group"
              >
                <h2 :class="['font-serif font-300 text-gray-900 dark:text-gray-100 leading-tight break-words wrap-anywhere mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors', coverQuoteClass(featuredQuote.name)]">
                  <template v-for="(part, index) in featuredQuoteParts" :key="`${index}-${part.text}`">
                    <span
                      v-if="part.isWord"
                      class="homepage-v3-quote-word"
                      :style="{ '--quote-word-index': part.wordIndex }"
                    >{{ part.text }}</span>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </h2>
              </NuxtLink>
              <div class="homepage-v3-author mt-8 flex flex-col items-center gap-2">
                <div v-if="featuredQuote.author" class="homepage-v3-author-content">
                  <NuxtLink :to="`/authors/${featuredQuote.author.id}`" class="homepage-v3-author-line flex flex-col items-center gap-1 group">
                    <div
                      v-if="featuredQuote.author?.image_url && !imageErrors[featuredQuote.author.id]"
                      class="homepage-v3-author-avatar w-6 h-6 rounded-full overflow-hidden grayscale"
                    >
                      <img :src="featuredQuote.author.image_url" :alt="featuredQuote.author.name" class="w-full h-full object-cover" @error="authorAvatarFailed(featuredQuote.author.id)" />
                    </div>
                    <div v-else class="homepage-v3-author-avatar w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <span class="font-serif text-xs text-gray-400 dark:text-gray-500">
                        {{ getAuthorInitials(featuredQuote.author?.name) }}
                      </span>
                    </div>
                    <p class="font-subtitle text-2xl font-600 text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                      {{ featuredQuote.author?.name || $t('home.unknown_author') }}
                    </p>
                  </NuxtLink>
                  <NuxtLink
                    v-if="featuredQuote.reference"
                    :to="`/references/${featuredQuote.reference.id}`"
                    class="homepage-v3-author-reference mt-1 block text-center font-sans text-xs font-500 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    {{ featuredQuote.reference?.name }}
                  </NuxtLink>
                </div>
                <template v-else>
                  <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span class="font-serif text-sm font-bold text-gray-600 dark:text-gray-400">
                      ?
                    </span>
                  </div>
                  <div>
                    <p class="font-serif text-sm font-600 text-gray-900 dark:text-gray-100">
                      {{ $t('home.unknown_author') }}
                    </p>
                  </div>
                </template>
              </div>
              <div
                v-if="props.theme?.image_url"
                class="homepage-v3-image-credit"
                :class="{ 'homepage-v3-image-credit--collapsed': !imageCreditExpanded }"
              >
                <NTooltip :content="String($t(imageCreditExpanded ? 'home.collapse_image_credit' : 'home.expand_image_credit'))">
                  <button
                    type="button"
                    class="homepage-v3-image-credit-toggle"
                    :aria-label="String($t(imageCreditExpanded ? 'home.collapse_image_credit' : 'home.expand_image_credit'))"
                    :aria-expanded="imageCreditExpanded"
                    @click.stop="imageCreditExpanded = !imageCreditExpanded"
                  >
                    <NIcon name="i-tabler-info-square-rounded" class="h-4 w-4" aria-hidden="true" />
                  </button>
                </NTooltip>
                <div class="homepage-v3-image-credit-content" :aria-hidden="!imageCreditExpanded" :inert="!imageCreditExpanded">
                  <template v-if="props.theme.image_credit">
                    <span>{{ $t('home.image_credit_prefix') }} </span>
                    <a v-if="props.theme.image_source_url" :href="props.theme.image_source_url" target="_blank" rel="noreferrer noopener">{{ props.theme.image_credit }}</a>
                    <span v-else>{{ props.theme.image_credit }}</span>
                    <span v-if="props.theme.image_license"> · {{ props.theme.image_license }}</span>
                  </template>
                  <button
                    v-if="props.theme.id"
                    type="button"
                    class="ml-2 inline-flex items-center gap-1 rounded-sm underline decoration-dotted underline-offset-2 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    @click.stop="showImageReportDialog = true"
                  >
                    <NIcon name="i-tabler-flag-3" class="h-3.5 w-3.5" aria-hidden="true" />
                    {{ $t('home.report_image') }}
                  </button>
                </div>
              </div>
            </template>
            <div v-else-if="feed.initialLoading.value" class="w-full max-w-[960px] space-y-5 animate-pulse" aria-hidden="true">
              <div class="mx-auto h-12 w-5/6 rounded bg-black/10 dark:bg-white/10 lg:h-16" />
              <div class="mx-auto h-12 w-2/3 rounded bg-black/10 dark:bg-white/10 lg:h-16" />
              <div class="mx-auto mt-10 h-6 w-48 rounded bg-black/10 dark:bg-white/10" />
              <div class="mx-auto h-3 w-28 rounded bg-black/10 dark:bg-white/10" />
            </div>
        </div>
        <div class="homepage-v3-cover-actions relative mx-4 mb-16 flex items-center justify-center gap-4">
            <a
              :href="hasScrolled ? '#top' : '#home-exploration'"
              :class="hasScrolled ? 'w-48' : 'w-44'"
              class="homepage-v3-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 font-sans text-xs font-600
               active:scale-99 transition-[width,colors,transform] duration-300"
              @click="handleExploreClick"
            >
              <span>{{ $t(hasScrolled ? 'home.back_to_cover' : 'home.explore_theme') }}</span>
              <NIcon :name="hasScrolled ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="ml-2 h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <div class="homepage-v3-actions mt-0 flex items-center gap-1 lg:absolute lg:right-0">
              <NTooltip :content="String($t('home.copy_quote'))">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-[colors,transform] hover:scale-105 active:scale-99 hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                  :aria-label="String($t('home.copy_quote'))"
                  @click="copyFeaturedQuote"
                >
                  <NIcon name="i-lucide-copy" class="h-4 w-4" />
                </button>
              </NTooltip>
              <NTooltip :content="String($t('home.share_quote'))">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-[colors,transform] hover:scale-105 active:scale-99 hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                  :aria-label="String($t('home.share_quote'))"
                  @click="shareFeaturedQuote"
                >
                  <NIcon name="i-lucide-share-2" class="h-4 w-4" />
                </button>
              </NTooltip>
            </div>
          </div>

        <section v-if="props.theme && !feed.initialLoading.value && !feed.quotes.value.length" class="mx-4 mb-24 border-t border-gray-200 py-10 dark:border-gray-800" aria-live="polite">
          <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100">{{ $t('home.theme_no_quotes_title') }}</h2>
          <p class="mt-3 max-w-xl font-sans text-base leading-relaxed text-gray-500 dark:text-gray-400">{{ $t('home.theme_no_quotes_description') }}</p>
        </section>

        <!-- Editorial introduction -->
        <section v-if="opinionQuotes.length" id="home-exploration" class="homepage-v3-editorial mx-4 mb-24 scroll-mt-24 pt-14">
          <p class="font-sans font-600 text-xs uppercase tracking-[0.2em] text-[#9B7A30]">
            {{ homeCopy.label }}
          </p>
          <div class="mt-8 mb-12 space-y-2">
            <h2 class="font-serif text-3xl leading-[0.98] tracking-[-0.025em] text-gray-900 dark:text-gray-100 lg:text-4xl">
              {{ homeCopy.title }}
            </h2>
            <p class="max-w-md font-sans text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {{ homeCopy.description }}
            </p>
          </div>
          <div
            v-if="opinionQuotes[0]"
            class="mt-14 block max-w-4xl group"
          >
            <NuxtLink :to="`/quotes/${opinionQuotes[0].id}`" class="block">
              <blockquote class="font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-gray-900 transition-colors hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300 lg:text-6xl">
              {{ opinionQuotes[0].name }}
              </blockquote>
            </NuxtLink>
            <p class="mt-4 flex flex-wrap gap-x-2 font-sans text-sm text-gray-500 dark:text-gray-400">
              <NuxtLink v-if="opinionQuotes[0].author" :to="`/authors/${opinionQuotes[0].author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ opinionQuotes[0].author.name }}</NuxtLink>
              <span v-if="opinionQuotes[0].author && opinionQuotes[0].reference" aria-hidden="true">·</span>
              <NuxtLink v-if="opinionQuotes[0].reference" :to="`/references/${opinionQuotes[0].reference.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ opinionQuotes[0].reference.name }}</NuxtLink>
            </p>
          </div>
          <div class="mt-16 grid gap-24 md:grid-cols-2">
            <div v-for="item in opinionQuotes.slice(1, 3)" :key="item.id" class="group min-w-0 border-t border-gray-200 pt-8 dark:border-gray-800">
              <NuxtLink :to="`/quotes/${item.id}`" class="block">
                <blockquote class="break-words font-serif text-2xl leading-[1.08] tracking-[-0.02em] text-gray-700 transition-colors group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-gray-100 lg:text-5xl wrap-anywhere">{{ item.name }}</blockquote>
              </NuxtLink>
              <p class="mt-2 flex flex-wrap gap-x-2 font-sans text-xs text-gray-500 dark:text-gray-400">
                <NuxtLink v-if="item.author" :to="`/authors/${item.author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.author.name }}</NuxtLink>
                <span v-if="item.author && item.reference" aria-hidden="true">·</span>
                <NuxtLink v-if="item.reference" :to="`/references/${item.reference.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.reference.name }}</NuxtLink>
              </p>
            </div>
          </div>
        </section>

        <!-- References section: the next editorial chapter after the introduction -->
        <section v-if="featuredReferences.length" class="homepage-v3-references rounded-2 mx-0 mb-14 px-6 py-16 lg:px-10">
          <div class="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 class="font-serif font-400 text-4xl leading-none tracking-[-0.035em] text-stone-700 dark:text-stone-300 lg:text-5xl">
                {{ $t('nav.references') }}
              </h2>
              <p class="max-w-md font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {{ homeCopy.referencesDescription }}
              </p>
            </div>
          </div>
          <div class="homepage-v3-reference-grid grid gap-4 lg:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]">
            <NuxtLink v-for="ref in featuredReferences.slice(0, 4)" :key="ref.id" :to="`/references/${ref.id}`" class="homepage-v3-reference-card group">
              <div v-if="ref.image_url && !referenceImageErrors[ref.id]" class="homepage-v3-reference-image absolute inset-0 bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" :style="{ backgroundImage: `url(${ref.image_url})` }" />
              <div v-else class="homepage-v3-reference-image absolute inset-0 bg-gradient-to-br from-[#8c8f8b] to-[#25282b] dark:from-[#62645f] dark:to-[#141518]" />
              <div class="homepage-v3-reference-overlay absolute inset-0" />
              <div class="relative mt-auto">
                <h3 class="font-subtitle text-xl font-600 leading-tight break-words wrap-anywhere text-white">{{ ref.name }}</h3>
                <p class="mt-2 font-sans text-xs font-600 text-white/70">{{ formatReferenceType(ref.primary_type) }}</p>
              </div>
            </NuxtLink>
          </div>
          <NuxtLink to="/references" class="mt-6 ml-auto block w-fit font-sans text-xs font-500 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            {{ $t('home.see_all') }} →
          </NuxtLink>
        </section>

        <!-- Rich quote exploration -->
        <section v-if="storyQuotes.length" class="homepage-v3-rich mx-4 mb-14">
          <div class="homepage-v3-rich-head flex items-baseline justify-between gap-5">
            <h2 class="font-serif font-500 text-4xl leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 lg:text-6xl">
              {{ homeCopy.richTitle }}
            </h2>
            <p class="max-w-sm font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {{ homeCopy.richDescription }}
            </p>
          </div>
          <div class="homepage-v3-rich-grid mt-12 grid md:grid-cols-3">
            <div v-for="item in storyQuotes.slice(0, 6)" :key="item.id" class="homepage-v3-rich-item group" @mousemove="trackRichItemPointer" @mouseleave="resetRichItemPointer">
              <NuxtLink :to="`/quotes/${item.id}`" class="block">
                <blockquote :class="['font-serif leading-[1.08] tracking-[-0.02em] text-gray-900 transition-colors group-hover:text-gray-500 dark:text-gray-100 dark:group-hover:text-gray-300', richQuoteClass(item.name)]">
                  {{ truncateQuote(item.name, 140) }}
                </blockquote>
              </NuxtLink>
              <p class="mt-4 flex flex-wrap gap-x-2 font-sans text-xs text-gray-500 dark:text-gray-400">
                <NuxtLink v-if="item.author" :to="`/authors/${item.author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.author.name }}</NuxtLink>
                <span v-else class="font-500">{{ $t('home.unknown') }}</span>
                <span v-if="item.reference" aria-hidden="true">·</span>
                <NuxtLink v-if="item.reference" :to="`/references/${item.reference.id}`" class="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100">{{ item.reference.name }}</NuxtLink>
              </p>
            </div>
          </div>
        </section>

        <!-- Authors section -->
        <section v-if="sidebarAuthors.length" class="homepage-v3-authors mb-14 rounded-2 px-6 py-26 lg:px-10">
          <div class="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 class="font-serif font-500 font-500 text-4xl leading-none tracking-[-0.035em] text-white lg:text-6xl">
                {{ $t('nav.authors') }}
              </h2>
              <p class="max-w-xl font-sans text-md leading-relaxed text-white/60">
                {{ homeCopy.authorsDescription }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button type="button" class="homepage-v3-carousel-control" :disabled="authorsAtStart" :aria-label="String($t('common.previous'))" @click="scrollAuthors(-1)">
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" />
              </button>
              <button type="button" class="homepage-v3-carousel-control" :disabled="authorsAtEnd" :aria-label="String($t('common.next'))" @click="scrollAuthors(1)">
                <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref="authorsCarousel" class="homepage-v3-author-grid flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" @scroll="updateAuthorsScrollState">
            <NuxtLink
              v-for="author in sidebarAuthors.slice(0, 6)"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="homepage-v3-author-card w-[min(78vw,280px)] shrink-0 snap-start group flex flex-col items-start gap-4 lg:w-[calc((100%-3rem)/4)]"
            >
              <div v-if="author.image_url && !imageErrors[author.id]" class="h-12 w-12 shrink-0 overflow-hidden rounded-full grayscale transition group-hover:grayscale-0">
                <img :src="author.image_url" :alt="author.name" class="h-full w-full object-cover" @error="authorAvatarFailed(author.id)" />
              </div>
              <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700">
                <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
              </div>
              <div class="min-w-0">
                <p :class="['font-subtitle font-600 leading-tight text-white transition-colors group-hover:text-white/70 break-words wrap-anywhere', authorNameClass(author.name)]">
                  {{ author.name || $t('home.unknown') }}
                </p>
                <p v-if="author.job" class="mt-1 truncate font-sans text-sm text-white/65">
                  {{ author.job }}
                </p>
                <p class="font-sans font-600 text-xs text-white/55">
                  {{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
                </p>
              </div>
            </NuxtLink>
          </div>
          <NuxtLink to="/authors" class="mt-6 ml-auto block w-fit font-sans text-xs font-500 text-white/65 transition-colors hover:text-white">
            {{ $t('home.see_all') }} →
          </NuxtLink>
        </section>

      </div>

    </div>

    <div v-if="!props.theme && feed.hasMore?.value" class="mt-12">
      <LoadMoreButton
        :idleText="$ts('home.load_more')"
        :loadingText="$ts('home.loading')"
        :isLoading="feed.loadingMore?.value || false"
        @load="feed.loadMore()"
      />
    </div>
  </div>

  <SearchBox v-model="showSearch" />

  <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote as any"
    @quote-updated="closeEditAfterUpdate" />

  <DeleteQuoteDialog v-model="showDeleteQuoteDialog" :quote="selectedQuote as any" @quote-deleted="onQuoteDeleted" />

  <ReportDialog v-model="showReportDialog" targetType="quote" :targetId="selectedQuote?.id" />
  <ReportDialog v-if="imageReportContext" v-model="showImageReportDialog" :image-report="imageReportContext" />
</template>

<script setup lang="ts">
import './home-v3.css'
import type { ProcessedQuoteResult } from '~~/server/types'
import type { UseHomeFeed } from '~/composables/useHomeFeed'

const { $t, $ts } = useI18n()
const { locale } = useI18nLocale()

interface Props {
  feed: UseHomeFeed
  stats?: { quotes: number; authors: number; references: number }
  theme?: {
    id: number
    slug: string
    name: string
    description: string | null
    image_url: string | null
    image_alt: string | null
    image_credit: string | null
    image_source_url: string | null
    image_license: string | null
    image_date: string | null
    image_location: string | null
    mobile_image_url: string | null
    mobile_image_alt: string | null
    mobile_image_credit: string | null
    mobile_image_source_url: string | null
    mobile_image_license: string | null
    mobile_image_date: string | null
    mobile_image_location: string | null
    config: Record<string, any> | null
    home_copy?: Record<string, string> | null
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => ({ quotes: 0, authors: 0, references: 0 }),
  theme: null
})

const homeCopy = computed(() => ({
  label: props.theme?.home_copy?.editorialLabel || $t('home.editorial_label'),
  title: props.theme?.home_copy?.editorialTitle || $t('home.editorial_title'),
  description: props.theme?.home_copy?.editorialDescription || $t('home.editorial_desc'),
  richTitle: props.theme?.home_copy?.richQuotesTitle || $t('home.rich_quotes_title'),
  richDescription: props.theme?.home_copy?.richQuotesDescription || $t('home.rich_quotes_desc'),
  authorsDescription: props.theme?.home_copy?.authorsDescription || $t('home.authors_section_desc'),
  referencesDescription: props.theme?.home_copy?.referencesDescription || $t('home.references_section_desc'),
}))

const showSearch = ref(false)
const hasScrolled = ref(false)
const imageCreditExpanded = ref(true)
const authorsCarousel = ref<HTMLElement | null>(null)
const authorsAtStart = ref(true)
const authorsAtEnd = ref(false)

const scrollAuthors = (direction: number) => {
  authorsCarousel.value?.scrollBy({ left: direction * authorsCarousel.value.clientWidth * 0.82, behavior: 'smooth' })
}

const updateAuthorsScrollState = () => {
  const carousel = authorsCarousel.value
  if (!carousel) return
  authorsAtStart.value = carousel.scrollLeft <= 1
  authorsAtEnd.value = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1
}

onMounted(updateAuthorsScrollState)
onMounted(() => {
  const updateScrollState = () => { hasScrolled.value = window.scrollY > 80 }
  updateScrollState()
  window.addEventListener('scroll', updateScrollState, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', updateScrollState))
})

const handleExploreClick = (event: MouseEvent) => {
  event.preventDefault()
  if (hasScrolled.value) window.scrollTo({ top: 0, behavior: 'smooth' })
  else document.querySelector('#home-exploration')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const selectedQuote = ref<ProcessedQuoteResult | null>(null)
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showReportDialog = ref(false)
const showImageReportDialog = ref(false)
const imageReportContext = computed(() => props.theme?.id
  ? { themeId: props.theme.id, imageVariant: 'desktop' as const }
  : null)

// Extract featured quote (first quote)
const featuredQuote = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes[0] || null
})

const featuredQuoteParts = computed(() => {
  const name = featuredQuote.value?.name
  if (!name) return []

  let wordIndex = 0
  return (name.match(/\s+|\S+/gu) || []).map((text) => {
    const isWord = /\S/u.test(text)
    const currentWordIndex = wordIndex
    if (isWord) wordIndex += 1
    return { text, isWord, wordIndex: currentWordIndex }
  })
})

const copyFeaturedQuote = async () => {
  if (!featuredQuote.value || !import.meta.client) return
  await navigator.clipboard?.writeText(`“${featuredQuote.value.name}” — ${featuredQuote.value.author?.name || $ts('home.unknown_author')}`)
}

const shareFeaturedQuote = async () => {
  if (!featuredQuote.value || !import.meta.client) return
  const url = `${window.location.origin}/quotes/${featuredQuote.value.id}`
  const text = `“${featuredQuote.value.name}” — ${featuredQuote.value.author?.name || $ts('home.unknown_author')}`
  if (navigator.share) {
    await navigator.share({ title: featuredQuote.value.name, text, url })
    return
  }
  await navigator.clipboard?.writeText(`${text}\n\n${url}`)
}

const referenceImageErrors = reactive<Record<number, boolean>>({})

// Extract opinion quotes (next 6 quotes after featured)
const opinionQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes.slice(1, 7)
})

// Extract story quotes (next 9 quotes after opinion)
const storyQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes.slice(7, 16)
})

// Extract featured references for the editorial references section
const featuredReferences = computed(() => {
  const refs = props.feed.references.value || []
  return refs
})

watch(featuredReferences, (refs) => {
  refs.forEach((ref) => {
    if (!ref.image_url || referenceImageErrors[ref.id]) return
    const img = new Image()
    img.onerror = () => {
      referenceImageErrors[ref.id] = true
    }
    img.src = ref.image_url
  })
}, { immediate: true })

// Extract top authors for sidebar (most liked)
const sidebarAuthors = computed(() => {
  const auths = props.feed.authors?.value || []
  return auths.slice(0, 8)
})

const truncateQuote = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const richQuoteClass = (text: string) => {
  if (text.length <= 32) return 'text-3xl lg:text-4xl'
  if (text.length <= 72) return 'text-2xl lg:text-3xl'
  return 'text-xl lg:text-2xl'
}

const trackRichItemPointer = (event: MouseEvent) => {
  const item = event.currentTarget as HTMLElement
  const rect = item.getBoundingClientRect()
  const threshold = Math.min(84, Math.max(40, Math.min(rect.width, rect.height) * 0.24))
  const intensity = (distance: number) => Math.max(0, Math.min(1, 1 - distance / threshold)) * 0.58
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  item.style.setProperty('--rich-edge-top', intensity(y).toFixed(3))
  item.style.setProperty('--rich-edge-right', intensity(rect.width - x).toFixed(3))
  item.style.setProperty('--rich-edge-bottom', intensity(rect.height - y).toFixed(3))
  item.style.setProperty('--rich-edge-left', intensity(x).toFixed(3))
  item.style.setProperty('--rich-edge-opacity', '1')
}

const resetRichItemPointer = (event: MouseEvent) => {
  const item = event.currentTarget as HTMLElement
  item.style.setProperty('--rich-edge-top', '0')
  item.style.setProperty('--rich-edge-right', '0')
  item.style.setProperty('--rich-edge-bottom', '0')
  item.style.setProperty('--rich-edge-left', '0')
  item.style.setProperty('--rich-edge-opacity', '0')
}

const coverQuoteClass = (text: string) => {
  if (text.length <= 70) return 'text-4xl md:text-6xl lg:text-[7rem]'
  if (text.length <= 130) return 'text-3xl md:text-5xl lg:text-6xl'
  if (text.length <= 210) return 'text-3xl md:text-4xl lg:text-5xl'
  if (text.length <= 300) return 'text-2xl md:text-3xl lg:text-4xl'
  return 'text-xl md:text-2xl lg:text-3xl'
}

const trackCoverPointer = (event: MouseEvent) => {
  const cover = event.currentTarget as HTMLElement
  const rect = cover.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const angle = 25 * Math.PI / 180
  const axisX = Math.cos(angle)
  const axisY = Math.sin(angle)
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const centerProjection = centerX * axisX + centerY * axisY
  const projection = x * axisX + y * axisY
  const snappedProjection = centerProjection + Math.round((projection - centerProjection) / 12) * 12
  cover.style.setProperty('--cover-stripe-x', `${centerX + (snappedProjection - centerProjection) * axisX}px`)
  cover.style.setProperty('--cover-stripe-y', `${centerY + (snappedProjection - centerProjection) * axisY}px`)
  cover.style.setProperty('--cover-stripe-highlight-opacity', '1')
}

const resetCoverPointer = (event: MouseEvent) => {
  const cover = event.currentTarget as HTMLElement
  cover.style.setProperty('--cover-stripe-highlight-opacity', '0')
}

const authorNameClass = (name: string) => {
  if (name.length <= 14) return 'text-3xl'
  if (name.length <= 24) return 'text-2xl'
  return 'text-xl'
}

const formatCompactCount = (count: number) => new Intl.NumberFormat(locale.value || 'en', {
  notation: 'compact',
  maximumFractionDigits: 1
}).format(count)

const formatReferenceType = (type: string) => {
  const t = $ts('reference_types.' + type)
  return t || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getAuthorInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

// Track images that failed to load so we show the initials fallback
const imageErrors = reactive<Record<number, boolean>>({})

const authorAvatarFailed = (id: number) => {
  imageErrors[id] = true
}

const openEdit = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const openDelete = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showDeleteQuoteDialog.value = true
}

const openReport = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showReportDialog.value = true
}

const closeEditAfterUpdate = async () => {
  showEditQuoteDialog.value = false

  try {
    if (!selectedQuote.value?.id) return
    const res = await $fetch<{ success: boolean; data: ProcessedQuoteResult }>(`/api/quotes/${selectedQuote.value.id}`)
    const updated = res.data
    if (updated) props.feed.updateQuoteInFeed(updated)
  } catch (e) {
    console.error('Failed to update quote:', e)
  }
}

const onQuoteDeleted = async () => {
  showDeleteQuoteDialog.value = false
  if (selectedQuote.value?.id) {
    props.feed.removeQuoteFromFeed(selectedQuote.value.id)
  }
}



</script>

<style scoped>
.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.grayscale:hover,
.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.03);
}
</style>
