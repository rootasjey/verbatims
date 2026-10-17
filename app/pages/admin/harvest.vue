<template>
  <div class="harvest-page flex flex-col h-full">
    <!-- Editorial Header -->
    <div class="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-serif text-2xl md:text-3xl font-200 text-gray-900 dark:text-gray-100">{{ $t('title') }}</h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('subtitle') }}</p>
        </div>
        <NBadge v-if="harvestedCount > 0" badge="soft-gray" size="sm">{{ $t('badge_harvested', { n: harvestedCount }) }}</NBadge>
      </div>
    </div>

    <nav class="harvest-steps" :aria-label="$t('mobile_steps') as string">
      <button
        type="button"
        :aria-pressed="mobileView === 'browse'"
        class="harvest-step"
        :class="mobileView === 'browse' ? 'is-active' : ''"
        @click="mobileView = 'browse'"
      >{{ $t('browse_step') }}</button>
      <button
        type="button"
        :aria-pressed="mobileView === 'preview'"
        :disabled="!selectedPageSlug"
        class="harvest-step"
        :class="mobileView === 'preview' ? 'is-active' : ''"
        @click="mobileView = 'preview'"
      >{{ $t('preview_step') }}<span v-if="pageQuotes.length" class="ml-1.5 text-xs opacity-70">{{ pageQuotes.length }}</span></button>
    </nav>

    <div class="harvest-workspace flex-1 overflow-hidden flex">
      <!-- Left Panel: Source & Search -->
      <div class="harvest-browser-pane w-full border-r border-gray-200 dark:border-gray-800 flex flex-col" :class="{ 'is-step-hidden': mobileView !== 'browse' }">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div class="flex items-center gap-2">
            <label for="harvest-source" class="font-sans text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ $t('label_source') }}</label>
            <select id="harvest-source" v-model="selectedSource" class="flex-1 min-w-0 font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500">
              <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="flex gap-2">
            <input v-model="searchQuery" type="text" :aria-label="$t('search_placeholder') as string" :placeholder="$t('search_placeholder') as string" class="flex-1 min-w-0 font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500" @keydown.enter="wrappedSearch" />
            <OutlinedButton class="rounded-lg" :disabled="!searchQuery.trim()" :loading="searchLoading" @click="wrappedSearch">{{ $t('search_button') }}</OutlinedButton>
          </div>
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('hint_search') }}</p>
        </div>

        <!-- Search Results -->
        <div class="flex-1 overflow-auto">
          <div v-if="searchLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
            <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin mx-auto mb-2" />
            <p class="font-sans text-sm">{{ $t('status_searching', { source: selectedSourceLabel }) }}</p>
          </div>
          <div v-else-if="error && !searchResults.length" class="p-6 text-center">
            <NIcon name="i-ph-warning" class="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p class="font-sans text-sm text-red-600 dark:text-red-400">{{ error }}</p>
            <OutlinedButton size="sm" class="mt-2 rounded-lg" @click="wrappedSearch">{{ $t('retry') }}</OutlinedButton>
          </div>
          <div v-else-if="searchResults.length === 0 && hasSearched" class="p-6 text-center text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-magnifying-glass" class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="font-sans text-sm">{{ $t('empty_results') }}</p>
          </div>
          <div v-else-if="searchResults.length === 0" class="p-6">
            <div v-if="suggestionsLoading" class="text-center text-gray-400">
              <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin mx-auto mb-2" />
              <p class="font-sans text-xs">{{ $t('status_loading_suggestions') }}</p>
            </div>
            <div v-else-if="suggestions.length > 0">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_suggested') }}</p>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="sugg in suggestions" :key="sugg.slug" class="font-sans text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-950 dark:hover:text-white transition-colors truncate max-w-full md:max-w-52 text-left" @click="openPageQuotes(sugg.slug)">{{ sugg.title }}</button>
              </div>
              <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-4">{{ $t('hint_suggested', { source: selectedSourceLabel }) }}</p>
            </div>
            <div v-else class="text-center text-gray-400 dark:text-gray-500">
              <NIcon name="i-ph-globe" class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p class="font-sans text-sm">{{ $t('empty_initial') }}</p>
            </div>
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <button v-for="result in searchResults" :key="result.slug" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-gray-500" :class="[selectedPageSlug === result.slug ? 'bg-gray-100 dark:bg-gray-800' : '']" @click="openPageQuotes(result.slug)">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ result.title }}</p>
                  <p v-if="result.description" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ result.description }}</p>
                </div>
                <span v-if="result.quoteCount" class="font-sans text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 whitespace-nowrap">{{ result.quoteCount }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Quotes Preview -->
      <div class="harvest-preview-pane w-full flex-1 flex flex-col min-w-0" :class="{ 'is-step-hidden': mobileView !== 'preview' }">
          <div v-if="quotesLoading" class="flex-1 flex items-center justify-center">
            <div class="text-center text-gray-500 dark:text-gray-400">
              <NIcon name="i-ph-spinner" class="w-8 h-8 animate-spin mx-auto mb-2" />
              <p class="font-sans text-sm">{{ $t('status_loading_quotes', { source: selectedSourceLabel }) }}</p>
            </div>
          </div>
          <div v-else-if="error && !pageQuotes.length && selectedPageSlug" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <NIcon name="i-ph-warning" class="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p class="font-sans text-sm text-red-600 dark:text-red-400 mb-1">{{ $t('error_quotes_title') }}</p>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3">{{ error }}</p>
              <OutlinedButton size="sm" @click="selectedPageSlug && loadPageQuotes(selectedPageSlug)">{{ $t('try_again') }}</OutlinedButton>
          </div>
        </div>
        <div v-else-if="pageQuotes.length === 0 && !selectedPageSlug" class="flex-1 flex items-center justify-center">
          <div class="text-center text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-quotes" class="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p class="font-sans text-lg font-200">{{ $t('select_prompt') }}</p>
            <p class="font-sans text-sm mt-1">{{ $t('select_prompt_desc') }}</p>
          </div>
        </div>
        <div v-else-if="pageQuotes.length === 0" class="flex-1 flex items-center justify-center px-6">
          <div class="text-center text-gray-500 dark:text-gray-400">
            <NIcon name="i-ph-quotes" class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p class="font-sans text-base">{{ $t('empty_quotes') }}</p>
          </div>
        </div>
        <div v-else class="flex-1 flex flex-col min-h-0">
          <div class="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <button type="button" class="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:text-gray-200 dark:hover:bg-gray-800" @click="mobileView = 'browse'"><NIcon name="i-ph-arrow-left" class="h-4 w-4" />{{ $t('back_to_sources') }}</button>
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('selection_count', { n: selectedQuotes.size, total: pageQuotes.length }) }}</span>
              <span v-if="pageQuotes.filter(q => q.isDuplicate).length > 0" class="font-sans text-xs text-orange-600 dark:text-orange-400">{{ $t('duplicates_notice', { n: pageQuotes.filter(q => q.isDuplicate).length }) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <OutlinedButton size="sm" class="rounded-lg" @click="selectAll">{{ $t('select_all') }}</OutlinedButton>
              <OutlinedButton size="sm" class="rounded-lg" @click="selectNonDuplicates">{{ $t('select_new') }}</OutlinedButton>
              <OutlinedButton size="sm" class="rounded-lg" @click="deselectAll">{{ $t('deselect') }}</OutlinedButton>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4 space-y-3">
            <div v-for="(quote, index) in pageQuotes" :key="index" class="border rounded-xl transition-colors cursor-pointer" :class="[selectedQuotes.has(index) ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700', quote.isDuplicate ? 'opacity-60' : '']" @click="toggleQuote(index)">
              <div class="p-3 space-y-2">
                <div class="flex items-start gap-3">
                  <NCheckbox :model-value="selectedQuotes.has(index)" checkbox="gray" class="mt-0.5" @click.stop @update:model-value="toggleQuote(index)" />
                  <div class="flex-1 min-w-0">
                    <blockquote class="font-body text-sm text-gray-900 dark:text-white leading-relaxed">&ldquo;{{ quote.text }}&rdquo;</blockquote>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span v-if="quote.author?.name" class="font-sans text-xs text-gray-500 dark:text-gray-400">&mdash; {{ quote.author.name }}</span>
                      <span v-if="quote.reference?.name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.reference.name }}</span>
                      <span class="font-sans text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{{ quote.language.toUpperCase() }}</span>
                      <span v-if="quote.isDuplicate" class="font-sans text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded px-1.5 py-0.5">{{ $t('badge_duplicate') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
            <div class="font-sans text-sm text-gray-500 dark:text-gray-400">
              <span v-if="selectedQuotes.size > 0">{{ $t('import_info', { n: selectedQuotes.size }) }}<span v-if="selectedQuotesList.filter(q => q.isDuplicate).length > 0" class="text-orange-600 dark:text-orange-400"> ({{ selectedQuotesList.filter(q => q.isDuplicate).length }} will be skipped as duplicates)</span></span>
              <span v-else>{{ $t('import_info_none') }}</span>
            </div>
            <OutlinedButton class="rounded-lg" variant="primary" :loading="importLoading" :disabled="selectedQuotes.size === 0 || selectedQuotesList.filter(q => !q.isDuplicate).length === 0" @click="handleImport">{{ $t('import_button') }}</OutlinedButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="importResult" class="fixed bottom-4 right-4 z-50 bg-green-50 dark:bg-green-900/30 border border-dashed border-green-200 dark:border-green-700 px-4 py-3 shadow-lg max-w-md">
      <div class="flex items-start gap-3">
        <NIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
        <div>
          <p class="font-sans text-sm font-500 text-green-900 dark:text-green-200">{{ $t('toast_import_complete') }}</p>
          <p class="font-sans text-xs text-green-700 dark:text-green-300 mt-0.5">{{ $t('toast_import_body', { imported: importResult.imported, skipped: importResult.skipped, authors: importResult.authorsCreated, references: importResult.referencesCreated }) }}</p>
        </div>
        <button class="text-green-600 dark:text-green-400 hover:text-green-800" @click="importResult = null"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })

const { sources, selectedSource, searchQuery, searchResults, selectedPageSlug, pageQuotes, selectedQuotes, loading: sourcesLoading, searchLoading, quotesLoading, importLoading, error, sourceOptions, selectedSourceLabel, selectedQuotesList, suggestions, suggestionsLoading, loadSources, loadSuggestions, search, loadPageQuotes, toggleQuote, selectAll, selectNonDuplicates, deselectAll, importSelected, reset } = useHarvest()

const harvestedCount = ref(0)
const importResult = ref<any>(null)
const hasSearched = ref(false)
const mobileView = ref<'browse' | 'preview'>('browse')

const loadHarvestedCount = async () => {
  try { const stats = await $fetch('/api/admin/stats'); harvestedCount.value = (stats as any)?.data?.quotes?.harvested || 0 } catch {}
}

const handleImport = async () => {
  const result = await importSelected()
  if (result) { importResult.value = result; loadHarvestedCount(); setTimeout(() => { importResult.value = null }, 8000) }
}

const wrappedSearch = async () => { hasSearched.value = true; await search() }
const openPageQuotes = async (slug: string) => {
  mobileView.value = 'preview'
  await loadPageQuotes(slug)
}

onMounted(() => { loadSources(); loadHarvestedCount(); loadSuggestions() })
watch(selectedSource, () => { mobileView.value = 'browse'; suggestions.value = []; loadSuggestions(); reset() })
</script>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.harvest-steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  padding: 0.375rem;
  margin: 0.75rem 1rem;
  border: 1px solid rgb(120 113 108 / 0.2);
  border-radius: 0.875rem;
  background: rgb(0 0 0 / 0.025);
}
.harvest-step {
  min-height: 2.75rem;
  border-radius: 0.625rem;
  color: #78716c;
  font-size: 0.875rem;
  transition: background-color 160ms ease, color 160ms ease;
}
.harvest-step.is-active { background: white; color: #1c1917; box-shadow: 0 1px 2px rgb(0 0 0 / 0.08); }
.harvest-step:disabled { opacity: 0.45; }
.is-step-hidden { display: none; }
:global(.dark) .harvest-steps { border-color: rgb(120 113 108 / 0.3); background: rgb(255 255 255 / 0.04); }
:global(.dark) .harvest-step.is-active { background: #292524; color: #fafaf9; }

@media (max-width: 767px) {
  .harvest-page { min-height: 0; }
  .harvest-workspace {
    flex: none;
    height: min(68dvh, 680px);
    min-height: 480px;
    margin: 0 1rem 1rem;
    border: 1px solid rgb(120 113 108 / 0.2);
    border-radius: 1rem;
    background: white;
  }
  :global(.dark) .harvest-workspace { border-color: rgb(120 113 108 / 0.3); background: #171717; }
  .harvest-browser-pane,
  .harvest-preview-pane { border-right: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .harvest-step { transition: none; }
}
</style>
