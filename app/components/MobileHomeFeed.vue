<template>
  <div class="mobile-home-feed bg-[#F7F5EF] dark:bg-[#0C0A09]">
    <!-- ── Featured Quote ── -->
    <div class="homepage-v3-cover mx-4 mt-2 mb-4 rounded-2xl px-6 py-16 animate-fade-in-up shadow-sm" :class="{ 'homepage-v3-cover--with-image': props.theme?.image_url }" style="animation-delay: 0s">
        <picture v-if="props.theme?.image_url" class="homepage-v3-cover-image">
          <source v-if="props.theme.mobile_image_url" media="(max-width: 680px)" :srcset="props.theme.mobile_image_url" />
          <img :src="props.theme.image_url" :alt="props.theme.mobile_image_url ? (props.theme.mobile_image_alt || '') : (props.theme.image_alt || '')" class="homepage-v3-cover-image-content" />
        </picture>
        <div v-if="props.theme?.image_url" class="homepage-v3-cover-image-overlay" aria-hidden="true" />
        <div v-if="featuredQuote" class="homepage-v3-author-wrap mb-2">
          <div class="homepage-v3-author">
            <button
              type="button"
              :aria-label="`${$ts('home.nav.authors')}: ${quoteAuthor?.name || $ts('home.unknown_author')}`"
              @click="handleClickAuthor(quoteAuthor?.id)"
              class="homepage-v3-author-line flex flex-col items-center gap-1 cursor-pointer group text-center"
            >
              <div v-if="quoteAuthor?.image_url" class="homepage-v3-author-avatar w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 p-.5" :style="{ '--un-ring-color': `var(--theme-primary, #6b7280)` }">
                <img :src="quoteAuthor.image_url" :alt="quoteAuthor.name" class="w-full h-full grayscale object-cover rounded-full" />
              </div>
              <div v-else class="homepage-v3-author-avatar w-6 h-6 rounded-full ring-2 flex items-center justify-center flex-shrink-0" :style="{ '--un-ring-color': `var(--theme-primary, #6b7280)` }">
                <span class="font-serif text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(quoteAuthor?.name) }}</span>
              </div>
              <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ quoteAuthor?.name || $t('home.unknown_author') }}
              </p>
            </button>
            <NuxtLink
              v-if="featuredQuote?.reference"
              :to="`/references/${featuredQuote.reference.id}`"
              class="homepage-v3-author-reference mt-1 block text-center font-sans text-xs font-500 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 truncate"
            >
              {{ featuredQuote.reference?.name }}
            </NuxtLink>
          </div>
        </div>

        <NuxtLink
          v-if="featuredQuote"
          :to="`/quotes/${featuredQuote.id}`"
          class="homepage-v3-quote block group"
        >
          <blockquote :class="['font-serif font-300 text-gray-900 dark:text-gray-100 leading-tight break-words wrap-anywhere group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors', coverQuoteClass(featuredQuote.name)]">
            <template v-for="(part, index) in featuredQuoteParts" :key="`${index}-${part.text}`">
              <span
                v-if="part.isWord"
                class="homepage-v3-quote-word"
                :style="{ '--quote-word-index': part.wordIndex }"
              >{{ part.text }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </blockquote>
        </NuxtLink>
        <div v-else-if="feed.initialLoading?.value" class="w-full max-w-md space-y-3 text-center animate-pulse" aria-hidden="true">
          <div class="mx-auto h-7 w-11/12 rounded bg-black/10 dark:bg-white/10" />
          <div class="mx-auto h-7 w-10/12 rounded bg-black/10 dark:bg-white/10" />
          <div class="mx-auto h-7 w-8/12 rounded bg-black/10 dark:bg-white/10" />
          <div class="mx-auto mt-8 h-8 w-8 rounded-full bg-black/10 dark:bg-white/10" />
          <div class="mx-auto h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
          <div class="mx-auto h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
        </div>
        <div v-else-if="hasThemeWithoutQuotes" class="homepage-v3-cover-empty-state max-w-sm px-3" :class="props.theme?.image_url ? 'text-white' : 'text-gray-900 dark:text-gray-100'">
          <h2 class="font-serif text-2xl leading-tight drop-shadow-md">{{ $t('home.theme_no_quotes_title') }}</h2>
          <p class="mt-3 font-sans text-sm leading-relaxed drop-shadow-sm" :class="props.theme?.image_url ? 'text-white/85' : 'text-gray-500 dark:text-gray-400'">{{ $t('home.theme_no_quotes_description') }}</p>
        </div>
        <div
          v-if="props.theme?.image_url"
          class="homepage-v3-image-credit"
          :class="{ 'homepage-v3-image-credit--collapsed': !imageCreditExpanded }"
          @contextmenu.prevent="openImageCreditContextMenu"
        >
          <NTooltip :content="String($t(imageCreditExpanded ? 'home.collapse_image_credit' : 'home.expand_image_credit'))">
            <button
              type="button"
              class="homepage-v3-image-credit-toggle"
              :aria-label="String($t(imageCreditExpanded ? 'home.collapse_image_credit' : 'home.expand_image_credit'))"
              :aria-expanded="imageCreditExpanded"
              @click.stop="toggleImageCredit"
            >
              <NIcon name="i-tabler-info-circle" class="h-5 w-5" aria-hidden="true" />
            </button>
          </NTooltip>
          <div class="homepage-v3-image-credit-content" :aria-hidden="!imageCreditExpanded" :inert="!imageCreditExpanded">
            <template v-if="mobileImageAttribution?.credit">
              <span>{{ $t('home.image_credit_prefix') }} </span>
              <a v-if="mobileImageAttribution.sourceUrl" :href="mobileImageAttribution.sourceUrl" target="_blank" rel="noreferrer noopener">{{ mobileImageAttribution.credit }}</a>
              <span v-else>{{ mobileImageAttribution.credit }}</span>
              <span v-if="mobileImageAttribution.license"> · {{ mobileImageAttribution.license }}</span>
            </template>
            <button
              v-if="props.theme?.id"
              type="button"
              class="ml-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm underline decoration-dotted underline-offset-2 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              @click.stop="showImageReportDrawer = true"
            >
              <NIcon name="i-tabler-flag-3" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ $t('home.report_image') }}
            </button>
          </div>
        </div>
        <NDropdownMenu
          v-if="imageCreditContextMenuPosition"
          :open="imageCreditContextMenuOpen"
          :items="imageCreditContextMenuItems"
          :modal="false"
          :_dropdown-menu-content="{ side: 'bottom', align: 'start', sideOffset: 4 }"
          @update:open="imageCreditContextMenuOpen = $event"
        >
          <span aria-hidden="true" class="fixed z-50 h-px w-px" :style="imageCreditContextMenuPosition" />
        </NDropdownMenu>
      </div>
      <div class="homepage-v3-cover-actions mb-14 flex items-center justify-center gap-3">
        <button
          v-if="hasThemeWithoutQuotes"
          type="button"
          class="homepage-v3-primary inline-flex w-56 items-center justify-center rounded-full px-5 py-2.5 font-sans text-xs font-600 transition-[width,colors] duration-300"
          @click="showThemeLanguageDialog = true"
        >
          <span>{{ $t('home.view_available_languages') }}</span>
          <NIcon name="i-lucide-languages" class="ml-2 h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <a
          v-else
          :href="hasScrolled ? '#top' : '#home-exploration'"
          :class="hasScrolled ? 'w-48' : 'w-44'"
          class="homepage-v3-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 font-sans text-xs font-600 transition-[width,colors] duration-300"
          @click="handleExploreClick"
        >
          <span>{{ $t(hasScrolled ? 'home.back_to_cover' : 'home.explore_theme') }}</span>
          <NIcon :name="hasScrolled ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="ml-2 h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <div v-if="featuredQuote" class="homepage-v3-actions mt-0 flex items-center gap-1">
          <NTooltip :content="String($t('home.copy_quote'))">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
              :aria-label="String($t('home.copy_quote'))"
              @click="copyFeaturedQuote"
            >
              <NIcon name="i-lucide-copy" class="h-4 w-4" />
            </button>
          </NTooltip>
          <NTooltip :content="String($t('home.share_quote'))">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
              :aria-label="String($t('home.share_quote'))"
              @click="shareFeaturedQuote"
            >
              <NIcon name="i-lucide-share-2" class="h-4 w-4" />
            </button>
          </NTooltip>
        </div>
      </div>

    <!-- ── Editorial Introduction ── -->
    <section v-if="quotesList.length > 1" id="home-exploration" class="homepage-v3-editorial mb-16 px-6 py-14 scroll-mt-20">
      <p class="font-sans text-xs uppercase tracking-[0.2em] text-[#9B7A30]">{{ homeCopy.label }}</p>
      <h2 class="mt-5 font-serif text-2xl leading-[0.98] tracking-[-0.02em] text-gray-900 dark:text-gray-100">{{ homeCopy.title }}</h2>
      <p class="mt-5 max-w-xs font-sans text-base leading-relaxed text-gray-500 dark:text-gray-400">{{ homeCopy.description }}</p>
      <div class="mt-12 block group">
        <NuxtLink :to="`/quotes/${quotesList[1]!.id}`" class="block">
          <blockquote class="font-serif text-4xl leading-[0.98] tracking-[-0.035em] break-words wrap-anywhere text-gray-900 transition-colors group-hover:text-gray-500 dark:text-gray-100 dark:group-hover:text-gray-300">{{ quotesList[1]!.name }}</blockquote>
        </NuxtLink>
        <p class="mt-4 flex flex-wrap gap-x-2 font-sans text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink v-if="quotesList[1]!.author" :to="`/authors/${quotesList[1]!.author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ quotesList[1]!.author.name }}</NuxtLink>
          <span v-if="quotesList[1]!.author && quotesList[1]!.reference" aria-hidden="true">·</span>
          <NuxtLink v-if="quotesList[1]!.reference" :to="`/references/${quotesList[1]!.reference.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ quotesList[1]!.reference.name }}</NuxtLink>
        </p>
      </div>
      <div class="mt-10 space-y-8">
        <div v-for="item in quotesList.slice(2, 4)" :key="item.id" class="border-t border-gray-200 pt-4 dark:border-gray-800">
          <NuxtLink :to="`/quotes/${item.id}`" class="block">
            <blockquote class="font-serif text-xl italic leading-[1.1] tracking-[-0.015em] break-words wrap-anywhere text-gray-700 dark:text-gray-300">{{ item.name }}</blockquote>
          </NuxtLink>
          <p class="mt-2 flex flex-wrap gap-x-2 font-sans text-xs text-gray-500 dark:text-gray-400">
            <NuxtLink v-if="item.author" :to="`/authors/${item.author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.author.name }}</NuxtLink>
            <span v-if="item.author && item.reference" aria-hidden="true">·</span>
            <NuxtLink v-if="item.reference" :to="`/references/${item.reference.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.reference.name }}</NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <!-- ── Rich Quote Exploration ── -->
    <section v-if="quotesList.length > 4" class="homepage-v3-rich mx-6 py-14">
      <div class="homepage-v3-rich-head space-y-2">
        <h2 class="font-serif font-400 text-3xl leading-none tracking-[-0.03em] text-stone-700 dark:text-stone-300">
          {{ homeCopy.richTitle }}
        </h2>
        <p class="max-w-xs font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {{ homeCopy.richDescription }}
        </p>
      </div>
      <div class="homepage-v3-rich-grid mt-10 grid grid-cols-2">
        <div v-for="item in quotesList.slice(4, 10)" :key="item.id" class="homepage-v3-rich-item group" @mousemove="trackRichItemPointer" @mouseleave="resetRichItemPointer">
          <NuxtLink :to="`/quotes/${item.id}`" class="block">
            <blockquote :class="['font-serif leading-[1.08] tracking-[-0.02em] break-words wrap-anywhere text-gray-900 dark:text-gray-100', richQuoteClass(item.name)]">
              {{ item.name.length > 120 ? `${item.name.slice(0, 117)}…` : item.name }}
            </blockquote>
          </NuxtLink>
          <p class="mt-3 flex flex-wrap gap-x-2 font-sans text-xs text-gray-500 dark:text-gray-400">
            <NuxtLink v-if="item.author" :to="`/authors/${item.author.id}`" class="font-500 hover:text-gray-900 dark:hover:text-gray-100">{{ item.author.name }}</NuxtLink>
            <span v-else class="font-500">{{ $t('home.unknown') }}</span>
            <span v-if="item.reference" aria-hidden="true">·</span>
            <NuxtLink v-if="item.reference" :to="`/references/${item.reference.id}`" class="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100">{{ item.reference.name }}</NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <!-- ── Authors Section ── -->
    <div v-if="allAuthors.length > 0 || curatedLoading" class="homepage-v3-authors scroll-mt-20 px-6 py-14 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 class="font-serif font-500 text-4xl leading-none tracking-[-0.035em] text-white">
            {{ $t('home.nav.authors') }}
          </h2>
          <p class="mt-3 max-w-xs font-sans text-sm leading-relaxed text-white/60">
          {{ homeCopy.authorsDescription }}
          </p>
        </div>

      </div>

      <template v-if="allAuthors.length > 0">
        <div class="homepage-v3-scroll-fade">
          <div class="homepage-v3-author-grid flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          <NuxtLink
            v-for="author in allAuthors.slice(0, 8)"
            :key="author.id"
            :to="`/authors/${author.id}`"
            class="homepage-v3-author-card w-[78vw] shrink-0 snap-start group"
          >
            <div v-if="author.image_url" class="w-12 h-12 rounded-full overflow-hidden grayscale flex-shrink-0">
              <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
              <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
            </div>
            <div class="min-w-0">
              <p :class="['font-subtitle font-600 leading-tight text-white break-words wrap-anywhere', authorNameClass(author.name)]">
                {{ author.name }}
              </p>
              <p v-if="author.job" class="mt-1 truncate font-sans text-xs font-500 text-white/65">
                {{ author.job }}
              </p>
              <p class="font-sans text-xs font-500 text-gray-500 dark:text-gray-400 mt-0.5">
                {{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
              </p>
            </div>
          </NuxtLink>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex gap-4 overflow-x-auto pb-1">
          <div v-for="i in 3" :key="i" class="flex-shrink-0 flex gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
            <div>
              <div class="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1.5" />
              <div class="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </template>
      <NuxtLink to="/authors" class="mt-5 ml-auto block w-fit font-sans text-xs font-500 text-white/65 transition-colors hover:text-white">
        {{ $t('home.see_all') }} →
      </NuxtLink>
    </div>

    <!-- ── References Section ── -->
    <div v-if="allReferences.length > 0 || curatedLoading" class="homepage-v3-references px-6 py-14 animate-fade-in-up" style="animation-delay: 0.15s">
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 class="font-serif font-400 text-4xl leading-none tracking-[-0.035em] text-stone-700 dark:text-stone-300">
            {{ $t('home.nav.references') }}
          </h2>
          <p class="mt-3 max-w-xs font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {{ homeCopy.referencesDescription }}
          </p>
        </div>
      </div>

      <template v-if="allReferences.length > 0">
        <div class="homepage-v3-scroll-fade">
          <div class="homepage-v3-reference-grid flex gap-3 overflow-x-auto pb-2">
          <NuxtLink
            v-for="ref in allReferences.slice(0, 6)"
            :key="ref.id"
            :to="`/references/${ref.id}`"
            class="homepage-v3-reference-card w-52 shrink-0 snap-start group"
          >
            <div v-if="ref.image_url" class="homepage-v3-reference-image absolute inset-0 bg-cover bg-center grayscale" :style="{ backgroundImage: `url(${ref.image_url})` }" />
            <div v-else class="homepage-v3-reference-image absolute inset-0 bg-gradient-to-br from-[#8c8f8b] to-[#25282b] dark:from-[#62645f] dark:to-[#141518]" />
            <div class="homepage-v3-reference-overlay absolute inset-0" />
            <div class="relative mt-auto">
              <h3 class="font-subtitle font-600 leading-tight text-white break-words wrap-anywhere">{{ ref.name }}</h3>
              <p class="mt-1 font-sans text-xs font-500 text-white/65">{{ formatReferenceType(ref.primary_type) }}</p>
            </div>
          </NuxtLink>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex gap-4 overflow-x-auto pb-1">
          <div v-for="i in 3" :key="i" class="flex-shrink-0 w-36">
            <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse mb-2" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mb-1" />
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
          </div>
        </div>
      </template>
      <NuxtLink to="/references" class="mt-5 ml-auto block w-fit font-sans text-xs text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
        {{ $t('home.see_all') }} →
      </NuxtLink>
      <EditorialWaveEdge mode="cutout" class="absolute inset-x-0 bottom-0 h-4 text-[#F7F5EF] dark:text-[#0C0A09]" />
    </div>

    <!-- ── Recent Quotes Section ── -->
    <div v-if="false" class="px-6 py-5 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center justify-between mb-8">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          {{ $t('home.recent_quotes') }}
        </p>

        <NuxtLink
          to="/quotes"
          class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
            font-sans text-xs font-600 tracking-[0.1em] text-gray-400
            dark:text-gray-400
            hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
            hover:scale-105 active:scale-99
            transition-[colors,transform]">
          {{ $t('home.browse_all') }}
        </NuxtLink>
      </div>

      <div class="space-y-8">
        <div
          v-for="(quote, qi) in quotesList.slice(0, 5)"
          :key="quote.id"
          class="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 animate-fade-in-up"
          :style="{ animationDelay: `${0.25 + qi * 0.05}s` }"
        >
          <NuxtLink
            :to="`/quotes/${quote.id}`"
            class="block group"
          >
            <blockquote class="font-body text-lg font-600 text-gray-700 dark:text-gray-300 italic leading-relaxed break-words wrap-anywhere group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              {{ quote.name }}
            </blockquote>
            <p class="mt-1.5 font-sans text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors flex items-center gap-1.5 flex-wrap">
              <span>{{ quote.author?.name || $t('home.unknown') }}</span>
              <template v-if="quote.tags && quote.tags.length > 0">
                <span v-for="tag in quote.tags.slice(0, 3)" :key="tag.name" class="w-2 h-2 rounded-full inline-block" :style="{ backgroundColor: tag.color || '#6366f1' }" />
              </template>
              <span v-if="quote.reference" class="text-gray-300 dark:text-gray-600">·</span>
              <span v-if="quote.reference" class="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">{{ quote.reference?.name }}</span>
            </p>
          </NuxtLink>
        </div>
      </div>

      <div v-if="hasMore" class="mt-6 flex justify-center">
        <LoadMoreButton
          :isLoading="loadingMore"
          :idleText="$ts('home.load_more')"
          :loadingText="$ts('home.loading')"
          @load="handleLoadMore"
        />
      </div>
    </div>

    <!-- ── Empty state when no quotes ── -->
    <div v-if="!props.theme && allAuthors.length === 0 && allReferences.length === 0 && quotesList.length === 0 && !curatedLoading" class="px-6 py-16 text-center" aria-live="polite">
      <p class="font-serif text-xl text-gray-500 dark:text-gray-400">{{ $t('home.no_content') }}</p>
      <p class="font-sans text-sm text-gray-400 dark:text-gray-500 mt-2">{{ $t('home.be_first_contribute') }}</p>
    </div>
  </div>
  <ClientOnly>
    <ThemeLanguageDialog v-if="props.theme" v-model="showThemeLanguageDialog" :theme-slug="props.theme.slug" />
    <ReportDrawer v-if="imageReportContext" v-model:open="showImageReportDrawer" :image-report="imageReportContext" />
  </ClientOnly>
</template>

<script setup lang="ts">
import './home/home-v3.css'
import type { ProcessedQuoteResult } from '~~/server/types'

const { $t, $ts } = useI18n()

const config = useRuntimeConfig()

interface Props {
  feed: {
    quotes: Ref<ProcessedQuoteResult[]>
    authors?: Ref<Author[]>
    references?: Ref<QuoteReference[]>
    hasMore?: Ref<boolean>
    loadingMore?: Ref<boolean>
    initialLoading?: Ref<boolean>
    loadMore: () => Promise<void>
    curatedLoading?: Ref<boolean>
  }
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
  stats?: {
    quotes: number
    authors: number
    references: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  theme: null,
  stats: undefined
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

const emit = defineEmits<{
  newQuote: []
}>()

const hasScrolled = ref(false)
const {
  expanded: imageCreditExpanded,
  menuItems: imageCreditContextMenuItems,
  menuOpen: imageCreditContextMenuOpen,
  menuPosition: imageCreditContextMenuPosition,
  openMenu: openImageCreditContextMenu,
  toggle: toggleImageCredit
} = useHomeImageAttributionControls()
const showImageReportDrawer = ref(false)
const imageReportContext = computed(() => props.theme?.id
  ? { themeId: props.theme.id, imageVariant: props.theme.mobile_image_url ? 'mobile' as const : 'desktop' as const }
  : null)
const mobileImageAttribution = computed(() => {
  const theme = props.theme
  if (!theme) return null

  return theme.mobile_image_url
    ? { credit: theme.mobile_image_credit, sourceUrl: theme.mobile_image_source_url, license: theme.mobile_image_license }
    : { credit: theme.image_credit, sourceUrl: theme.image_source_url, license: theme.image_license }
})

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
const hasThemeWithoutQuotes = computed(() => Boolean(props.theme && !props.feed.initialLoading?.value && !featuredQuote.value))
const showThemeLanguageDialog = ref(false)

const featuredQuote = computed(() => {
  const qs = props.feed.quotes.value || []
  return qs[0] || null
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

const quoteAuthor = computed(() => {
  return featuredQuote.value?.author || null
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

const allAuthors = computed(() => props.feed.authors?.value || [])
const allReferences = computed(() => props.feed.references?.value || [])
const quotesList = computed(() => props.feed.quotes.value || [])

const richQuoteClass = (text: string) => {
  if (text.length <= 32) return 'text-3xl lg:text-4xl'
  if (text.length <= 72) return 'text-2xl lg:text-3xl'
  return 'text-xl lg:text-2xl'
}

const coverQuoteClass = (text: string) => {
  if (text.length <= 70) return 'text-4xl'
  if (text.length <= 130) return 'text-3xl'
  if (text.length <= 210) return 'text-2xl'
  return 'text-xl'
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

const authorNameClass = (name: string) => {
  if (name.length <= 14) return 'text-xl'
  if (name.length <= 24) return 'text-lg'
  return 'text-base'
}
const curatedLoading = computed(() => props.feed.curatedLoading?.value || false)
const hasMore = computed(() => props.feed.hasMore?.value || false)
const loadingMore = computed(() => props.feed.loadingMore?.value || false)

const handleLoadMore = () => {
  props.feed.loadMore()
}

const handleClickAuthor = (authorId?: number) => {
  if (authorId) {
    navigateTo(`/authors/${authorId}`)
  }
}

const getAuthorInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatReferenceType = (type?: string): string => {
  if (!type) return ''
  const t = $ts('reference_types.' + type)
  return t || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
</script>

<style scoped>
.mobile-home-feed {
  padding-bottom: 1rem;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.05);
}
</style>
