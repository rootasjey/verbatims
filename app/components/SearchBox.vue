<template>
  <SearchBoxOverlay v-if="isOpen" v-model:open="isOpen" :mobile="isMobile">
    <NCard class="border-none m-0 p-0 shadow-none" :class="isMobile ? 'search-box-mobile-card' : ''">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-serif font-400 text-gray-900 dark:text-white" :class="isMobile ? 'text-2xl' : 'text-3xl'">
            {{ mode === 'nav' ? $t('components.search_box.quick_nav') : mode === 'cmd' ? $t('components.search_box.commands') : $t('components.search_box.search') }}
          </h3>
          <NButton
            btn="ghost-gray"
            size="sm"
            icon
            label="i-ph-x"
            class="mr-3"
            :aria-label="String($t('common.close'))"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div :class="isMobile ? 'search-box-mobile-content' : 'space-y-6'">
        <div :class="isMobile ? 'search-box-mobile-search-row' : ''">
          <NInput
            v-model="storeQuery"
            :class="isMobile ? 'min-w-0 flex-1' : ''"
            :aria-label="$t('components.search_box.search_placeholder') as string"
            aria-controls="search-result-list"
            :aria-activedescendant="activeDescendantId"
            :placeholder="mode === 'nav' ? $t('components.search_box.navigate_placeholder') as string : mode === 'cmd' ? $t('components.search_box.command_placeholder') as string : $t('components.search_box.search_placeholder') as string"
            leading="i-ph-magnifying-glass"
            size="md"
            autofocus
            :una="{ input: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400 focus-visible:border-gray-500 dark:focus-visible:border-gray-400', inputTrailingWrapper: 'pointer-events-auto' }"
            @input="debouncedSearch"
          >
            <template #trailing>
              <NTooltip v-if="mode === 'search' && storeQuery.trim()" :content="$t('components.search_box.clear_search') as string">
                <button
                  type="button"
                  :aria-label="$t('components.search_box.clear_search') as string"
                  class="flex h-8 w-8 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-800 dark:hover:text-white dark:focus-visible:outline-gray-200"
                  @click="clearSearchQuery"
                >
                  <NIcon name="i-tabler-eraser" class="h-4 w-4" aria-hidden="true" />
                </button>
              </NTooltip>
            </template>
          </NInput>
        </div>

        <!-- Search Results / Navigation -->
        <div
          id="search-result-list"
          class="relative isolate overflow-y-auto pr-1"
          :class="isMobile ? 'search-box-mobile-results' : 'search-box-desktop-results'"
          ref="resultsContainer"
          :aria-label="mode === 'search' && !storeQuery.trim() ? undefined : mode === 'search' ? $t('components.search_box.search_results') as string : mode === 'nav' ? $t('components.search_box.quick_nav') as string : $t('components.search_box.commands') as string"
          :aria-busy="mode === 'search' ? loading || browseSuggestionsLoading : undefined"
          :role="mode !== 'search' || storeQuery.trim() ? 'listbox' : undefined"
        >
          <div
            v-if="mode === 'search' && selectionIndicator && (selectedIndex >= 0 || (isEmptySearchState && emptyStateSelectedIndex >= 0))"
            aria-hidden="true"
            class="pointer-events-none absolute left-0 top-0 z-0 rounded-lg bg-gray-100 transition-[transform,width,height,background-color] duration-200 ease-out motion-reduce:transition-none"
            :class="isSearchBadgeHighlighted ? 'dark:bg-stone-700/80' : 'dark:bg-gray-800/70'"
            :style="{
              width: `${selectionIndicator.width}px`,
              height: `${selectionIndicator.height}px`,
              transform: `translate3d(${selectionIndicator.x}px, ${selectionIndicator.y}px, 0)`
            }"
          />
          <template v-if="mode === 'search'">
            <div v-if="loading && totalResults === 0" class="min-h-full">
              <div v-if="showLoadingState" class="space-y-5 py-4" role="status">
                <span class="sr-only">{{ $t('components.search_box.searching') }}</span>
                <div v-for="i in 3" :key="i" class="animate-pulse border-b border-gray-200 pb-4 dark:border-gray-800">
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <span v-else class="sr-only" role="status">{{ $t('components.search_box.searching') }}</span>
            </div>

            <div v-else-if="hasNoResultsForCurrentQuery" class="space-y-1 py-4" role="status">
              <template v-if="storeQuery.trim().length < 2">
                <p class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
                  {{ $t('components.search_box.no_results_short_query_hint') }}
                </p>
              </template>
              <template v-else>
                <p class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
                  {{ $t('components.search_box.no_results_for', { query: storeQuery }) }}
                </p>
                <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('components.search_box.no_results_hint') }}
                </p>
              </template>
            </div>

            <div
              v-else-if="totalResults > 0"
              class="grid gap-8"
              :class="searchResults.quotes?.length && (searchResults.authors?.length || searchResults.references?.length) ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.9fr)]' : 'lg:grid-cols-1'"
            >
              <!-- Quotes Section -->
              <section v-if="searchResults.quotes?.length > 0" role="group" :aria-label="$t('components.search_box.results_quotes') as string">
                <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {{ $t('components.search_box.results_quotes') }}
                  <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.quotes.length }})</span>
                </h4>
                <TransitionGroup
                  name="search-box-results"
                  tag="div"
                  class="relative space-y-1"
                  :class="isMobile ? '-ml-3' : ''"
                  appear
                >
                  <div
                    v-for="(quote, index) in searchResults.quotes"
                    :key="`quote-${quote.id}`"
                    :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }"
                    :ref="el => setResultRef(el, 'quotes', index)"
                    :id="resultId('quote', quote.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('quotes', index)"
                    tabindex="-1"
                    class="relative cursor-pointer rounded-lg px-3 py-4 first:pt-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400 motion-reduce:transition-none"
                    :class="selectedIndex === getGlobalIndex('quotes', index) ? 'z-10 bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @mouseenter="selectResultIndex(getGlobalIndex('quotes', index))"
                    @click="selectResult(quote, 'quote')"
                  >
                    <p class="font-serif text-lg leading-relaxed text-gray-900 dark:text-gray-100 line-clamp-2" v-html="highlightText(quote.name)"></p>
                    <div class="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span v-if="quote.author_name" class="font-600 text-gray-800 dark:text-gray-200">{{ quote.author_name }}</span>
                      <span v-if="quote.author_name && quote.reference_name" aria-hidden="true">·</span>
                      <span v-if="quote.reference_name">{{ quote.reference_name }}</span>
                    </div>
                  </div>
                </TransitionGroup>
              </section>

              <div class="space-y-7">
                <!-- Authors Section -->
                <section v-if="searchResults.authors?.length > 0" role="group" :aria-label="$t('components.search_box.results_authors') as string">
                  <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_authors') }}
                    <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.authors.length }})</span>
                  </h4>
                  <TransitionGroup name="search-box-results" tag="div" class="relative grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2" appear>
                  <div
                    v-for="(author, index) in searchResults.authors"
                    :key="`author-${author.id}`"
                    :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }"
                    :ref="el => setResultRef(el, 'authors', index)"
                    :id="resultId('author', author.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('authors', index)"
                    tabindex="-1"
                    class="relative flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-150 motion-reduce:transition-none"
                    :class="selectedIndex === getGlobalIndex('authors', index) ? 'z-10 bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @mouseenter="selectResultIndex(getGlobalIndex('authors', index))"
                    @click="selectResult(author, 'author')"
                  >
                    <NAvatar :src="author.image_url" :alt="author.name" size="sm" class="shrink-0" />
                    <div class="min-w-0">
                      <NTooltip :content="author.name" :_tooltip-content="{ side: 'top', class: 'max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal break-words text-left' }">
                        <p class="truncate text-sm font-600 text-gray-900 dark:text-white" v-html="highlightText(author.name)"></p>
                      </NTooltip>
                      <p class="truncate text-xs text-gray-600 dark:text-gray-400">{{ author.job || $t('components.search_box.quote_count', { count: author.quotes_count || 0 }) }}</p>
                    </div>
                  </div>
                  </TransitionGroup>
                </section>

                <!-- References Section -->
                <section v-if="searchResults.references?.length > 0" role="group" :aria-label="$t('components.search_box.results_references') as string">
                  <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_references') }}
                    <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.references.length }})</span>
                  </h4>
                  <TransitionGroup name="search-box-results" tag="div" class="relative grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2" appear>
                  <div
                    v-for="(reference, index) in searchResults.references"
                    :key="`reference-${reference.id}`"
                    :style="{ '--search-entry-delay': `${Math.min(index, 8) * 18}ms` }"
                    :ref="el => setResultRef(el, 'references', index)"
                    :id="resultId('reference', reference.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('references', index)"
                    tabindex="-1"
                    class="relative flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-150 motion-reduce:transition-none"
                    :class="selectedIndex === getGlobalIndex('references', index) ? 'z-10 bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @mouseenter="selectResultIndex(getGlobalIndex('references', index))"
                    @click="selectResult(reference, 'reference')"
                  >
                    <NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="sm" class="shrink-0">
                      <template #fallback>
                        <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <NIcon :name="getReferenceIcon(reference.primary_type)" class="w-4 h-4" />
                        </div>
                      </template>
                    </NAvatar>
                    <div class="min-w-0">
                      <NTooltip :content="reference.name" :_tooltip-content="{ side: 'top', class: 'max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal break-words text-left' }">
                        <p class="truncate text-sm font-600 text-gray-900 dark:text-white" v-html="highlightText(reference.name)"></p>
                      </NTooltip>
                      <p class="truncate text-xs text-gray-600 dark:text-gray-400">{{ $t('components.search_box.quote_count', { count: reference.quotes_count || 0 }) }}</p>
                    </div>
                  </div>
                  </TransitionGroup>
                </section>
              </div>
            </div>

            <div v-else class="space-y-6 py-5">
              <section v-if="recentSearches.length" :aria-labelledby="'search-box-recent-heading'">
                <h4 id="search-box-recent-heading" class="mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {{ $t('components.search_box.recent_searches') }}
                </h4>
                <div class="flex flex-wrap gap-2 px-1 py-1">
                  <div
                    v-for="(search, index) in recentSearches"
                    :key="`recent-${search}`"
                    :data-empty-state-highlight-index="getEmptyStateIndex('recent', index)"
                    class="relative inline-flex min-h-9 items-center gap-1 rounded-md pl-3 pr-1"
                    :class="emptyStateSelectedIndex === getEmptyStateIndex('recent', index) ? 'z-10 bg-transparent' : 'bg-gray-100/80 dark:bg-white/[0.07]'"
                  >
                    <button
                      type="button"
                      :data-empty-state-index="getEmptyStateIndex('recent', index)"
                      class="inline-flex min-h-9 items-center gap-2 font-sans text-sm text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none dark:text-gray-300 dark:hover:text-white"
                      @click="startSearch(search)"
                      @mouseenter="handleEmptyStatePointer(getEmptyStateIndex('recent', index))"
                    >
                      <NIcon name="i-ph-clock-counter-clockwise" class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      {{ search }}
                    </button>
                    <NTooltip :content="$t('components.search_box.remove_recent', { search }) as string">
                      <button
                        type="button"
                        :aria-label="$t('components.search_box.remove_recent', { search }) as string"
                        class="flex h-7 w-7 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-800 dark:hover:text-white dark:focus-visible:outline-gray-200"
                        @click="searchStore.removeRecent(search)"
                      >
                        <NIcon name="i-ph-x" class="h-3 w-3" aria-hidden="true" />
                      </button>
                    </NTooltip>
                  </div>
                </div>
              </section>

              <section :aria-labelledby="'search-box-suggested-heading'">
                <h4 id="search-box-suggested-heading" class="mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {{ $t('components.search_box.suggested_searches') }}
                </h4>
                <div class="flex flex-wrap gap-2 px-1 py-1">
                  <button
                    v-for="(suggestion, index) in emptyStateSuggestions"
                    :key="`suggested-${suggestion.text}`"
                    type="button"
                    :data-empty-state-index="getEmptyStateIndex('suggested', index)"
                    class="inline-flex min-h-9 items-center gap-2 rounded-md px-3 font-sans text-sm text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none dark:text-gray-300 dark:hover:text-white"
                    :data-empty-state-highlight-index="getEmptyStateIndex('suggested', index)"
                    :class="emptyStateSelectedIndex === getEmptyStateIndex('suggested', index) ? 'relative z-10 bg-transparent' : 'bg-gray-100/80 hover:bg-gray-200/80 dark:bg-white/[0.07] dark:hover:bg-white/[0.12]'"
                    @click="startSearch(suggestion.text)"
                    @mouseenter="handleEmptyStatePointer(getEmptyStateIndex('suggested', index))"
                  >
                    <NIcon :name="suggestion.icon" class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    {{ suggestion.text }}
                  </button>
                </div>
              </section>

              <div v-if="browseSuggestionsLoading || browseAuthors.length > 0 || browseReferences.length > 0" class="grid min-w-0 gap-x-8 gap-y-5 border-t border-gray-200 pt-5 dark:border-gray-800 sm:grid-cols-2">
                <section v-if="browseSuggestionsLoading || browseAuthors.length > 0" class="min-w-0" :aria-labelledby="'search-box-browse-authors-heading'">
                  <h4 id="search-box-browse-authors-heading" class="mb-2 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_authors') }}
                  </h4>
                  <div v-if="browseSuggestionsLoading && browseAuthors.length === 0" class="space-y-3" aria-hidden="true">
                    <div v-for="index in 3" :key="`author-skeleton-${index}`" class="flex items-center gap-2">
                      <div class="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                      <div class="min-w-0 flex-1 space-y-1.5">
                        <div class="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                        <div class="h-2.5 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="space-y-1 px-1">
                    <NuxtLink
                      v-for="(author, index) in browseAuthors"
                      :key="`browse-author-${author.id}`"
                      :to="`/authors/${author.id}`"
                      :data-empty-state-index="getEmptyStateIndex('author', index)"
                      :data-empty-state-highlight-index="getEmptyStateIndex('author', index)"
                      class="group relative flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 focus-visible:outline-none"
                      :class="emptyStateSelectedIndex === getEmptyStateIndex('author', index) ? 'z-10 bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'"
                      @click="closeAndNavigate"
                      @mouseenter="handleEmptyStatePointer(getEmptyStateIndex('author', index))"
                    >
                      <NAvatar :src="author.image_url || undefined" alt="" size="sm" class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99">
                        <template #fallback>
                          <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <NIcon name="i-ph-user-circle-duotone" class="h-5 w-5" aria-hidden="true" />
                          </div>
                        </template>
                      </NAvatar>
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-600 text-gray-800 transition-colors group-hover:text-gray-950 dark:text-gray-200 dark:group-hover:text-white">{{ author.name }}</span>
                        <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{{ author.job || $t('components.search_box.quote_count', { count: author.quotes_count || 0 }) }}</span>
                      </span>
                    </NuxtLink>
                  </div>
                </section>

                <section v-if="browseSuggestionsLoading || browseReferences.length > 0" class="min-w-0" :aria-labelledby="'search-box-browse-references-heading'">
                  <h4 id="search-box-browse-references-heading" class="mb-2 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_references') }}
                  </h4>
                  <div v-if="browseSuggestionsLoading && browseReferences.length === 0" class="space-y-3" aria-hidden="true">
                    <div v-for="index in 3" :key="`reference-skeleton-${index}`" class="flex items-center gap-2">
                      <div class="h-8 w-8 shrink-0 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
                      <div class="min-w-0 flex-1 space-y-1.5">
                        <div class="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                        <div class="h-2.5 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-900" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="space-y-1 px-1">
                    <NuxtLink
                      v-for="(reference, index) in browseReferences"
                      :key="`browse-reference-${reference.id}`"
                      :to="`/references/${reference.id}`"
                      :data-empty-state-index="getEmptyStateIndex('reference', index)"
                      :data-empty-state-highlight-index="getEmptyStateIndex('reference', index)"
                      class="group relative flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 focus-visible:outline-none"
                      :class="emptyStateSelectedIndex === getEmptyStateIndex('reference', index) ? 'z-10 bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'"
                      @click="closeAndNavigate"
                      @mouseenter="handleEmptyStatePointer(getEmptyStateIndex('reference', index))"
                    >
                      <NAvatar :src="reference.image_url || undefined" alt="" rounded="2" size="sm" class="shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-99">
                        <template #fallback>
                          <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <NIcon :name="getReferenceIcon(reference.primary_type)" class="h-4 w-4" aria-hidden="true" />
                          </div>
                        </template>
                      </NAvatar>
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-600 text-gray-800 transition-colors group-hover:text-gray-950 dark:text-gray-200 dark:group-hover:text-white">{{ reference.name }}</span>
                        <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{{ $t('components.search_box.quote_count', { count: reference.quotes_count || 0 }) }}</span>
                      </span>
                    </NuxtLink>
                  </div>
                </section>
              </div>
            </div>

          </template>

          <template v-else-if="mode === 'nav'">
            <div v-if="filteredNavItems.length > 0" class="space-y-1" role="group" :aria-label="$t('components.search_box.quick_nav') as string">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center px-1">
                <NIcon name="i-ph-compass" class="w-4 h-4 mr-2" />
                {{ $t('components.search_box.quick_nav') }}
              </h4>
              <div
                v-for="(item, index) in filteredNavItems"
                :key="`nav-${item.to}`"
                :data-nav-index="index"
                :id="navResultId(index)"
                role="option"
                :aria-selected="selectedNavIndex === index"
                tabindex="-1"
                class="cursor-pointer rounded-lg px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400"
                :class="selectedNavIndex === index ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                @click="navigateToNavItem(item)"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                    <NIcon :name="item.icon" class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <NIcon name="i-ph-compass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.no_results') }}</p>
            </div>
          </template>

          <template v-else-if="mode === 'cmd'">
            <div v-if="filteredCmdItems.length > 0" class="space-y-1" role="group" :aria-label="$t('components.search_box.commands') as string">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center px-1">
                <NIcon name="i-ph-terminal" class="w-4 h-4 mr-2" />
                {{ $t('components.search_box.commands') }}
              </h4>
              <div
                v-for="(item, index) in filteredCmdItems"
                :key="`cmd-${item.action}`"
                :data-cmd-index="index"
                :id="cmdResultId(index)"
                role="option"
                :aria-selected="selectedCmdIndex === index"
                tabindex="-1"
                class="cursor-pointer rounded-lg px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400"
                :class="selectedCmdIndex === index ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                @click="executeCmdItem(item)"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                    <NIcon :name="item.icon" class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description }}</p>
                  </div>
                  <span v-if="item.shortcut" class="text-xs text-gray-400 dark:text-gray-500 font-mono shrink-0 ml-2">{{ item.shortcut }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <NIcon name="i-ph-terminal" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.no_results') }}</p>
            </div>
          </template>
        </div>
      </div>

      <template #footer v-if="!isMobile">
        <div class="mx-3 overflow-x-auto">
          <div class="flex w-full min-w-max items-center justify-between gap-x-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
            <span v-if="mode !== 'search' || storeQuery.trim()" class="shrink-0 font-600">{{ totalResults }} {{ $t('components.search_box.results') }}</span>
            <div class="flex shrink-0 items-center gap-x-3">
              <span
                v-if="mode !== 'search' || storeQuery.trim()"
                aria-hidden="true"
                class="h-4 w-px shrink-0 bg-gray-300 dark:bg-gray-700"
              />
              <div class="flex shrink-0 items-center gap-x-3">
                <span v-if="mode === 'search'" class="shrink-0">{{ $t('components.search_box.mode_hint') }}</span>
                <span v-if="!isEmptySearchState" class="shrink-0">{{ $t('components.search_box.footer_navigate') }}</span>
                <span v-if="!isEmptySearchState" class="shrink-0">{{ $t('components.search_box.footer_select') }}</span>
              </div>
              <span aria-hidden="true" class="h-4 w-px shrink-0 bg-gray-300 dark:bg-gray-700" />
              <div class="flex shrink-0 items-center gap-x-3">
                <NTooltip :content="$t('components.search_box.footer_close_tooltip') as string">
                  <button
                    type="button"
                    class="rounded px-1 py-0.5 text-xs text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-gray-500"
                    @click="isOpen = false"
                  >
                    {{ $t('components.search_box.footer_close') }}
                  </button>
                </NTooltip>
                <NTooltip
                  v-if="mode === 'search' && storeQuery.trim()"
                  :content="`${$t('components.search_box.footer_open_search')} (${searchShortcut})`"
                >
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-gray-500"
                    :aria-keyshortcuts="searchShortcutAria"
                    @click="goToSearchPage"
                  >
                    {{ $t('components.search_box.view_all_results') }}
                    <kbd class="rounded border border-gray-300 px-1 py-0.5 text-[10px] leading-none text-gray-400 dark:border-gray-700 dark:text-gray-500">{{ searchShortcut }}</kbd>
                  </button>
                </NTooltip>
              </div>
            </div>
          </div>
        </div>
      </template>
    </NCard>

    <template #footer>
      <div v-if="isMobile && (mode !== 'search' || storeQuery.trim())" class="flex min-w-0 items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="font-600">{{ totalResults }} {{ $t('components.search_box.results') }}</span>
        <div v-if="mode === 'search' && storeQuery.trim()" class="flex shrink-0 items-center gap-3">
          <span aria-hidden="true" class="h-4 w-px bg-gray-300 dark:bg-gray-700" />
          <NTooltip :content="`${$t('components.search_box.footer_open_search')} (${searchShortcut})`">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-gray-500"
              :aria-keyshortcuts="searchShortcutAria"
              @click="goToSearchPage"
            >
              {{ $t('components.search_box.view_all_results') }}
              <kbd class="rounded border border-gray-300 px-1 py-0.5 text-[10px] leading-none text-gray-400 dark:border-gray-700 dark:text-gray-500">{{ searchShortcut }}</kbd>
            </button>
          </NTooltip>
        </div>
      </div>
    </template>
  </SearchBoxOverlay>
</template>

<script lang="ts" setup>
import { useSearchStore } from '~/stores/search'
import type { AuthorSearchResult, ProcessedQuoteResult, ReferenceSearchResult } from '~~/server/types';
import SearchBoxOverlay from '~/components/SearchBoxOverlay.vue'
import { hasEditableFocus, isPrintableSearchKey } from '~/utils/search-keyboard'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'action': [action: string]
}>()

const isOpen = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const { $t } = useI18n()
const { isMobile } = useMobileDetection()
const { loggedIn, user } = useUserSession()
const route = useRoute()
const searchStore = useSearchStore()
const storeQuery = computed({
  get: () => searchStore.query,
  set: (v: string) => searchStore.setQuery(v)
})

type NavItemAccess = 'public' | 'guest' | 'authenticated' | 'staff'

interface SearchNavItem {
  label: string
  icon: string
  description: string
  to: string
  access: NavItemAccess
  keywords?: string[]
}

const navItems = computed<SearchNavItem[]>(() => {
  const isStaff = user.value?.role === 'admin' || user.value?.role === 'moderator'

  const items: SearchNavItem[] = [
    { label: String($t('components.search_box.nav_home')), icon: 'i-ph-house', description: String($t('components.search_box.nav_home_desc')), to: '/', access: 'public' },
    { label: String($t('nav.authors')), icon: 'i-ph-users-duotone', description: String($t('nav.authors_desc')), to: '/authors', access: 'public' },
    { label: String($t('nav.references')), icon: 'i-ph-book-duotone', description: String($t('nav.references_desc')), to: '/references', access: 'public' },
    { label: String($t('nav.quotes')), icon: 'i-ph-quotes', description: String($t('nav.quotes_desc')), to: '/quotes', access: 'public' },
    { label: String($t('nav.tags')), icon: 'i-ph-tag-duotone', description: String($t('nav.tags_desc')), to: '/tags', access: 'public' },
    { label: String($t('components.search_box.nav_sign_in')), icon: 'i-ph-sign-in', description: String($t('components.search_box.nav_sign_in_desc')), to: '/login', access: 'guest', keywords: ['login', 'sign', 'signin'] },
    { label: String($t('components.search_box.nav_sign_up')), icon: 'i-ph-user-plus', description: String($t('components.search_box.nav_sign_up_desc')), to: '/signup', access: 'guest', keywords: ['signup', 'sign', 'register'] },
    { label: String($t('nav.dashboard')), icon: 'i-ph-square-split-vertical-duotone', description: String($t('nav.overview')), to: '/dashboard', access: 'authenticated' },
    { label: String($t('nav.admin')), icon: 'i-ph-shield-check', description: 'Admin panel', to: '/admin', access: 'staff' },
    { label: 'Pending Quotes', icon: 'i-ph-clock-countdown', description: 'Review and moderate pending quotes', to: '/admin/quotes/pending', access: 'staff' },
    { label: String($t('nav.drafts')), icon: 'i-ph-file-text', description: 'Manage quote drafts', to: '/admin/quotes/drafts', access: 'staff' },
    { label: 'Social Queue', icon: 'i-ph-share-network', description: 'Manage scheduled social media posts', to: '/admin/social-queue', access: 'staff' },
    { label: String($t('nav.tags')), icon: 'i-ph-tag-duotone', description: 'Manage tag taxonomy', to: '/admin/tags', access: 'staff' },
  ]

  return items.filter((item) => {
    if (item.access === 'guest') return !loggedIn.value
    if (item.access === 'authenticated') return loggedIn.value
    if (item.access === 'staff') return isStaff
    return true
  })
})

const cmdItems = computed((): any[] => [
  { label: $t('components.search_box.cmd_add_quote'), icon: 'i-ph-quotes-duotone', description: $t('components.search_box.cmd_add_quote_desc'), shortcut: '⌘A', action: 'add-quote' },
  { label: $t('components.search_box.cmd_report'), icon: 'i-ph-bug-duotone', description: $t('components.search_box.cmd_report_desc'), action: 'report-bug' },
  { label: $t('components.search_box.cmd_contact'), icon: 'i-ph-chat-circle-duotone', description: $t('components.search_box.cmd_contact_desc'), action: 'contact' },
])

const mode = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('@')) return 'nav'
  if (q.startsWith('/')) return 'cmd'
  return 'search'
})

const navQuery = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('@')) return q.slice(1).trim()
  return ''
})

const filteredNavItems = computed(() => {
  const items = navItems.value
  if (!navQuery.value) return items
  const q = navQuery.value.toLowerCase()
  return items.filter(item =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.keywords?.some(keyword => keyword.includes(q))
  )
})

const cmdQuery = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('/')) return q.slice(1).trim()
  return ''
})

const filteredCmdItems = computed(() => {
  const items = cmdItems.value
  if (!cmdQuery.value) return items
  const q = cmdQuery.value.toLowerCase()
  return items.filter((item: any) =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.action.toLowerCase().includes(q)
  )
})

const searchResults = computed(() => searchStore.results)
const recentSearches = computed(() => searchStore.recent.slice(0, 5))
const emptyStateSuggestions = searchStore.getRandomSuggestedSearch(5)
interface BrowseAuthorSuggestion {
  id: number
  name: string
  job?: string | null
  image_url?: string | null
  quotes_count?: number
}

interface BrowseReferenceSuggestion {
  id: number
  name: string
  primary_type: string
  image_url?: string | null
  quotes_count?: number
}

type EmptyStateItem =
  | { type: 'search'; value: string }
  | { type: 'author'; value: BrowseAuthorSuggestion }
  | { type: 'reference'; value: BrowseReferenceSuggestion }

const browseAuthors = ref<BrowseAuthorSuggestion[]>([])
const browseReferences = ref<BrowseReferenceSuggestion[]>([])
const browseSuggestionsLoading = ref(false)
const browseSuggestionsLoaded = ref(false)
const emptyStateSelectedIndex = ref(-1)
const isEmptySearchState = computed(() => mode.value === 'search' && !storeQuery.value.trim() && !loading.value)
const emptyStateItems = computed<EmptyStateItem[]>(() => [
  ...recentSearches.value.map(value => ({ type: 'search' as const, value })),
  ...emptyStateSuggestions.map(suggestion => ({ type: 'search' as const, value: suggestion.text })),
  ...browseAuthors.value.map(value => ({ type: 'author' as const, value })),
  ...browseReferences.value.map(value => ({ type: 'reference' as const, value }))
])
const isSearchBadgeHighlighted = computed(() =>
  isEmptySearchState.value && emptyStateItems.value[emptyStateSelectedIndex.value]?.type === 'search'
)
const getEmptyStateIndex = (section: 'recent' | 'suggested' | 'author' | 'reference', index: number) => {
  if (section === 'recent') return index
  if (section === 'suggested') return recentSearches.value.length + index
  if (section === 'author') return recentSearches.value.length + emptyStateSuggestions.length + index
  return recentSearches.value.length + emptyStateSuggestions.length + browseAuthors.value.length + index
}
const loading = computed(() => searchStore.loading)
const settledSearchQuery = ref<string | null>(null)
const hasNoResultsForCurrentQuery = computed(() => {
  const query = storeQuery.value.trim()
  return mode.value === 'search'
    && query.length > 0
    && settledSearchQuery.value === query
    && !loading.value
    && totalResults.value === 0
})
const showLoadingState = ref(false)
const selectionIndicator = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const selectedIndex = ref<number>(-1)
const selectedNavIndex = ref(-1)
const selectedCmdIndex = ref(-1)
const resultRefs = ref<{ quotes?: HTMLElement[]; authors?: HTMLElement[]; references?: HTMLElement[] }>({})
const resultsContainer = ref<HTMLDivElement | null>(null)
let closingThroughNavigation = false
let loadingDelay: ReturnType<typeof setTimeout> | undefined

const searchShortcut = computed(() => {
  const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)
  return isMac ? '⌘ O' : 'Ctrl O'
})
const searchShortcutAria = computed(() => searchShortcut.value.startsWith('⌘') ? 'Meta+O' : 'Control+O')

const loadBrowseSuggestions = async () => {
  if (browseSuggestionsLoading.value || browseSuggestionsLoaded.value) return

  browseSuggestionsLoading.value = true
  try {
    const [authorsResponse, referencesResponse] = await Promise.all([
      $fetch<{ authors: BrowseAuthorSuggestion[] }>('/api/authors/random', { params: { count: 3 } }).catch(() => null),
      $fetch<{ references: BrowseReferenceSuggestion[] }>('/api/references/random', { params: { count: 3 } }).catch(() => null)
    ])

    if (authorsResponse) browseAuthors.value = authorsResponse.authors || []
    if (referencesResponse) browseReferences.value = referencesResponse.references || []
    browseSuggestionsLoaded.value = Boolean(authorsResponse || referencesResponse)
  } finally {
    browseSuggestionsLoading.value = false
  }
}

watch([isOpen, storeQuery], ([open, query]) => {
  if (open && !query.trim() && mode.value === 'search') {
    void loadBrowseSuggestions()
  }
})

watch(loading, (isLoading) => {
  if (loadingDelay) clearTimeout(loadingDelay)
  if (!isLoading) {
    showLoadingState.value = false
    return
  }

  loadingDelay = setTimeout(() => {
    showLoadingState.value = true
  }, 180)
}, { immediate: true })

type ResultItem =
  | (ProcessedQuoteResult & { type: 'quote'; sectionIndex: number })
  | (AuthorSearchResult & { type: 'author'; sectionIndex: number })
  | (ReferenceSearchResult & { type: 'reference'; sectionIndex: number })

const totalResults = computed<number>(() => {
  if (mode.value === 'nav') return filteredNavItems.value.length
  if (mode.value === 'cmd') return filteredCmdItems.value.length
  return searchResults.value.total || 0
})
const allResults = computed<ResultItem[]>(() => {
  const results: ResultItem[] = []
  if (searchResults.value.quotes) {
    searchResults.value.quotes.forEach((item, index) => {
      results.push({ ...(item as ProcessedQuoteResult), type: 'quote', sectionIndex: index })
    })
  }
  if (searchResults.value.authors) {
    searchResults.value.authors.forEach((item, index) => {
      results.push({ ...(item as AuthorSearchResult), type: 'author', sectionIndex: index })
    })
  }
  if (searchResults.value.references) {
    searchResults.value.references.forEach((item, index) => {
      results.push({ ...(item as ReferenceSearchResult), type: 'reference', sectionIndex: index })
    })
  }
  return results
})
const resultId = (type: ResultItem['type'], id: string | number) => `search-result-${type}-${id}`
const activeResultId = computed(() => {
  const result = allResults.value[selectedIndex.value]
  return result ? resultId(result.type, result.id) : undefined
})
const navResultId = (index: number) => `search-nav-result-${index}`
const cmdResultId = (index: number) => `search-command-result-${index}`
const activeDescendantId = computed(() => {
  if (mode.value === 'nav' && selectedNavIndex.value >= 0) return navResultId(selectedNavIndex.value)
  if (mode.value === 'cmd' && selectedCmdIndex.value >= 0) return cmdResultId(selectedCmdIndex.value)
  return mode.value === 'search' ? activeResultId.value : undefined
})

const setResultRef = (
  el: Element | ComponentPublicInstance | null,
  section: 'quotes' | 'authors' | 'references',
  index: number
) => {
  if (el) {
    const rawEl = (el as ComponentPublicInstance & { $el?: Element }).$el ?? (el as Element)
    const htmlEl = rawEl instanceof HTMLElement ? rawEl : null
    if (!htmlEl) return
    if (!resultRefs.value[section]) {
      resultRefs.value[section] = []
    }
    ;(resultRefs.value[section] as HTMLElement[])[index] = htmlEl
  }
}

const getGlobalIndex = (section: 'quotes' | 'authors' | 'references', index: number) => {
  let globalIndex = 0
  if (section === 'quotes') return index
  if (section === 'authors') {
    globalIndex += searchResults.value.quotes?.length || 0
    return globalIndex + index
  }
  if (section === 'references') {
    globalIndex += (searchResults.value.quotes?.length || 0) + (searchResults.value.authors?.length || 0)
    return globalIndex + index
  }
  return -1
}

const getReferenceIcon = (type: QuoteReferencePrimaryType | string) => {
  const icons: Record<string, string> = {
    film: 'i-ph-film-strip',
    book: 'i-ph-book',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video',
    other: 'i-ph-file'
  }
  return icons[type] || 'i-ph-file'
}

const highlightText = (text: string) => {
  if (!storeQuery.value.trim() || !text) return text
  const escapedQuery = storeQuery.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const escapedText = text.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] as string)
  return escapedText.replace(regex, '<mark class="rounded-[0.2em] bg-gray-200 px-[0.2em] py-[0.05em] text-gray-950 [box-decoration-break:clone] dark:bg-gray-700 dark:text-white">$1</mark>')
}

const debouncedSearch = useDebounceFn(async () => {
  if (mode.value === 'nav' || mode.value === 'cmd') {
    searchStore.clear()
    selectedIndex.value = -1
    selectedNavIndex.value = -1
    selectedCmdIndex.value = -1
    return
  }

  if (!storeQuery.value.trim()) {
    searchStore.clear()
    settledSearchQuery.value = ''
    selectedIndex.value = -1
    return
  }

  const query = storeQuery.value.trim()
  try {
    await searchStore.search({ limit: 20 })
    selectedIndex.value = -1
  } catch (error) {
    console.error('Search error:', error)
    searchStore.clear()
  } finally {
    if (storeQuery.value.trim() === query) settledSearchQuery.value = query
  }
}, 300)

const startSearch = async (query: string) => {
  storeQuery.value = query
  settledSearchQuery.value = null
  selectedIndex.value = -1
  emptyStateSelectedIndex.value = -1
  try {
    await searchStore.search({ limit: 20 })
  } finally {
    if (storeQuery.value.trim() === query.trim()) settledSearchQuery.value = query.trim()
  }
}

const clearSearchQuery = () => {
  storeQuery.value = ''
  settledSearchQuery.value = ''
  selectedIndex.value = -1
  searchStore.clear()
}

watch(storeQuery, () => {
  settledSearchQuery.value = null
  emptyStateSelectedIndex.value = -1
})

const goToSearchPage = () => {
  const query = mode.value === 'search' ? storeQuery.value.trim() : ''
  const searchQuery: Record<string, string> = {}

  if (query) searchQuery.q = query

  // Keep advanced filters when the dialog is opened from the search page.
  if (route.path === '/search') {
    for (const key of ['language', 'author', 'reference'] as const) {
      const value = route.query[key]
      if (typeof value === 'string' && value) searchQuery[key] = value
    }
  }

  closeAndNavigate()
  navigateTo({ path: '/search', query: searchQuery })
}

const closeAndNavigate = () => {
  closingThroughNavigation = true
  isOpen.value = false
}

const selectResult = (
  result: ProcessedQuoteResult | AuthorSearchResult | ReferenceSearchResult,
  type: 'quote' | 'author' | 'reference'
) => {
  closeAndNavigate()

  switch (type) {
    case 'quote':
  navigateTo(`/quotes/${result.id}`)
      break
    case 'author':
      navigateTo(`/authors/${result.id}`)
      break
    case 'reference':
      navigateTo(`/references/${result.id}`)
      break
  }
}

const navigateToNavItem = (item: any) => {
  closeAndNavigate()
  navigateTo(item.to)
}

const executeCmdItem = (item: any) => {
  closeAndNavigate()
  emit('action', item.action)
}

const selectCurrentResult = () => {
  if (mode.value === 'nav') {
    const index = selectedNavIndex.value >= 0 ? selectedNavIndex.value : 0
    if (filteredNavItems.value[index]) {
      navigateToNavItem(filteredNavItems.value[index])
    }
    return
  }
  if (mode.value === 'cmd') {
    const index = selectedCmdIndex.value >= 0 ? selectedCmdIndex.value : 0
    if (filteredCmdItems.value[index]) {
      executeCmdItem(filteredCmdItems.value[index])
    }
    return
  }
  const index = selectedIndex.value >= 0 ? selectedIndex.value : 0
  if (allResults.value[index]) {
    const result = allResults.value[index]
    selectResult(result, result.type)
  }
}

const scrollToSelected = (ensureVisible = false) => {
  const index = selectedIndex.value
  if (index < 0 || index >= allResults.value.length) {
    selectionIndicator.value = null
    return
  }
  const result = allResults.value[index]
  if (!result || !resultsContainer.value) return

  const section = result.type === 'quote' ? 'quotes' : result.type === 'author' ? 'authors' : 'references'

  const element = resultRefs.value[section]?.[result.sectionIndex]
  if (!element) return
  const container = resultsContainer.value
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  if (ensureVisible && (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom)) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  updateSelectionIndicator(element)
}

const updateSelectionIndicator = (element: HTMLElement) => {
  const container = resultsContainer.value
  if (!container) return
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  selectionIndicator.value = {
    x: elementRect.left - containerRect.left - container.clientLeft,
    y: elementRect.top - containerRect.top - container.clientTop + container.scrollTop,
    width: elementRect.width,
    height: elementRect.height
  }
}

const selectResultIndex = (index: number) => {
  selectedIndex.value = index
}

watch(selectedIndex, () => {
  void nextTick(scrollToSelected)
})

const scrollToSelectedNav = () => {
  const index = selectedNavIndex.value
  if (index < 0 || index >= filteredNavItems.value.length) return
  if (!resultsContainer.value) return
  const element = resultsContainer.value.querySelector<HTMLElement>(`[data-nav-index="${index}"]`)
  if (!element) return
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const scrollToSelectedCmd = () => {
  const index = selectedCmdIndex.value
  if (index < 0 || index >= filteredCmdItems.value.length) return
  if (!resultsContainer.value) return
  const element = resultsContainer.value.querySelector<HTMLElement>(`[data-cmd-index="${index}"]`)
  if (!element) return
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const getCircularIndex = (current: number, direction: 1 | -1, length: number) => {
  if (!length) return -1
  if (current < 0) return direction === 1 ? 0 : length - 1
  return (current + direction + length) % length
}

const handleEmptyStatePointer = (index: number) => {
  emptyStateSelectedIndex.value = index
  void nextTick(() => {
    const element = resultsContainer.value?.querySelector<HTMLElement>(`[data-empty-state-highlight-index="${index}"]`)
    if (element) updateSelectionIndicator(element)
  })
}

const moveEmptyStateSelection = (direction: 1 | -1) => {
  emptyStateSelectedIndex.value = getCircularIndex(emptyStateSelectedIndex.value, direction, emptyStateItems.value.length)
  const selectedIndex = emptyStateSelectedIndex.value
  if (selectedIndex < 0) return

  nextTick(() => {
    const focusTarget = resultsContainer.value?.querySelector<HTMLElement>(`[data-empty-state-index="${selectedIndex}"]`)
    const highlightTarget = resultsContainer.value?.querySelector<HTMLElement>(`[data-empty-state-highlight-index="${selectedIndex}"]`)
    if (!focusTarget || !highlightTarget) return
    focusTarget.focus({ preventScroll: true })

    const container = resultsContainer.value
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const elementRect = highlightTarget.getBoundingClientRect()
    if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      highlightTarget.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })
    }
    updateSelectionIndicator(highlightTarget)
  })
}

const activateEmptyStateSelection = () => {
  const item = emptyStateItems.value[emptyStateSelectedIndex.value]
  if (!item) return

  if (item.type === 'search') {
    void startSearch(item.value)
    return
  }

  closeAndNavigate()
  navigateTo(item.type === 'author' ? `/authors/${item.value.id}` : `/references/${item.value.id}`)
}

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'o') {
    event.preventDefault()
    goToSearchPage()
    return
  }

  if (event.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (mode.value === 'search' && isPrintableSearchKey(event) && !hasEditableFocus()) {
    const searchInput = document.querySelector<HTMLInputElement>('[role="dialog"] input[placeholder]')
    if (!searchInput) return

    event.preventDefault()
    storeQuery.value += event.key
    settledSearchQuery.value = null
    selectedIndex.value = -1
    emptyStateSelectedIndex.value = -1
    searchInput.focus()
    debouncedSearch()
    return
  }

  if (mode.value === 'nav' || mode.value === 'cmd') {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (mode.value === 'nav' && filteredNavItems.value.length) {
        selectedNavIndex.value = getCircularIndex(selectedNavIndex.value, 1, filteredNavItems.value.length)
        scrollToSelectedNav()
      } else if (mode.value === 'cmd' && filteredCmdItems.value.length) {
        selectedCmdIndex.value = getCircularIndex(selectedCmdIndex.value, 1, filteredCmdItems.value.length)
        scrollToSelectedCmd()
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (mode.value === 'nav' && filteredNavItems.value.length) {
        selectedNavIndex.value = getCircularIndex(selectedNavIndex.value, -1, filteredNavItems.value.length)
        scrollToSelectedNav()
      } else if (mode.value === 'cmd' && filteredCmdItems.value.length) {
        selectedCmdIndex.value = getCircularIndex(selectedCmdIndex.value, -1, filteredCmdItems.value.length)
        scrollToSelectedCmd()
      }
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      selectCurrentResult()
      return
    }
    return
  }

  if (isEmptySearchState.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault()
    moveEmptyStateSelection(event.key === 'ArrowDown' ? 1 : -1)
    return
  }

  if (isEmptySearchState.value && event.key === 'Enter' && emptyStateSelectedIndex.value >= 0) {
    event.preventDefault()
    activateEmptyStateSelection()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (allResults.value.length) {
      selectedIndex.value = getCircularIndex(selectedIndex.value, 1, allResults.value.length)
      scrollToSelected(true)
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (allResults.value.length) {
      selectedIndex.value = getCircularIndex(selectedIndex.value, -1, allResults.value.length)
      scrollToSelected(true)
    }
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectCurrentResult()
    return
  }
}

watch(isOpen, (isStillOpen) => {
  if (isStillOpen) {
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder]')
      searchInput?.focus()
    })

    return
  }

  document.removeEventListener('keydown', handleKeydown)
  if (closingThroughNavigation) {
    closingThroughNavigation = false
  } else if (route.path === '/search') {
    const query = typeof route.query.q === 'string' ? route.query.q : ''
    const language = typeof route.query.language === 'string' ? route.query.language : undefined
    const author = typeof route.query.author === 'string' ? route.query.author : undefined
    const reference = typeof route.query.reference === 'string' ? route.query.reference : undefined
    searchStore.setQuery(query)
    if (query || language || author || reference) {
      void searchStore.search({
        limit: 50,
        language,
        author,
        reference
      })
    } else {
      searchStore.clear()
    }
  }

  // Preserve store state when closing; only reset local UI state
  selectedIndex.value = -1
  selectedNavIndex.value = -1
  selectedCmdIndex.value = -1
  emptyStateSelectedIndex.value = -1
  resultRefs.value = {}
  selectionIndicator.value = null
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (loadingDelay) clearTimeout(loadingDelay)
})
</script>

<style scoped>
:global(body .dialog-content.search-box-dialog) {
  width: 94vw !important;
  max-width: min(94vw, 58rem) !important;
  padding: 1rem !important;
}

:deep(.card-header) {
  padding: 1rem;
}

:deep(.card-content) {
  padding: 0 1rem 1rem;
}

:deep(.card-footer) {
  padding: 0 1rem 1rem;
}

.search-box-mobile-card {
  display: flex;
  height: auto;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0;
  background: transparent;
}

.search-box-mobile-card :deep(.card-header) {
  flex: none;
  padding: 1.25rem 1rem 0.75rem;
}

.search-box-mobile-card :deep(.card-content) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 0 1rem;
}

:deep(.search-box-mobile-content) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
}

:deep(.search-box-mobile-search-row) {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
}

:deep(.search-box-mobile-search-row > .input-wrapper) {
  min-width: 0;
  flex: 1;
}

:deep(.search-box-mobile-results) {
  height: min(42dvh, 24rem);
  min-height: 0;
  flex: none;
  overscroll-behavior: contain;
}

.search-box-desktop-results {
  height: clamp(12rem, 50vh, 32rem);
}

:deep(.search-box-results-enter-active) {
  transition: opacity 260ms ease, transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--search-entry-delay, 0ms);
}

:deep(.search-box-results-leave-active) {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

:deep(.search-box-results-move) {
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.search-box-results-enter-from),
:deep(.search-box-results-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  :deep(.search-box-results-enter-active),
  :deep(.search-box-results-leave-active),
  :deep(.search-box-results-move) {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
}

mark {
  background-color: rgb(254 240 138);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.dark mark {
  background-color: rgb(133 77 14);
  color: rgb(254 240 138);
}
</style>
