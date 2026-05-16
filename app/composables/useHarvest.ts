import { ref, computed } from 'vue'
import type { HarvestSourceType } from '#shared/constants/harvest'
import { HARVEST_SOURCE_LABELS, HARVEST_SOURCE_LANGUAGES } from '#shared/constants/harvest'

export interface HarvestSourceOption {
  type: HarvestSourceType
  label: string
  language: string
}

export interface HarvestSearchResult {
  slug: string
  title: string
  description?: string
  quoteCount?: number
  url: string
  sourceType: HarvestSourceType
  language: string
}

export interface HarvestQuotePreviewItem {
  text: string
  language: string
  author?: {
    name: string
    slug: string
    url?: string
    description?: string
    birthDate?: string
    deathDate?: string
    job?: string
    imageUrl?: string
  }
  reference?: {
    name: string
    type?: string
    url?: string
  }
  sourceUrl: string
  sourceType: HarvestSourceType
  isDuplicate?: boolean
  duplicateQuoteId?: number
  _selected?: boolean
}

export function useHarvest() {
  const sources = ref<HarvestSourceOption[]>([])
  const selectedSource = ref<HarvestSourceType>('wikiquote-fr')
  const searchQuery = ref('')
  const searchResults = ref<HarvestSearchResult[]>([])
  const selectedPageSlug = ref<string | null>(null)
  const pageQuotes = ref<HarvestQuotePreviewItem[]>([])
  const selectedQuotes = ref<Set<number>>(new Set())
  const loading = ref(false)
  const searchLoading = ref(false)
  const quotesLoading = ref(false)
  const importLoading = ref(false)
  const error = ref<string | null>(null)
  const suggestions = ref<HarvestSearchResult[]>([])
  const suggestionsLoading = ref(false)

  const sourceOptions = computed(() =>
    sources.value.map(s => ({
      label: s.label,
      value: s.type,
    }))
  )

  const selectedSourceLabel = computed(() =>
    HARVEST_SOURCE_LABELS[selectedSource.value] || selectedSource.value
  )

  const selectedQuotesList = computed(() =>
    pageQuotes.value.filter((_, i) => selectedQuotes.value.has(i))
  )

  const nonDuplicateQuotes = computed(() =>
    pageQuotes.value.filter(q => !q.isDuplicate)
  )

  const loadSources = async () => {
    try {
      loading.value = true
      const response = await $fetch('/api/admin/harvest/sources')
      sources.value = (response as any).data || []
    } catch (err: any) {
      error.value = err?.message || 'Failed to load sources'
    } finally {
      loading.value = false
    }
  }

  const loadSuggestions = async () => {
    try {
      suggestionsLoading.value = true
      error.value = null
      const response = await $fetch('/api/admin/harvest/suggestions', {
        query: { sourceType: selectedSource.value },
      })
      suggestions.value = (response as any).data || []
    } catch (err: any) {
      error.value = err?.message || 'Failed to load suggestions'
    } finally {
      suggestionsLoading.value = false
    }
  }

  const search = async () => {
    if (!searchQuery.value.trim()) return
    try {
      searchLoading.value = true
      error.value = null
      searchResults.value = []
      selectedPageSlug.value = null
      pageQuotes.value = []
      selectedQuotes.value = new Set()

      const response = await $fetch('/api/admin/harvest/search', {
        query: {
          sourceType: selectedSource.value,
          query: searchQuery.value.trim(),
          limit: 30,
        },
      })

      searchResults.value = (response as any).data || []
    } catch (err: any) {
      error.value = err?.message || 'Search failed'
    } finally {
      searchLoading.value = false
    }
  }

  const loadPageQuotes = async (slug: string) => {
    try {
      quotesLoading.value = true
      selectedPageSlug.value = slug
      error.value = null
      pageQuotes.value = []
      selectedQuotes.value = new Set()

      const response = await $fetch('/api/admin/harvest/quotes', {
        query: {
          sourceType: selectedSource.value,
          pageSlug: slug,
        },
      })

      pageQuotes.value = ((response as any).data || []).map((q: any) => ({
        ...q,
        _selected: false,
      }))
    } catch (err: any) {
      error.value = err?.message || 'Failed to load quotes'
    } finally {
      quotesLoading.value = false
    }
  }

  const toggleQuote = (index: number) => {
    const newSet = new Set(selectedQuotes.value)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    selectedQuotes.value = newSet
  }

  const selectAll = () => {
    selectedQuotes.value = new Set(pageQuotes.value.map((_, i) => i))
  }

  const selectNonDuplicates = () => {
    selectedQuotes.value = new Set(
      pageQuotes.value
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => !q.isDuplicate)
        .map(({ i }) => i)
    )
  }

  const deselectAll = () => {
    selectedQuotes.value = new Set()
  }

  const importSelected = async () => {
    if (selectedQuotes.value.size === 0) return null

    const quotesToImport = selectedQuotesList.value.map(q => ({
      text: q.text,
      language: q.language,
      new_author: q.author ? {
        name: q.author.name,
        description: q.author.description,
        job: q.author.job,
        birth_date: q.author.birthDate,
        death_date: q.author.deathDate,
        image_url: q.author.imageUrl,
      } : undefined,
      new_reference: q.reference ? {
        name: q.reference.name,
        primary_type: q.reference.type || 'other',
      } : undefined,
      sourceUrl: q.sourceUrl,
    }))

    try {
      importLoading.value = true
      error.value = null

      const response = await $fetch('/api/admin/harvest/import', {
        method: 'POST',
        body: {
          sourceType: selectedSource.value,
          quotes: quotesToImport,
        },
      })

      const result = (response as any).data

      selectedQuotes.value = new Set()
      pageQuotes.value = pageQuotes.value.map(q => ({
        ...q,
        isDuplicate: true,
      }))

      return result
    } catch (err: any) {
      error.value = err?.message || 'Import failed'
      return null
    } finally {
      importLoading.value = false
    }
  }

  const reset = () => {
    searchQuery.value = ''
    searchResults.value = []
    selectedPageSlug.value = null
    pageQuotes.value = []
    selectedQuotes.value = new Set()
    error.value = null
  }

  return {
    sources,
    selectedSource,
    searchQuery,
    searchResults,
    selectedPageSlug,
    pageQuotes,
    selectedQuotes,
    loading,
    searchLoading,
    quotesLoading,
    importLoading,
    error,
    suggestions,
    suggestionsLoading,
    sourceOptions,
    selectedSourceLabel,
    selectedQuotesList,
    nonDuplicateQuotes,
    loadSources,
    loadSuggestions,
    search,
    loadPageQuotes,
    toggleQuote,
    selectAll,
    selectNonDuplicates,
    deselectAll,
    importSelected,
    reset,
  }
}