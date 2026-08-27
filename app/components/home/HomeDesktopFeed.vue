<template>
  <div>
    <!-- Single-column editorial layout -->
    <div class="mx-auto w-full max-w-[1440px] px-4 lg:px-8">

      <!-- Left sidebar: Navigation -->
      <div class="hidden">
        <nav class="flex flex-col space-y-2 font-500 px-4 md:px-8">
          <HomeNavLink to="/quotes">
            {{ $t('home.nav.quotes') }}
          </HomeNavLink>
          <HomeNavLink to="/authors">
            {{ $t('home.nav.authors') }}
          </HomeNavLink>
          <HomeNavLink to="/references">
            {{ $t('home.nav.references') }}
          </HomeNavLink>
          <button @click="showSearch = true"
            class="group relative inline-block overflow-hidden font-sans text-sm transition-colors duration-300 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-[#0C0A09] group-active:scale-95 transition-transform text-left w-full">
            <span class="relative z-1 transition-colors duration-300">{{ $t('home.nav.search') }}</span>
            <span class="absolute inset-0 w-0 group-hover:w-full transition-all duration-300 ease-out -z-0 bg-[#0C0A09] dark:bg-[#FAFAF9]" />
          </button>
        </nav>

        <div class="mt-8 pt-8">
          <div class="px-4 md:px-8">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-4">
              {{ $t('home.stats') }}
            </p>
            <div class="border border-gray-200 dark:border-gray-700 rounded-sm p-3 space-y-2">
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">
                  <span class="2xl:hidden">{{ formatCompactCount(stats.quotes) }}</span>
                  <span class="hidden 2xl:inline">{{ stats.quotes.toLocaleString() }}</span>
                </span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="hidden 2xl:inline">{{ $t('home.quotes_label') }}</span>
                  <NTooltip :content="String($ts('home.quotes_label'))" placement="right">
                    <NIcon name="i-ph-quotes" class="2xl:hidden w-4 h-4" :aria-label="$ts('home.quotes_label')" />
                  </NTooltip>
                </span>
              </div>
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">
                  <span class="2xl:hidden">{{ formatCompactCount(stats.authors) }}</span>
                  <span class="hidden 2xl:inline">{{ stats.authors.toLocaleString() }}</span>
                </span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="hidden 2xl:inline">{{ $t('home.authors_label') }}</span>
                  <NTooltip :content="String($ts('home.authors_label'))" placement="right">
                    <NIcon name="i-ph-users-three" class="2xl:hidden w-4 h-4" :aria-label="$ts('home.authors_label')" />
                  </NTooltip>
                </span>
              </div>
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 tabular-nums">
                  <span class="2xl:hidden">{{ formatCompactCount(stats.references) }}</span>
                  <span class="hidden 2xl:inline">{{ stats.references.toLocaleString() }}</span>
                </span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="hidden 2xl:inline">{{ $t('home.references_label') }}</span>
                  <NTooltip :content="String($ts('home.references_label'))" placement="right">
                    <NIcon name="i-ph-book-open-text" class="2xl:hidden w-4 h-4" :aria-label="$ts('home.references_label')" />
                  </NTooltip>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Quotes -->
        <div class="mt-10 pt-8">
          <div class="px-4 md:px-8 mb-4 flex items-center justify-between">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {{ $t('home.recent_quotes') }}
            </p>
            <a href="/quotes" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {{ $t('home.see_all') }}
            </a>
          </div>

          <div class="px-4 md:px-8 space-y-6">
            <NuxtLink
              v-for="quote in recentSidebarQuotes"
              :key="quote.id"
              :to="`/quotes/${quote.id}`"
              class="block group"
            >
              <blockquote class="font-body text-xs text-gray-700 dark:text-gray-300 italic leading-snug break-words [overflow-wrap:anywhere] group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {{ truncateQuote(quote.name, 100) }}
              </blockquote>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ quote.author?.name || $t('home.unknown') }}
              </p>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Center content -->
      <div class="mt-6 w-full">
        <!-- Featured quote (Philosophy section) -->
        <div v-if="featuredQuote" class="homepage-v3-cover mb-4 rounded-2xl px-6 lg:px-10 py-16 lg:py-24 shadow-sm">
          <NuxtLink
            :to="`/quotes/${featuredQuote.id}`"
            class="homepage-v3-quote block group"
          >
            <h2 :class="['font-serif font-300 text-gray-900 dark:text-gray-100 leading-tight break-words [overflow-wrap:anywhere] mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors', coverQuoteClass(featuredQuote.name)]">
              {{ featuredQuote.name }}
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
        </div>
        <div class="homepage-v3-cover-actions relative mx-4 mb-16 flex items-center justify-center gap-4">
          <a
            href="#home-exploration"
            class="homepage-v3-primary inline-flex items-center rounded-full px-5 py-2.5 font-sans text-xs font-600 transition-colors"
          >
            {{ $t('home.explore_theme') }}
            <NIcon name="i-lucide-arrow-down" class="ml-2 h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <div class="homepage-v3-actions mt-0 flex items-center gap-1 lg:absolute lg:right-0">
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

        <!-- Editorial introduction -->
        <section v-if="opinionQuotes.length" id="home-exploration" class="homepage-v3-editorial mx-4 mb-16 scroll-mt-24 pt-14">
          <p class="font-sans font-600 text-xs uppercase tracking-[0.2em] text-[#9B7A30]">
            {{ $t('home.editorial_label') }}
          </p>
          <div class="mt-16 mb-12 space-y-4">
            <h2 class="font-serif text-3xl leading-[0.98] tracking-[-0.025em] text-gray-900 dark:text-gray-100 lg:text-4xl">
              {{ $t('home.editorial_title') }}
            </h2>
            <p class="max-w-md font-sans text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {{ $t('home.editorial_desc') }}
            </p>
          </div>
          <NuxtLink
            v-if="opinionQuotes[0]"
            :to="`/quotes/${opinionQuotes[0].id}`"
            class="mt-14 block max-w-4xl group"
          >
            <blockquote class="font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-gray-900 transition-colors group-hover:text-gray-500 dark:text-gray-100 dark:group-hover:text-gray-300 lg:text-6xl">
              {{ opinionQuotes[0].name }}
            </blockquote>
            <p class="mt-4 font-sans text-sm text-gray-500 dark:text-gray-400">
              {{ opinionQuotes[0].author?.name || $t('home.unknown') }}<span v-if="opinionQuotes[0].reference"> · {{ opinionQuotes[0].reference?.name }}</span>
            </p>
          </NuxtLink>
          <div class="mt-16 grid gap-24 md:grid-cols-2">
            <NuxtLink v-for="item in opinionQuotes.slice(1, 3)" :key="item.id" :to="`/quotes/${item.id}`" class="group min-w-0 border-t border-gray-200 pt-8 dark:border-gray-800">
              <blockquote class="break-words font-serif text-2xl leading-[1.08] tracking-[-0.02em] text-gray-700 transition-colors group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-gray-100 lg:text-5xl [overflow-wrap:anywhere]">
                {{ item.name }}
              </blockquote>
              <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">{{ item.author?.name || $t('home.unknown') }}</p>
            </NuxtLink>
          </div>
        </section>

        <!-- References section: the next editorial chapter after the introduction -->
        <section v-if="featuredReferences.length" class="homepage-v3-references rounded-2 mx-0 mb-14 px-6 py-16 lg:px-10">
          <div class="mb-6 flex items-end justify-between gap-4">
            <h2 class="font-serif font-500 text-4xl leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 lg:text-6xl">
              {{ $t('nav.references') }}
            </h2>
            <NuxtLink to="/references" class="shrink-0 font-sans text-xs text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              {{ $t('home.see_all') }} →
            </NuxtLink>
          </div>
          <div class="homepage-v3-reference-grid grid gap-4 lg:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]">
            <NuxtLink v-for="ref in featuredReferences.slice(0, 4)" :key="ref.id" :to="`/references/${ref.id}`" class="homepage-v3-reference-card group">
              <div v-if="ref.image_url && !referenceImageErrors[ref.id]" class="homepage-v3-reference-image absolute inset-0 bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" :style="{ backgroundImage: `url(${ref.image_url})` }" />
              <div v-else class="homepage-v3-reference-image absolute inset-0 bg-gradient-to-br from-[#8c8f8b] to-[#25282b] dark:from-[#62645f] dark:to-[#141518]" />
              <div class="homepage-v3-reference-overlay absolute inset-0" />
              <div class="relative mt-auto">
                <h3 class="font-serif text-xl leading-[1.08] text-white">{{ ref.name }}</h3>
                <p class="mt-2 font-sans text-xs text-white/70">{{ formatReferenceType(ref.primary_type) }}</p>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Rich quote exploration -->
        <section v-if="storyQuotes.length" class="homepage-v3-rich mx-4 mb-14">
          <div class="homepage-v3-rich-head flex items-baseline justify-between gap-5">
            <h2 class="font-serif font-500 text-4xl leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 lg:text-6xl">
              {{ $t('home.rich_quotes_title') }}
            </h2>
            <p class="max-w-sm font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {{ $t('home.rich_quotes_desc') }}
            </p>
          </div>
          <div class="homepage-v3-rich-grid mt-12 grid md:grid-cols-2">
            <NuxtLink v-for="item in storyQuotes.slice(0, 6)" :key="item.id" :to="`/quotes/${item.id}`" class="homepage-v3-rich-item group">
              <blockquote :class="['font-serif leading-[1.08] tracking-[-0.02em] text-gray-900 transition-colors group-hover:text-gray-500 dark:text-gray-100 dark:group-hover:text-gray-300', richQuoteClass(item.name)]">
                {{ truncateQuote(item.name, 140) }}
              </blockquote>
              <small class="mt-4 block font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ item.author?.name || $t('home.unknown') }}
              </small>
            </NuxtLink>
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
                {{ $t('home.authors_section_desc') }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button type="button" class="homepage-v3-carousel-control" :aria-label="String($t('common.previous'))" @click="scrollAuthors(-1)">
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" />
              </button>
              <button type="button" class="homepage-v3-carousel-control" :aria-label="String($t('common.next'))" @click="scrollAuthors(1)">
                <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref="authorsCarousel" class="homepage-v3-author-grid flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
            <NuxtLink
              v-for="author in sidebarAuthors.slice(0, 6)"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="homepage-v3-person w-[min(78vw,280px)] shrink-0 snap-start group flex flex-col items-start gap-4 lg:w-[calc((100%-3rem)/4)]"
            >
              <div v-if="author.image_url && !imageErrors[author.id]" class="h-12 w-12 shrink-0 overflow-hidden rounded-full grayscale transition group-hover:grayscale-0">
                <img :src="author.image_url" :alt="author.name" class="h-full w-full object-cover" @error="authorAvatarFailed(author.id)" />
              </div>
              <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700">
                <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
              </div>
              <div class="min-w-0">
                <p :class="['font-subtitle font-600 leading-tight text-white transition-colors group-hover:text-white/70 break-words [overflow-wrap:anywhere]', authorNameClass(author.name)]">
                  {{ author.name || $t('home.unknown') }}
                </p>
                <p class="font-sans font-600 text-xs text-white/55">
                  {{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Recent quotes section -->
        <section v-if="false" class="mx-4 mb-14 border-t border-gray-200/80 pt-10 dark:border-gray-800/80">
          <div class="mb-6 flex items-end justify-between gap-4">
            <div>
              <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                {{ $t('home.recent_quotes') }}
              </p>
              <p class="mt-2 max-w-xl font-serif text-2xl text-gray-900 dark:text-gray-100">
                {{ $t('home.recent_quotes_desc') }}
              </p>
            </div>
            <NuxtLink to="/quotes" class="shrink-0 font-sans text-xs text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              {{ $t('home.see_all') }} →
            </NuxtLink>
          </div>
          <div class="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <NuxtLink
              v-for="quote in recentSidebarQuotes.slice(0, 6)"
              :key="quote.id"
              :to="`/quotes/${quote.id}`"
              class="group"
            >
              <blockquote class="font-body text-lg italic leading-relaxed text-gray-700 transition-colors group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-gray-100">
                {{ truncateQuote(quote.name, 150) }}
              </blockquote>
              <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ quote.author?.name || $t('home.unknown') }}
                <span v-if="quote.reference" class="text-gray-300 dark:text-gray-600"> · {{ quote.reference?.name }}</span>
              </p>
            </NuxtLink>
          </div>
        </section>
      </div>

      <!-- Right sidebar: Featured references -->
      <div class="hidden">
        <div class="px-4 md:px-8 mt-4 mb-6 pb-4 flex items-center justify-between">
          <p class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
            {{ $t('home.featured_references') }}
          </p>
          <a href="/references" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {{ $t('home.see_all') }}
          </a>
        </div>

        <div class="px-4 md:px-8 space-y-6">
          <div
            v-for="(ref, index) in featuredReferences"
            :key="ref.id"
            class="group cursor-pointer flex gap-3"
            @click="navigateTo(`/references/${ref.id}`)"
          >
            <div class="flex-shrink-0 w-16 h-22 overflow-hidden rounded-sm">
              <div
                v-if="ref.image_url && !referenceImageErrors[ref.id]"
                class="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105 grayscale"
                :style="{ backgroundImage: `url(${ref.image_url})` }"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <NIcon name="i-ph-image" class="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-title text-md font-600 text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
                {{ ref.name }}
              </h4>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ formatReferenceType(ref.primary_type) }}
              </p>
              <p v-if="ref.description" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {{ ref.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700 text-center">
          <NButton
            btn="link"
            to="/references"
            :label="$ts('home.see_more')"
            trailing="i-ph-arrow-right"
            class="font-sans text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-2"
          />
        </div>

        <!-- Related Authors -->
        <div v-if="sidebarAuthors.length" class="px-4 md:px-8 mt-8 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700">
          <div class="mb-4 flex items-center justify-between">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {{ $t('home.related_authors') }}
            </p>
            <a href="/authors" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {{ $t('home.see_all') }}
            </a>
          </div>
          <div class="space-y-4">
            <NuxtLink
              v-for="author in sidebarAuthors"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="flex items-center gap-3 group"
            >
              <div class="flex-shrink-0">
                <div
                  v-if="author.image_url && !imageErrors[author.id]"
                  class="w-10 h-10 rounded-full overflow-hidden grayscale"
                >
                  <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" @error="authorAvatarFailed(author.id)" />
                </div>
                <div v-else class="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">
                    {{ getAuthorInitials(author.name) }}
                  </span>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {{ author.name || $t('home.unknown') }}
                </p>
                <p v-if="author.quotes_count" class="font-sans text-xs text-gray-500 dark:text-gray-400">
                  {{ author.quotes_count }} {{ author.quotes_count === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
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
</template>

<script setup lang="ts">
import './home-v3.css'
import type { ProcessedQuoteResult } from '~~/server/types'
import type { UseHomeFeed } from '~/composables/useHomeFeed'
import { navigateTo } from 'nuxt/app'

const { $t, $ts } = useI18n()
const { locale } = useI18nLocale()

interface Props {
  feed: UseHomeFeed
  stats?: { quotes: number; authors: number; references: number }
  theme?: {
    slug: string
    name: string
    description: string | null
    image_url: string | null
    config: Record<string, any> | null
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => ({ quotes: 0, authors: 0, references: 0 }),
  theme: null
})

const showSearch = ref(false)
const authorsCarousel = ref<HTMLElement | null>(null)

const scrollAuthors = (direction: number) => {
  authorsCarousel.value?.scrollBy({ left: direction * authorsCarousel.value.clientWidth * 0.82, behavior: 'smooth' })
}
const selectedQuote = ref<ProcessedQuoteResult | null>(null)
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showReportDialog = ref(false)

// Extract featured quote (first quote)
const featuredQuote = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes[0] || null
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

// Extract recent quotes for sidebar (12 most recent)
const recentSidebarQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  // Use moderated_at if available, otherwise created_at
  return quotes
    .slice()
    .sort((a, b) => {
      const dateA = a.moderated_at || a.created_at
      const dateB = b.moderated_at || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 24)
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

const coverQuoteClass = (text: string) => {
  if (text.length <= 70) return 'text-4xl md:text-6xl lg:text-[7rem]'
  if (text.length <= 130) return 'text-3xl md:text-5xl lg:text-6xl'
  if (text.length <= 210) return 'text-3xl md:text-4xl lg:text-5xl'
  if (text.length <= 300) return 'text-2xl md:text-3xl lg:text-4xl'
  return 'text-xl md:text-2xl lg:text-3xl'
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
