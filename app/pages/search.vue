<template>
  <div class="min-h-screen bg-[#F7F5EF] dark:bg-[#0C0A09]">
    <!-- Keep the initial skeleton until the route's first data load has settled. -->
    <div v-if="!initialDataReady && !searchStore.hasResults" class="search-page mx-auto max-w-6xl px-6 pb-24 sm:px-8 lg:px-10" aria-busy="true">
      <header class="pb-8 pt-12 md:pb-16 md:pt-28">
        <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
          {{ $t('page_title') }}
        </h1>
      </header>

      <div class="sticky top-14 z-20 -mx-6 mb-8 bg-[#F7F5EF]/95 px-6 pb-5 pt-2 backdrop-blur-md dark:bg-[#0C0A09]/95 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div class="search-field flex min-h-11 items-center gap-3 rounded-md border border-black/15 px-3 dark:border-white/20 md:min-h-0 md:gap-4 md:rounded-none md:border-0 md:border-b md:px-0 md:pb-3">
          <NIcon name="i-ph-magnifying-glass" class="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate font-sans text-base text-gray-900 dark:text-gray-100 md:text-2xl">
            {{ searchInput || $t('search_placeholder') }}
          </span>
          <span v-if="searchInput" class="invisible h-8 w-8 shrink-0 md:h-9 md:w-9" aria-hidden="true" />
        </div>
        <div v-if="searchInput.trim() || hasActiveFilters" class="mt-3 hidden min-h-5 min-w-0 items-center justify-between gap-3 md:flex">
          <p class="min-w-0 flex-1 font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ $t('search_syntax_hint') }}
          </p>
          <div class="ml-auto flex shrink-0 items-center border-l border-black/10 pl-4 dark:border-white/10" aria-hidden="true">
            <div class="h-5 w-36 animate-pulse rounded bg-black/[0.05] dark:bg-white/[0.07]" />
          </div>
        </div>
      </div>

      <main class="pt-4">
        <div v-if="searchInput.trim() || hasActiveFilters">
          <div class="mb-5 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.025] px-4 md:hidden dark:border-white/10 dark:bg-white/[0.035]" aria-hidden="true">
            <div class="h-4 w-20 animate-pulse rounded bg-black/[0.05] dark:bg-white/[0.07]" />
            <div class="h-9 w-9 animate-pulse rounded-full bg-black/[0.05] dark:bg-white/[0.07]" />
          </div>
          <div class="space-y-8 rounded-2xl bg-[#E6E4DD] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]">
            <div class="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
              <section class="min-w-0">
                <h2 class="search-results-heading mb-3">{{ $t('section_quotes') }}</h2>
                <div class="space-y-6 animate-pulse" aria-hidden="true">
                  <article v-for="item in 4" :key="item" class="space-y-3 py-3">
                    <div class="h-6 w-11/12 rounded bg-black/[0.08] dark:bg-white/[0.08] sm:h-7" />
                    <div class="h-6 w-3/4 rounded bg-black/[0.08] dark:bg-white/[0.08] sm:h-7" />
                    <div class="mt-3 h-3 w-2/5 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  </article>
                </div>
              </section>

              <aside class="space-y-10 lg:pl-8">
                <section>
                  <h2 class="search-results-heading mb-4">{{ $t('section_results_authors') }}</h2>
                  <div class="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 animate-pulse" aria-hidden="true">
                    <div v-for="item in 2" :key="item" class="flex items-center gap-3 py-1">
                      <div class="h-10 w-10 shrink-0 rounded-full bg-black/[0.08] dark:bg-white/[0.08]" />
                      <div class="min-w-0 flex-1 space-y-2">
                        <div class="h-3.5 w-2/3 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
                        <div class="h-3 w-1/3 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                </section>
                <section>
                  <h2 class="search-results-heading mb-4">{{ $t('section_results_references') }}</h2>
                  <div class="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 animate-pulse" aria-hidden="true">
                    <div v-for="item in 2" :key="item" class="flex items-center gap-3 py-1">
                      <div class="h-10 w-10 shrink-0 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
                      <div class="min-w-0 flex-1 space-y-2">
                        <div class="h-3.5 w-2/3 rounded bg-black/[0.08] dark:bg-white/[0.08]" />
                        <div class="h-3 w-1/3 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>

        <div v-else class="space-y-12">
          <section v-if="recentSearches.length > 0">
            <h2 class="mb-4 font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_recent') }}</h2>
            <div class="flex flex-wrap gap-2 animate-pulse" aria-hidden="true">
              <div v-for="item in Math.min(recentSearches.length, 5)" :key="item" class="h-10 w-28 rounded-md bg-black/[0.05] dark:bg-white/[0.07]" />
            </div>
          </section>

          <section>
            <h2 class="mb-5 font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_suggested') }}</h2>
            <div class="flex flex-wrap gap-2">
              <span v-for="suggestion in suggestions" :key="suggestion.text" class="inline-flex min-h-10 items-center gap-2 rounded-md bg-black/[0.045] px-3 font-sans text-sm text-gray-700 dark:bg-white/[0.07] dark:text-gray-300">
                <NIcon :name="suggestion.icon" class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                {{ suggestion.text }}
              </span>
            </div>
            <div class="mt-3 h-4 w-36 rounded bg-black/[0.05] dark:bg-white/[0.07] animate-pulse" aria-hidden="true" />
          </section>

          <div class="grid gap-x-14 gap-y-12 pt-2 md:grid-cols-2">
            <section>
              <h2 class="mb-5 font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_authors') }}</h2>
              <div class="space-y-4 animate-pulse" aria-hidden="true">
                <div v-for="item in 4" :key="item" class="flex items-center gap-3 py-3">
                  <div class="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-white/10" />
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="h-3.5 w-2/3 rounded bg-gray-200 dark:bg-white/10" />
                    <div class="h-3 w-1/3 rounded bg-gray-200/70 dark:bg-white/[0.07]" />
                  </div>
                </div>
              </div>
              <div class="mt-2 h-4 w-32 rounded bg-black/[0.05] dark:bg-white/[0.07] animate-pulse" aria-hidden="true" />
            </section>
            <section>
              <h2 class="mb-5 font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_references') }}</h2>
              <div class="space-y-4 animate-pulse" aria-hidden="true">
                <div v-for="item in 4" :key="item" class="flex items-center gap-3 py-3">
                  <div class="h-10 w-10 shrink-0 rounded bg-gray-200 dark:bg-white/10" />
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="h-3.5 w-2/3 rounded bg-gray-200 dark:bg-white/10" />
                    <div class="h-3 w-1/3 rounded bg-gray-200/70 dark:bg-white/[0.07]" />
                  </div>
                </div>
              </div>
              <div class="mt-2 h-4 w-36 rounded bg-black/[0.05] dark:bg-white/[0.07] animate-pulse" aria-hidden="true" />
            </section>
          </div>
        </div>
      </main>
    </div>

    <!-- Search page -->
    <div v-else class="search-page mx-auto max-w-6xl px-6 pb-24 sm:px-8 lg:px-10">
      <header class="pb-8 pt-12 md:pb-16 md:pt-28">
        <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
          {{ $t('page_title') }}
        </h1>
      </header>

      <div class="sticky top-14 z-20 -mx-6 mb-8 bg-[#F7F5EF]/95 px-6 pb-5 pt-2 backdrop-blur-md dark:bg-[#0C0A09]/95 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div class="flex items-center gap-2">
          <div class="search-field flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-black/15 px-3 transition-colors focus-within:border-black/50 dark:border-white/20 dark:focus-within:border-white/50 md:min-h-0 md:gap-4 md:rounded-none md:border-0 md:border-b md:px-0 md:pb-3 md:focus-within:border-black md:focus-within:border-b-2 md:dark:focus-within:border-white">
            <NIcon name="i-ph-magnifying-glass" class="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <label for="search-page-query" class="sr-only">{{ $t('search_placeholder') }}</label>
            <input
              id="search-page-query"
              ref="searchInputElement"
              v-model="searchInput"
              type="text"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="Boolean(filterCommand)"
              :aria-controls="filterCommand ? 'search-filter-suggestions' : undefined"
              :aria-activedescendant="activeSuggestionIndex >= 0 ? `search-filter-option-${activeSuggestionIndex}` : undefined"
              :placeholder="$t('search_placeholder') as string"
              class="min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-base text-gray-900 outline-none placeholder:text-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500 md:text-2xl"
              @input="handleSearchInput"
              @keydown="handleSearchKeydown"
            />
            <NTooltip v-if="searchInput" :content="$t('clear_search') as string">
              <button
                type="button"
                :aria-label="$t('clear_search') as string"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:hover:text-white dark:focus-visible:outline-gray-200 md:h-9 md:w-9"
                @click="clearSearchQuery"
              >
                <NIcon name="i-tabler-eraser" class="h-4 w-4" aria-hidden="true" />
              </button>
            </NTooltip>
          </div>
        </div>

        <div v-if="filterCommand" id="search-filter-suggestions" role="listbox" :aria-label="$t('filter_suggestions') as string" class="absolute inset-x-6 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-md border border-black/10 bg-[#F7F5EF] p-2 shadow-lg sm:inset-x-8 lg:inset-x-10 dark:border-white/10 dark:bg-[#17191e]">
          <p v-if="filterSuggestions.length === 0" class="px-3 py-2 font-sans text-sm text-gray-500 dark:text-gray-400">{{ filterSuggestionMessage || $t('filter_suggestions_empty') }}</p>
          <div v-else class="relative">
            <div
              v-if="activeSuggestionIndex >= 0"
              aria-hidden="true"
              class="pointer-events-none absolute inset-x-0 top-0 z-0 h-11 rounded bg-black/[0.06] transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-white/[0.1]"
              :style="{ transform: `translateY(${activeSuggestionIndex * 2.75}rem)` }"
            />
            <button
              v-for="(option, index) in filterSuggestions"
              :id="`search-filter-option-${index}`"
              :key="`${filterCommand.kind}-${option.value}`"
              type="button"
              role="option"
              :aria-selected="index === activeSuggestionIndex"
              class="relative z-10 flex h-11 w-full shrink-0 items-center justify-between gap-3 rounded px-3 py-2 text-left font-sans text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-800 dark:text-gray-200 dark:focus-visible:outline-gray-200"
              @mousemove="activeSuggestionIndex = index"
              @click="selectFilterSuggestion(option)"
            >
            <span class="inline-flex min-w-0 flex-1 items-center gap-2 font-600">
              <NAvatar v-if="option.kind && option.kind !== 'language'" :src="option.imageUrl" alt="" :rounded="option.kind === 'reference' ? '2' : undefined" size="xs" class="shrink-0">
                <template #fallback>
                  <div class="flex h-full w-full items-center justify-center bg-black/[0.05] text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                    <NIcon :name="option.kind === 'author' ? 'i-ph-user' : 'i-ph-book-open'" class="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </template>
              </NAvatar>
              <span class="truncate">{{ option.label }}</span>
            </span>
            <span v-if="option.detail || option.icon" class="inline-flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ option.detail }}
              <NIcon v-if="option.icon" :name="option.icon" class="h-3.5 w-3.5" :class="option.iconTone" aria-hidden="true" />
            </span>
            </button>
          </div>
        </div>

        <div v-if="!filterCommand || hasActiveFilters" class="mt-3 min-h-5 min-w-0 items-center gap-3" :class="activeFilterItems.length > 0 ? 'flex' : 'hidden md:flex'">
          <p v-if="!hasActiveFilters && !filterCommand" class="hidden min-w-0 flex-1 font-sans text-xs text-gray-500 dark:text-gray-400 md:block">
            {{ $t('search_syntax_hint') }}
          </p>
          <div v-if="activeFilterItems.length > 0" class="ml-auto flex min-w-0 flex-1 items-center gap-3 md:ml-0">
            <div class="search-filter-scroller -mx-6 min-w-0 flex-1 overflow-x-auto px-6 md:mx-0 md:overflow-visible md:px-0">
              <div class="flex w-max min-w-full flex-nowrap items-center gap-2 md:w-full md:flex-wrap">
                <NTooltip :content="$t('clear_filters') as string">
                  <button type="button" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-black/[0.045] text-gray-600 transition-colors hover:bg-black/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:bg-white/[0.07] dark:text-gray-300 dark:hover:bg-white/[0.12] dark:focus-visible:outline-gray-200 md:hidden" :aria-label="$t('clear_filters') as string" @click="clearFilters">
                    <NIcon name="i-tabler-filter-x" class="h-5 w-5" aria-hidden="true" />
                  </button>
                </NTooltip>
                <NTooltip v-for="filter in activeFilterItems" :key="filter.key" :content="$t('click_to_remove') as string">
                  <button type="button" class="search-filter-chip" :aria-label="$t('remove_filter', { filter: filter.label }) as string" @click="filter.remove"><span>{{ filter.label }}</span><NIcon name="i-ph-x" class="h-3.5 w-3.5" aria-hidden="true" /></button>
                </NTooltip>
                <button type="button" class="hidden px-2 py-1 font-sans text-xs text-gray-500 underline underline-offset-4 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:hover:text-white dark:focus-visible:outline-gray-200 md:inline-flex" @click="clearFilters">{{ $t('clear_filters') }}</button>
              </div>
            </div>
          </div>
          <p v-if="searchResults.total > 0 && (renderedSearchQuery || hasActiveFilters)" class="ml-auto hidden shrink-0 border-l border-black/10 pl-4 font-sans text-sm font-600 leading-5 text-gray-600 dark:border-white/10 dark:text-gray-400 md:block" role="status" aria-atomic="true">
            {{ renderedSearchQuery ? $t('results_count', { count: searchResults.total, query: renderedSearchQuery }) : $t('filtered_results_count', { count: searchResults.total }) }}
          </p>
        </div>
      </div>

      <main class="pt-4">
        <div v-if="showMobileResultSummary" class="mb-5 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.025] px-4 dark:border-white/10 dark:bg-white/[0.035] md:hidden">
          <p class="font-sans text-sm font-600 leading-5 text-gray-700 dark:text-gray-300" role="status" aria-atomic="true">
            {{ isSearchPending && searchResults.total === 0 ? $t('status_searching') : searchResults.total === 1 ? $t('mobile_results_count_one') : $t('mobile_results_count_other', { count: searchResults.total }) }}
          </p>
          <NButton
            btn="ghost-gray"
            size="md"
            icon
            label="i-ph-info"
            :aria-label="$t('search_help_title') as string"
            aria-haspopup="dialog"
            @click="isSearchHelpOpen = true"
          />
        </div>

        <!-- Empty State Start Page -->
        <div v-if="!searchQuery.trim() && !hasActiveFilters" class="space-y-12">
          <!-- Recent searches -->
          <section v-if="recentSearches.length > 0" :aria-labelledby="'recent-searches-heading'">
            <h2 id="recent-searches-heading" class="mb-4 font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_recent') }}</h2>
            <div class="flex flex-wrap gap-2">
              <div v-for="search in recentSearches" :key="search" class="inline-flex items-center gap-1 rounded-md bg-black/[0.045] pl-3 pr-1 dark:bg-white/[0.07]">
                <button type="button" class="min-h-10 font-sans text-sm text-gray-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:text-gray-300 dark:hover:text-white dark:focus-visible:outline-gray-200" @click="setSearchTerm(search)">{{ search }}</button>
                <NTooltip :content="$t('remove_recent', { search }) as string">
                  <button type="button" :aria-label="$t('remove_recent', { search }) as string" class="flex h-6 w-6 items-center justify-center text-gray-500 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200" @click="searchStore.removeRecent(search)">
                    <NIcon name="i-ph-x" class="h-3 w-3" aria-hidden="true" />
                  </button>
                </NTooltip>
              </div>
            </div>
          </section>

          <!-- Suggested searches -->
          <section :aria-labelledby="'suggested-searches-heading'">
            <div class="mb-5">
              <h2 id="suggested-searches-heading" class="font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('section_suggested') }}</h2>
            </div>
            <div class="flex flex-wrap gap-2">
              <NTooltip v-for="s in suggestions" :key="s.text" :content="$t('click_to_search', { terms: s.text }) as string">
                <button type="button" class="group inline-flex min-h-10 items-center gap-2 rounded-md bg-black/[0.045] px-3 font-sans text-sm text-gray-700 transition-[transform,background-color,color] duration-150 hover:bg-black/[0.08] hover:text-gray-950 active:scale-99 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:bg-white/[0.07] dark:text-gray-300 dark:hover:bg-white/[0.12] dark:hover:text-white dark:focus-visible:outline-gray-200" @click="setSearchTerm(s.text)">
                  <NIcon :name="s.icon" class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                  {{ s.text }}
                </button>
              </NTooltip>
            </div>
            <NButton size="sm" btn="link-gray" class="mt-3 px-0 font-sans text-sm" @click="refreshSuggestions()">
              {{ $t('refresh_suggestions') }}
            </NButton>
          </section>

          <!-- Random authors -->
          <div class="grid gap-x-14 gap-y-12 pt-2 md:grid-cols-2">
          <section class="min-w-0" :aria-labelledby="'explore-authors-heading'">
            <div class="mb-5">
              <h2 id="explore-authors-heading" class="font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">
                <NuxtLink to="/authors" class="group inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-800 dark:hover:text-gray-300 dark:focus-visible:outline-gray-200">
                  {{ $t('section_authors') }}
                  <NIcon name="i-tabler-arrow-up-right" class="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-500" aria-hidden="true" />
                </NuxtLink>
              </h2>
            </div>
            <div class="space-y-4">
              <NuxtLink
                v-for="author in randomAuthors"
                :key="author.id"
                :to="`/authors/${author.id}`"
                class="group flex min-w-0 items-center gap-3 py-3 first:pt-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200"
              >
                <NAvatar :src="author.image_url" :alt="author.name" size="sm" class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99">
                  <template #fallback>
                    <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <NIcon name="i-ph-user-circle-duotone" class="h-5 w-5" />
                    </div>
                  </template>
                </NAvatar>
                <div class="min-w-0">
                  <NTooltip :content="author.name">
                    <div class="truncate font-sans text-sm font-600 text-gray-800 dark:text-gray-200">{{ author.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('author_quotes_count', { count: author.quotes_count }) }}</div>
                </div>
              </NuxtLink>
              <div v-if="randomAuthors.length === 0" class="py-3 font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_authors') }}</div>
            </div>
            <NButton size="sm" btn="link-gray" class="mt-2 px-0 font-sans text-sm" @click="fetchRandomAuthors()">
              {{ $t('refresh_authors') }}
            </NButton>
          </section>

          <!-- Random references -->
          <section class="min-w-0" :aria-labelledby="'explore-references-heading'">
            <div class="mb-5">
              <h2 id="explore-references-heading" class="font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">
                <NuxtLink to="/references" class="group inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-800 dark:hover:text-gray-300 dark:focus-visible:outline-gray-200">
                  {{ $t('section_references') }}
                  <NIcon name="i-tabler-arrow-up-right" class="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-500" aria-hidden="true" />
                </NuxtLink>
              </h2>
            </div>
            <div class="space-y-4">
              <NuxtLink
                v-for="reference in randomReferences"
                :key="reference.id"
                :to="`/references/${reference.id}`"
                class="group flex min-w-0 items-center gap-3 py-3 first:pt-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200"
              >
                <NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="sm" class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99">
                  <template #fallback>
                    <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <NIcon name="i-ph-book-duotone" class="h-5 w-5" />
                    </div>
                  </template>
                </NAvatar>
                <div class="min-w-0 flex-1">
                  <NTooltip :content="reference.name">
                    <div class="truncate font-sans text-sm font-600 text-gray-800 dark:text-gray-200">{{ reference.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t('reference_meta', { type: translateReferenceType(reference.primary_type), count: reference.quotes_count }) }}
                  </div>
                </div>
              </NuxtLink>
              <div v-if="randomReferences.length === 0" class="py-3 font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_references') }}</div>
            </div>
            <NButton size="sm" btn="link-gray" class="mt-2 px-0 font-sans text-sm" @click="fetchRandomReferences()">
              {{ $t('refresh_references') }}
            </NButton>
          </section>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else class="space-y-5" aria-live="polite" :aria-busy="isSearchPending">
          <div v-if="showSearchLoading && searchResults.total === 0" class="flex items-center gap-3 py-8 font-sans text-sm text-gray-600 dark:text-gray-400" role="status">
            <div class="flex items-center gap-3">
              <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-500 dark:border-gray-300"></div>
              <span>{{ $t('status_searching') }}</span>
            </div>
          </div>

          <div v-else-if="searchResults.total > 0" class="space-y-8 rounded-2xl bg-[#E6E4DD] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]">
            <div
              class="grid gap-10 lg:gap-14"
              :class="searchResults.quotes.length > 0 && (searchResults.authors.length > 0 || searchResults.references.length > 0) ? 'lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]' : 'lg:grid-cols-1'"
            >
              <section v-if="searchResults.quotes.length > 0" class="min-w-0" :aria-labelledby="'search-quotes-heading'">
                <h2 id="search-quotes-heading" class="search-results-heading mb-3">{{ $t('section_quotes') }}</h2>
                <TransitionGroup name="search-results" tag="div" class="relative space-y-6" appear>
                  <article v-for="(quote, index) in searchResults.quotes" :key="quote.id" :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }" class="search-quote-result py-3">
                    <NuxtLink :to="`/quotes/${quote.id}`" class="search-quote-link group block w-fit max-w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200">
                      <blockquote class="w-fit max-w-[68ch] pb-1 font-serif text-xl leading-relaxed text-gray-900 dark:text-gray-100 sm:text-2xl">
                        <span class="search-quote-underline">{{ quote.name }}</span>
                      </blockquote>
                    </NuxtLink>
                    <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-gray-600 dark:text-gray-400">
                      <NuxtLink v-if="quote.author_name && quote.author_id" :to="`/authors/${quote.author_id}`" class="font-600 text-gray-800 underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:text-gray-200 dark:focus-visible:outline-gray-200">{{ quote.author_name }}</NuxtLink>
                      <span v-else-if="quote.author_name" class="font-600 text-gray-800 dark:text-gray-200">{{ quote.author_name }}</span>
                      <span v-if="quote.author_name && quote.reference_name" aria-hidden="true">·</span>
                      <NuxtLink v-if="quote.reference_name && quote.reference_id" :to="`/references/${quote.reference_id}`" class="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200">{{ quote.reference_name }}</NuxtLink>
                      <span v-else-if="quote.reference_name">{{ quote.reference_name }}</span>
                    </div>
                  </article>
                </TransitionGroup>
              </section>

              <aside class="space-y-10 lg:pl-8">
                <section v-if="searchResults.authors.length > 0" :aria-labelledby="'search-authors-heading'">
                  <h2 id="search-authors-heading" class="search-results-heading mb-4">{{ $t('section_results_authors') }}</h2>
                  <TransitionGroup name="search-results" tag="div" class="relative grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-1" appear>
                    <NuxtLink v-for="(author, index) in searchResults.authors" :key="author.id" :to="`/authors/${author.id}`" :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }" class="group flex min-w-0 items-center gap-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200">
                    <NAvatar
                      :src="author.image_url"
                      :alt="author.name"
                      size="sm"
                      class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99"
                    />
                    <div class="min-w-0">
                      <h3 class="truncate font-sans text-sm font-600 text-gray-800 dark:text-gray-200">{{ author.name }}</h3>
                      <p class="mt-1 font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('author_quotes_count', { count: author.quotes_count }) }}</p>
                    </div>
                    </NuxtLink>
                  </TransitionGroup>
                </section>

                <section v-if="searchResults.references.length > 0" :aria-labelledby="'search-references-heading'">
                  <h2 id="search-references-heading" class="search-results-heading mb-4">{{ $t('section_results_references') }}</h2>
                  <TransitionGroup name="search-results" tag="div" class="relative grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-1" appear>
                    <NuxtLink v-for="(reference, index) in searchResults.references" :key="reference.id" :to="`/references/${reference.id}`" :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }" class="group flex min-w-0 items-center gap-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:focus-visible:outline-gray-200">
                    <NAvatar
                      :src="reference.image_url"
                      :alt="reference.name"
                      rounded="2"
                      size="sm"
                      class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99"
                    >
                      <template #fallback>
                        <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <NIcon :name="getReferenceIcon(reference.primary_type)" />
                        </div>
                      </template>
                    </NAvatar>
                    <div class="min-w-0">
                      <h3 class="truncate font-sans text-sm font-600 text-gray-800 dark:text-gray-200">{{ reference.name }}</h3>
                      <p class="mt-1 truncate font-sans text-xs text-gray-500 dark:text-gray-400">
                      {{ $t('reference_meta', { type: translateReferenceType(reference.primary_type), count: reference.quotes_count }) }}
                      </p>
                    </div>
                    </NuxtLink>
                  </TransitionGroup>
                </section>
              </aside>
            </div>
          </div>

          <div v-else-if="searchStore.searchError && !isSearchPending" class="max-w-xl py-16" role="alert">
            <h2 class="mb-3 font-serif text-3xl font-400 text-gray-900 dark:text-gray-100">{{ $t('search_error_title') }}</h2>
            <p class="font-sans leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('search_error_desc') }}</p>
            <NButton size="sm" btn="link-gray" class="mt-4 px-0 font-sans text-sm" @click="scheduleSearch()">
              {{ $t('search_retry') }}
            </NButton>
          </div>

          <!-- No Results -->
          <div v-else-if="!isSearchPending" class="max-w-xl py-16">
            <h2 class="font-serif text-3xl font-400 text-gray-900 dark:text-gray-100 mb-3">{{ $t('empty_title') }}</h2>
            <p class="font-sans leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('empty_desc') }}</p>
          </div>
        </div>
      </main>
    </div>

    <ClientOnly>
      <NDrawer
        v-model:open="isSearchHelpOpen"
        direction="bottom"
        :una="{ drawerContent: 'h-auto max-h-[75dvh] w-full overflow-y-auto rounded-t-2xl bg-[#F7F5EF] dark:bg-[#0C0A09] shadow-2xl', drawerOverlay: 'bg-black/45' }"
      >
        <template #body>
          <div class="space-y-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-serif text-2xl font-400 text-gray-900 dark:text-gray-100">{{ $t('search_help_title') }}</h2>
                <p class="mt-1 max-w-prose font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('search_help_description') }}</p>
              </div>
              <NButton
                btn="ghost-gray"
                size="md"
                icon
                label="i-ph-x"
                :aria-label="$t('search_help_close') as string"
                @click="isSearchHelpOpen = false"
              />
            </div>

            <dl class="divide-y divide-black/10 font-sans dark:divide-white/10">
              <div class="flex items-center justify-between gap-4 py-3 first:pt-0">
                <dt class="text-sm text-gray-700 dark:text-gray-300">{{ $t('search_help_author') }}</dt>
                <dd><code class="rounded-sm bg-black/[0.045] px-2 py-1 text-sm text-gray-800 dark:bg-white/[0.07] dark:text-gray-200">author:Einstein</code></dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-3">
                <dt class="text-sm text-gray-700 dark:text-gray-300">{{ $t('search_help_language') }}</dt>
                <dd><code class="rounded-sm bg-black/[0.045] px-2 py-1 text-sm text-gray-800 dark:bg-white/[0.07] dark:text-gray-200">language:English</code></dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-3 last:pb-0">
                <dt class="text-sm text-gray-700 dark:text-gray-300">{{ $t('search_help_reference') }}</dt>
                <dd><code class="rounded-sm bg-black/[0.045] px-2 py-1 text-sm text-gray-800 dark:bg-white/[0.07] dark:text-gray-200">reference:Arrival</code></dd>
              </div>
            </dl>
          </div>
        </template>
      </NDrawer>
    </ClientOnly>

  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { SearchResults } from '~/types'
import { useSearchStore } from '~/stores/search'
import { useVerbatimsSeo } from '~/composables/useSeo'
import { formatReferenceType, getReferenceIcon } from '~/utils/reference'
import { hasEditableFocus, isPrintableSearchKey } from '~/utils/search-keyboard'
import { getReferenceIconTone } from '#shared/constants/reference'

const appReady = useState('app-ready', () => false)
const hydrated = ref(appReady.value)
const initialDataReady = ref(false)

onNuxtReady(() => {
  hydrated.value = true
})

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const isSearchHelpOpen = ref(false)

definePageMeta({
  layout: 'default',
  keepalive: true
})

const { $t } = useI18n()

function translateReferenceType(type: string | undefined | null): string {
  if (!type) return ''
  const key = `reference_types.${type}`
  const translated = String($t(key))
  return translated === key ? formatReferenceType(type) : translated
}

useVerbatimsSeo({
  title: $t('meta_title') as string,
  description: $t('meta_desc') as string,
  imagePath: '/api/og/pages/search.png',
  imageAlt: 'Search Verbatims quotes, authors, and references',
  type: 'website'
})

const suggestions = ref(searchStore.getRandomSuggestedSearch(5))
function refreshSuggestions() {
  suggestions.value = searchStore.getRandomSuggestedSearch(5)
}

// Keep unfinished filter syntax out of the actual query sent to the API.
const searchQuery = computed({
  get: () => searchStore.query,
  set: (v: string) => searchStore.setQuery(v)
})
// The URL is authoritative on entry; the shared store may still contain a
// previous query while route filters are being loaded and synchronized.
const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const searchInputElement = ref<HTMLInputElement | null>(null)

function focusSearchInput() {
  searchInputElement.value?.focus({ preventScroll: true })
}

function handleExplicitSearchFocus() {
  if (window.innerWidth < 768) focusSearchInput()
}

const searchResults = computed<SearchResults>(() => searchStore.results)
const recentSearches = computed<string[]>(() => searchStore.recent)
const renderedSearchQuery = ref('')
const isSearchPending = ref(false)
const showSearchLoading = ref(false)
const SEARCH_LOADING_DELAY = 180
let searchLoadingTimer: ReturnType<typeof setTimeout> | undefined
let searchUpdateSequence = 0

watch(isSearchPending, (pending) => {
  if (searchLoadingTimer) clearTimeout(searchLoadingTimer)
  searchLoadingTimer = undefined
  showSearchLoading.value = false

  if (!pending) return

  searchLoadingTimer = setTimeout(() => {
    searchLoadingTimer = undefined
    if (isSearchPending.value && searchResults.value.total === 0) {
      showSearchLoading.value = true
    }
  }, SEARCH_LOADING_DELAY)
})

type FilterOption = { label: string; value: string | number }
type FilterSuggestion = FilterOption & { detail?: string; icon?: string; iconTone?: string; kind?: 'author' | 'language' | 'reference'; imageUrl?: string }
type FilterCommand = { kind: 'author' | 'language' | 'reference'; prefix: string; index: number }

const languageOptions: FilterOption[] = [
  { label: $t('languages.en') as string, value: 'en' },
  { label: $t('languages.fr') as string, value: 'fr' },
  { label: $t('languages.la') as string, value: 'la' },
]
const selectedLanguage = ref<FilterOption>()
const selectedAuthor = ref<FilterOption>()
const selectedReference = ref<FilterOption>()
const authorOptions = ref<FilterOption[]>([])
const referenceOptions = ref<FilterOption[]>([])
const filterOptionsReady = ref(false)
const authorSuggestions = ref<FilterSuggestion[]>([])
const referenceSuggestions = ref<FilterSuggestion[]>([])
const activeSuggestionIndex = ref(-1)
const filterSuggestionMessage = ref('')
let suggestionRequestSequence = 0
let applyingRouteState = false
const hasActiveFilters = computed(() => Boolean(
  selectedLanguage.value || selectedAuthor.value || selectedReference.value
))
const activeFilterItems = computed(() => [
  ...(selectedLanguage.value ? [{ key: 'language', label: selectedLanguage.value.label, remove: () => { selectedLanguage.value = undefined } }] : []),
  ...(selectedAuthor.value ? [{ key: 'author', label: selectedAuthor.value.label, remove: () => { selectedAuthor.value = undefined } }] : []),
  ...(selectedReference.value ? [{ key: 'reference', label: selectedReference.value.label, remove: () => { selectedReference.value = undefined } }] : [])
])

const filterCommand = computed<FilterCommand | null>(() => {
  const match = /(?:^|\s)(author|a|language|l|reference|r):([^\s]*)$/i.exec(searchInput.value)
  if (!match) return null
  const tokenOffset = match[0].startsWith(' ') ? 1 : 0
  const alias = (match[1] || '').toLowerCase()
  return {
    kind: alias === 'a' || alias === 'author' ? 'author' : alias === 'l' || alias === 'language' ? 'language' : 'reference',
    prefix: match[2] || '',
    index: match.index + tokenOffset
  }
})
const showMobileResultSummary = computed(() => Boolean(
  !filterCommand.value && (searchInput.value.trim() || hasActiveFilters.value)
))

const filterSuggestions = computed<FilterSuggestion[]>(() => {
  const command = filterCommand.value
  if (!command) return []
  const prefix = command.prefix.trim().toLocaleLowerCase()
  if (command.kind === 'language') {
    return languageOptions
      .filter(option => !prefix || option.label.toLocaleLowerCase().includes(prefix) || String(option.value).startsWith(prefix))
      .map(option => ({ ...option }))
  }
  return command.kind === 'author' ? authorSuggestions.value : referenceSuggestions.value
})

const debouncedLoadCommandSuggestions = useDebounceFn(async (command: FilterCommand, requestSequence: number) => {
  if (command.kind === 'language') return
  if (command.prefix.trim().length < 2) {
    filterSuggestionMessage.value = String($t('filter_suggestions_min_chars'))
    return
  }

  filterSuggestionMessage.value = String($t('filter_suggestions_loading'))
  try {
    if (command.kind === 'author') {
      const response = await $fetch('/api/authors/search', { params: { q: command.prefix, limit: 8 } })
      if (requestSequence !== suggestionRequestSequence) return
      authorSuggestions.value = (response.data || []).map(author => ({ label: author.name, value: author.id, detail: author.job || undefined, kind: 'author', imageUrl: author.image_url || undefined }))
    } else {
      const response = await $fetch<ApiResponse<QuoteReference[]>, '/api/references/search'>('/api/references/search', { params: { q: command.prefix, limit: 8 } })
      if (requestSequence !== suggestionRequestSequence) return
      referenceSuggestions.value = (response.data || []).map((reference) => {
        // Legacy rows may store import timestamps instead of a publication date.
        const releaseYear = reference.release_date?.match(/^(\d{4})(?:-\d{2}-\d{2})?$/)?.[1]
        const detail = [translateReferenceType(reference.primary_type), releaseYear].filter(Boolean).join(' · ')

        return {
          label: reference.name,
          value: reference.id,
          detail,
          kind: 'reference',
          imageUrl: reference.image_url || undefined,
          icon: getReferenceIcon(reference.primary_type),
          iconTone: getReferenceIconTone(reference.primary_type),
        }
      })
    }
    filterSuggestionMessage.value = String($t('filter_suggestions_empty'))
  } catch (error) {
    if (requestSequence === suggestionRequestSequence) {
      console.error('Failed to load filter suggestions:', error)
      filterSuggestionMessage.value = String($t('filter_suggestions_empty'))
    }
  }
}, 180)

watch(filterCommand, (command) => {
  const requestSequence = ++suggestionRequestSequence
  activeSuggestionIndex.value = -1
  authorSuggestions.value = []
  referenceSuggestions.value = []
  filterSuggestionMessage.value = ''
  if (!command) return
  if (command.kind !== 'language' && command.prefix.trim().length < 2) {
    filterSuggestionMessage.value = String($t('filter_suggestions_min_chars'))
    return
  }
  if (command.kind !== 'language') filterSuggestionMessage.value = String($t('filter_suggestions_loading'))
  void debouncedLoadCommandSuggestions(command, requestSequence)
})

watch(activeSuggestionIndex, (index) => {
  if (!import.meta.client || index < 0) return

  void nextTick(() => {
    const list = document.getElementById('search-filter-suggestions')
    const option = document.getElementById(`search-filter-option-${index}`)
    if (!list || !option) return

    const listBounds = list.getBoundingClientRect()
    const optionBounds = option.getBoundingClientRect()
    let scrollTop = list.scrollTop
    if (optionBounds.top < listBounds.top) {
      scrollTop -= listBounds.top - optionBounds.top
    } else if (optionBounds.bottom > listBounds.bottom) {
      scrollTop += optionBounds.bottom - listBounds.bottom
    }

    if (scrollTop !== list.scrollTop) {
      list.scrollTo({
        top: scrollTop,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      })
    }
  })
})

function clearFilters() {
  applyingRouteState = true
  selectedLanguage.value = undefined
  selectedAuthor.value = undefined
  selectedReference.value = undefined
  applyingRouteState = false
  scheduleSearch()
}

function clearSearchQuery() {
  searchInput.value = ''
  searchQuery.value = ''
  if (hasActiveFilters.value) {
    searchStore.rememberSearch({
      query: '',
      language: selectedLanguage.value?.value,
      author: selectedAuthor.value?.value,
      reference: selectedReference.value?.value
    })
  } else {
    searchStore.resetSearch()
  }
  scheduleSearch()
}

function handleSearchInput() {
  if (filterCommand.value) return
  searchQuery.value = searchInput.value
  if (!searchInput.value.trim() && !hasActiveFilters.value) searchStore.resetSearch()
  scheduleSearch()
}

function handleTypeToSearch(event: KeyboardEvent) {
  if (!searchInputElement.value) return
  if (document.querySelector('[role="dialog"]')) return
  if (!isPrintableSearchKey(event) || hasEditableFocus()) return

  event.preventDefault()
  searchInput.value += event.key
  focusSearchInput()
  handleSearchInput()
}

function handleSearchKeydown(event: KeyboardEvent) {
  if (!filterCommand.value || filterSuggestions.value.length === 0) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeSuggestionIndex.value = (activeSuggestionIndex.value + 1) % filterSuggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeSuggestionIndex.value = activeSuggestionIndex.value <= 0 ? filterSuggestions.value.length - 1 : activeSuggestionIndex.value - 1
  } else if (event.key === 'Enter' && activeSuggestionIndex.value >= 0) {
    event.preventDefault()
    selectFilterSuggestion(filterSuggestions.value[activeSuggestionIndex.value]!)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    searchInput.value = searchInput.value.slice(0, filterCommand.value.index).trimEnd()
    searchQuery.value = searchInput.value
    scheduleSearch()
  }
}

function selectFilterSuggestion(option: FilterSuggestion) {
  const command = filterCommand.value
  if (!command) return
  searchInput.value = searchInput.value.slice(0, command.index).trimEnd()
  applyingRouteState = true
  searchQuery.value = searchInput.value
  if (command.kind === 'language') selectedLanguage.value = option
  else if (command.kind === 'author') selectedAuthor.value = option
  else selectedReference.value = option
  applyingRouteState = false
  scheduleSearch()
}

function setSearchTerm(value: string) {
  searchInput.value = value
  searchQuery.value = value
  scheduleSearch()
}

async function loadFilterOptions() {
  const [authorsData, referencesData] = await Promise.all([
    $fetch('/api/authors?limit=100'),
    $fetch('/api/references?limit=100')
  ])

  authorOptions.value = (authorsData.data || []).map(author => ({
    label: author.name,
    value: author.id
  }))
  referenceOptions.value = (referencesData.data || []).map(reference => ({
    label: reference.name,
    value: reference.id
  }))
}

function routeValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

async function syncFiltersFromRoute(forceSearch = false) {
  if (!filterOptionsReady.value || route.path !== '/search') return

  const routeQuery = routeValue(route.query.q)
  const routeLanguage = routeValue(route.query.language)
  const routeAuthor = routeValue(route.query.author)
  const routeReference = routeValue(route.query.reference)
  const hasRouteSearch = Boolean(routeQuery || routeLanguage || routeAuthor || routeReference)
  const remembered = !hasRouteSearch ? searchStore.lastSearch : null
  const query = hasRouteSearch ? routeQuery : remembered?.query || ''
  const language = hasRouteSearch ? routeLanguage : String(remembered?.language ?? '')
  const author = hasRouteSearch ? routeAuthor : String(remembered?.author ?? '')
  const reference = hasRouteSearch ? routeReference : String(remembered?.reference ?? '')
  const currentLanguage = String(selectedLanguage.value?.value ?? '')
  const currentAuthor = String(selectedAuthor.value?.value ?? '')
  const currentReference = String(selectedReference.value?.value ?? '')
  const changed = query !== searchInput.value || query !== searchStore.query || language !== currentLanguage || author !== currentAuthor || reference !== currentReference

  if (!changed && !forceSearch) return

  applyingRouteState = true
  searchInput.value = query
  searchStore.setQuery(query)
  selectedLanguage.value = languageOptions.find(option => String(option.value) === language)
  selectedAuthor.value = authorOptions.value.find(option => String(option.value) === author)
  selectedReference.value = referenceOptions.value.find(option => String(option.value) === reference)
  applyingRouteState = false

  if (query || language || author || reference) {
    if (remembered && !hasRouteSearch) {
      const restoredRouteQuery: Record<string, string | number> = {}
      if (query) restoredRouteQuery.q = query
      if (language) restoredRouteQuery.language = language
      if (author) restoredRouteQuery.author = author
      if (reference) restoredRouteQuery.reference = reference
      await router.replace({ path: '/search', query: restoredRouteQuery })
    }

    const searchOptions = {
      limit: 50,
      language: selectedLanguage.value?.value,
      author: selectedAuthor.value?.value,
      reference: selectedReference.value?.value
    }

    searchStore.rememberSearch({
      query,
      language: searchOptions.language,
      author: searchOptions.author,
      reference: searchOptions.reference
    })

    // A remembered result set stays visible immediately on return. Refresh it
    // only when it is stale, rather than clearing it during route sync.
    if (hasRouteSearch || forceSearch && !remembered || searchStore.isStale()) {
      const updateSequence = ++searchUpdateSequence
      isSearchPending.value = true
      try {
        await searchStore.search(searchOptions)
        if (updateSequence === searchUpdateSequence) renderedSearchQuery.value = query
      } finally {
        if (updateSequence === searchUpdateSequence) isSearchPending.value = false
      }
    } else {
      renderedSearchQuery.value = query
      isSearchPending.value = false
    }
  } else {
    searchUpdateSequence++
    searchStore.resetSearch()
    renderedSearchQuery.value = ''
    isSearchPending.value = false
  }
}

watch(
  () => [route.path, route.query.q, route.query.language, route.query.author, route.query.reference],
  () => { void syncFiltersFromRoute() }
)

const debouncedSearch = useDebounceFn(async (updateSequence: number) => {
  const q = searchQuery.value.trim()
  const query: Record<string, string | number> = {}
  if (q) query.q = q
  if (selectedLanguage.value) query.language = selectedLanguage.value.value
  if (selectedAuthor.value) query.author = selectedAuthor.value.value
  if (selectedReference.value) query.reference = selectedReference.value.value

  if (q || hasActiveFilters.value) {
    searchStore.rememberSearch({
      query: q,
      language: selectedLanguage.value?.value,
      author: selectedAuthor.value?.value,
      reference: selectedReference.value?.value
    })
  } else {
    searchStore.resetSearch()
  }

  try {
    // Keep the search term and quote filters shareable and back/forward aware.
    await router.replace({ path: '/search', query })
    const hasFilters = hasActiveFilters.value
    if (q || hasFilters) {
      await searchStore.search({
        limit: 50,
        language: selectedLanguage.value?.value,
        author: selectedAuthor.value?.value,
        reference: selectedReference.value?.value
      })
    } else {
      renderedSearchQuery.value = ''
      await Promise.all([fetchRandomAuthors(4), fetchRandomReferences(4)])
    }

    if (updateSequence === searchUpdateSequence) renderedSearchQuery.value = q
  } finally {
    if (updateSequence === searchUpdateSequence) isSearchPending.value = false
  }
}, 300)

function scheduleSearch() {
  isSearchPending.value = true
  void debouncedSearch(++searchUpdateSequence)
}

onBeforeUnmount(() => {
  if (searchLoadingTimer) clearTimeout(searchLoadingTimer)
  window.removeEventListener('keydown', handleTypeToSearch)
  window.removeEventListener('verbatims:focus-search-page-input', handleExplicitSearchFocus)
})

watch(hydrated, (ready) => {
  if (ready && window.innerWidth >= 768) void nextTick(focusSearchInput)
}, { flush: 'post' })

watch([selectedLanguage, selectedAuthor, selectedReference], () => {
  if (filterOptionsReady.value && !applyingRouteState) scheduleSearch()
}, { flush: 'sync' })

// Keep store in sync when user navigates back/forward
const randomAuthors = ref<any[]>([])
const randomReferences = ref<any[]>([])

async function fetchRandomAuthors(n = 4) {
  try {
    const res = await $fetch('/api/authors/random', { params: { count: n } })
    randomAuthors.value = res.authors || []
  } catch (e) {
    randomAuthors.value = []
  }
}

async function fetchRandomReferences(n = 4) {
  try {
    const res = await $fetch('/api/references/random', { params: { count: n } })
    randomReferences.value = res.references || []
  } catch (e) {
    randomReferences.value = []
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleTypeToSearch)
  window.addEventListener('verbatims:focus-search-page-input', handleExplicitSearchFocus)
  if (window.innerWidth >= 768) void nextTick(focusSearchInput)

  try {
    try {
      await loadFilterOptions()
    } catch (error) {
      console.error('Failed to load search filter options:', error)
    }
    filterOptionsReady.value = true
    await syncFiltersFromRoute(true)

    // Fetch random authors/references if no search query
    if (!searchStore.query.trim() && !hasActiveFilters.value) {
      await Promise.all([
        fetchRandomAuthors(4),
        fetchRandomReferences(4)
      ])
    }
  } finally {
    initialDataReady.value = true
  }
})

onActivated(() => {
  window.addEventListener('keydown', handleTypeToSearch)
  if (window.innerWidth >= 768) void nextTick(focusSearchInput)
})

onDeactivated(() => {
  window.removeEventListener('keydown', handleTypeToSearch)
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
}

.search-filter-chip {
  @apply inline-flex min-h-11 max-w-full shrink-0 items-center gap-2 rounded-md bg-black/[0.06] px-3 py-1 font-sans text-xs font-600 text-gray-700 transition-[transform,background-color,color] duration-150 hover:bg-black/[0.1] active:scale-99 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:bg-white/[0.09] dark:text-gray-200 dark:hover:bg-white/[0.14] dark:focus-visible:outline-gray-200 md:min-h-8;
}

.search-filter-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.search-filter-scroller::-webkit-scrollbar {
  display: none;
}

.search-results-heading {
  @apply font-sans text-xs font-700 uppercase tracking-[0.12em] text-gray-600 dark:text-gray-400;
}

:global(#search-filter-suggestions [role="option"][aria-selected="true"]) {
  color: #111827;
}

:global(.dark #search-filter-suggestions [role="option"][aria-selected="true"]) {
  color: #fff;
}

.search-quote-underline {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1px;
  transition: background-size 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.search-quote-link:hover .search-quote-underline,
.search-quote-link:focus-visible .search-quote-underline {
  background-size: 100% 1px;
}

:deep(.search-results-enter-active) {
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--search-entry-delay, 0ms);
}

:deep(.search-results-leave-active) {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

:deep(.search-results-move) {
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.search-results-enter-from),
:deep(.search-results-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  :deep(.search-results-enter-active),
  :deep(.search-results-leave-active),
  :deep(.search-results-move) {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }

  .search-quote-underline {
    transition: none;
  }
}
</style>
