<template>
  <div class="flex flex-col h-full">
    <!-- Editorial Header -->
    <div class="flex-shrink-0 border-b border-dashed border-gray-300 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-serif text-2xl md:text-3xl font-200 text-gray-900 dark:text-gray-100">Harvest Quotes</h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">Browse external sources and import quotes into your database</p>
        </div>
        <NBadge v-if="harvestedCount > 0" badge="soft-gray" size="sm">{{ harvestedCount }} Harvested</NBadge>
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex">
      <!-- Left Panel: Source & Search -->
      <div class="w-2/5 border-r border-dashed border-gray-200 dark:border-gray-700 flex flex-col">
        <div class="p-4 border-b border-dashed border-gray-200 dark:border-gray-700 space-y-3">
          <div class="flex items-center gap-2">
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Source:</label>
            <select v-model="selectedSource" class="flex-1 font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer">
              <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div class="flex gap-2">
            <input v-model="searchQuery" type="text" placeholder="Search for an author or topic..." class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" @keydown.enter="wrappedSearch" />
            <OutlinedButton :disabled="!searchQuery.trim()" :loading="searchLoading" @click="wrappedSearch">Search</OutlinedButton>
          </div>
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500">On WikiQuote, each author or topic is a &ldquo;page&rdquo; containing their quotes.</p>
        </div>

        <!-- Search Results -->
        <div class="flex-1 overflow-auto">
          <div v-if="searchLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
            <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin mx-auto mb-2" />
            <p class="font-sans text-sm">Searching {{ selectedSourceLabel }}...</p>
          </div>
          <div v-else-if="error && !searchResults.length" class="p-6 text-center">
            <NIcon name="i-ph-warning" class="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p class="font-sans text-sm text-red-600 dark:text-red-400">{{ error }}</p>
            <OutlinedButton size="sm" class="mt-2" @click="wrappedSearch">Retry</OutlinedButton>
          </div>
          <div v-else-if="searchResults.length === 0 && hasSearched" class="p-6 text-center text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-magnifying-glass" class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p class="font-sans text-sm">No results found. Try a different search term.</p>
          </div>
          <div v-else-if="searchResults.length === 0" class="p-6">
            <div v-if="suggestionsLoading" class="text-center text-gray-400">
              <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin mx-auto mb-2" />
              <p class="font-sans text-xs">Loading suggestions...</p>
            </div>
            <div v-else-if="suggestions.length > 0">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Suggested authors &amp; topics</p>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="sugg in suggestions" :key="sugg.slug" class="font-sans text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:scale-105 active:scale-99 transition-[colors,transform] truncate max-w-52" @click="loadPageQuotes(sugg.slug)">{{ sugg.title }}</button>
              </div>
              <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-4">Or <span class="font-medium">search above</span> for a specific author or topic on {{ selectedSourceLabel }}.</p>
            </div>
            <div v-else class="text-center text-gray-400 dark:text-gray-500">
              <NIcon name="i-ph-globe" class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p class="font-sans text-sm">Type a name to search for authors or topics</p>
            </div>
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <button v-for="result in searchResults" :key="result.slug" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" :class="[selectedPageSlug === result.slug ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500' : '']" @click="loadPageQuotes(result.slug)">
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
      <div class="flex-1 flex flex-col">
        <div v-if="quotesLoading" class="flex-1 flex items-center justify-center">
          <div class="text-center text-gray-500 dark:text-gray-400">
            <NIcon name="i-ph-spinner" class="w-8 h-8 animate-spin mx-auto mb-2" />
            <p class="font-sans text-sm">Loading quotes from {{ selectedSourceLabel }}...</p>
          </div>
        </div>
        <div v-else-if="error && !pageQuotes.length && selectedPageSlug" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <NIcon name="i-ph-warning" class="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p class="font-sans text-sm text-red-600 dark:text-red-400 mb-1">Failed to load quotes</p>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-3">{{ error }}</p>
            <OutlinedButton size="sm" @click="selectedPageSlug && loadPageQuotes(selectedPageSlug)">Try Again</OutlinedButton>
          </div>
        </div>
        <div v-else-if="pageQuotes.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-quotes" class="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p class="font-sans text-lg font-200">Select a page from the left</p>
            <p class="font-sans text-sm mt-1">Choose an author or topic to preview their quotes</p>
          </div>
        </div>
        <div v-else class="flex-1 flex flex-col min-h-0">
          <div class="flex-shrink-0 px-4 py-3 border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ selectedQuotes.size }} of {{ pageQuotes.length }} selected</span>
              <span v-if="pageQuotes.filter(q => q.isDuplicate).length > 0" class="font-sans text-xs text-orange-600 dark:text-orange-400">{{ pageQuotes.filter(q => q.isDuplicate).length }} already in database</span>
            </div>
            <div class="flex items-center gap-2">
              <OutlinedButton size="sm" @click="selectAll">Select All</OutlinedButton>
              <OutlinedButton size="sm" @click="selectNonDuplicates">Select New</OutlinedButton>
              <OutlinedButton size="sm" @click="deselectAll">Deselect</OutlinedButton>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4 space-y-3">
            <div v-for="(quote, index) in pageQuotes" :key="index" class="border border-dashed transition-colors cursor-pointer" :class="[selectedQuotes.has(index) ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600', quote.isDuplicate ? 'opacity-60' : '']" @click="toggleQuote(index)">
              <div class="p-3 space-y-2">
                <div class="flex items-start gap-3">
                  <NCheckbox :model-value="selectedQuotes.has(index)" checkbox="gray" class="mt-0.5" @click.stop @update:model-value="toggleQuote(index)" />
                  <div class="flex-1 min-w-0">
                    <blockquote class="font-body text-sm text-gray-900 dark:text-white leading-relaxed">&ldquo;{{ quote.text }}&rdquo;</blockquote>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">&mdash; {{ quote.author }}</span>
                      <span class="font-sans text-xs px-1.5 py-0.5" :class="quote.language === 'fr' ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'">{{ quote.language.toUpperCase() }}</span>
                      <span v-if="quote.isDuplicate" class="font-sans text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5">Duplicate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-shrink-0 border-t border-dashed border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900 flex items-center justify-between">
            <div class="font-sans text-sm text-gray-500 dark:text-gray-400">
              <span v-if="selectedQuotes.size > 0">Import {{ selectedQuotes.size }} quote{{ selectedQuotes.size > 1 ? 's' : '' }}<span v-if="selectedQuotesList.filter(q => q.isDuplicate).length > 0" class="text-orange-600 dark:text-orange-400"> ({{ selectedQuotesList.filter(q => q.isDuplicate).length }} will be skipped as duplicates)</span></span>
              <span v-else>Select quotes to import</span>
            </div>
            <OutlinedButton variant="primary" :loading="importLoading" :disabled="selectedQuotes.size === 0 || selectedQuotesList.filter(q => !q.isDuplicate).length === 0" @click="handleImport">Import Selected</OutlinedButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="importResult" class="fixed bottom-4 right-4 z-50 bg-green-50 dark:bg-green-900/30 border border-dashed border-green-200 dark:border-green-700 px-4 py-3 shadow-lg max-w-md">
      <div class="flex items-start gap-3">
        <NIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
        <div>
          <p class="font-sans text-sm font-500 text-green-900 dark:text-green-200">Import Complete</p>
          <p class="font-sans text-xs text-green-700 dark:text-green-300 mt-0.5">{{ importResult.imported }} imported, {{ importResult.skipped }} skipped<span v-if="importResult.authorsCreated > 0">, {{ importResult.authorsCreated }} authors created</span><span v-if="importResult.referencesCreated > 0">, {{ importResult.referencesCreated }} references created</span></p>
        </div>
        <button class="text-green-600 dark:text-green-400 hover:text-green-800" @click="importResult = null"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Harvest Quotes - Admin - Verbatims' })

const { sources, selectedSource, searchQuery, searchResults, selectedPageSlug, pageQuotes, selectedQuotes, loading: sourcesLoading, searchLoading, quotesLoading, importLoading, error, sourceOptions, selectedSourceLabel, selectedQuotesList, suggestions, suggestionsLoading, loadSources, loadSuggestions, search, loadPageQuotes, toggleQuote, selectAll, selectNonDuplicates, deselectAll, importSelected, reset } = useHarvest()

const harvestedCount = ref(0)
const importResult = ref<any>(null)
const hasSearched = ref(false)

const loadHarvestedCount = async () => {
  try { const stats = await $fetch('/api/admin/stats'); harvestedCount.value = (stats as any)?.data?.quotes?.harvested || 0 } catch {}
}

const handleImport = async () => {
  const result = await importSelected()
  if (result) { importResult.value = result; loadHarvestedCount(); setTimeout(() => { importResult.value = null }, 8000) }
}

const wrappedSearch = async () => { hasSearched.value = true; await search() }

onMounted(() => { loadSources(); loadHarvestedCount(); loadSuggestions() })
watch(selectedSource, () => { suggestions.value = []; loadSuggestions(); reset() })
</script>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
