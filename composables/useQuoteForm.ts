import { ref, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type {
  Author, QuoteReference, CreateQuoteData, QuoteLanguage,
  QuoteWithRelations, AdminQuote
} from '~/types'

export function useQuoteForm() {
  const form = ref({
    content: '',
    language: { label: 'English', value: 'en' },
    selectedAuthor: null as Author | null,
    selectedReference: null as QuoteReference | null
  })

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Latin', value: 'la' },
    { label: 'Spanish', value: 'es' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Chinese', value: 'zh' }
  ]

  // Search state
  const authorQuery = ref('')
  const referenceQuery = ref('')
  const authorSuggestions = ref<Author[]>([])
  const referenceSuggestions = ref<QuoteReference[]>([])
  const showAuthorSuggestions = ref(false)
  const showReferenceSuggestions = ref(false)
  const submitting = ref(false)

  // Keyboard / navigation state
  const selectedAuthorIndex = ref(-1)
  const selectedReferenceIndex = ref(-1)

  // Template refs (components assign these)
  const authorInputRef = ref<any>(null)
  const referenceInputRef = ref<any>(null)
  const authorSuggestionsRef = ref<HTMLElement | null>(null)
  const referenceSuggestionsRef = ref<HTMLElement | null>(null)

  // Debounced network search functions
  const _searchAuthors = async (fetcher: typeof $fetch, opts: { limit?: number; minLength?: number } = {}) => {
    const limit = opts.limit ?? 5
    const minLength = opts.minLength ?? 1
    if (!authorQuery.value.trim() || authorQuery.value.trim().length < minLength) {
      authorSuggestions.value = []
      return
    }

    try {
      const response = await fetcher('/api/authors/search', {
        query: { q: authorQuery.value, limit }
      })
      // many endpoints return { data }
      authorSuggestions.value = (response as any).data || []
    } catch (error) {
      console.error('Error searching authors:', error)
      authorSuggestions.value = []
    }
  }
  const searchAuthors = useDebounceFn(_searchAuthors, 300)

  const _searchReferences = async (fetcher: typeof $fetch, opts: { limit?: number; minLength?: number } = {}) => {
    const limit = opts.limit ?? 5
    const minLength = opts.minLength ?? 1
    if (!referenceQuery.value.trim() || referenceQuery.value.trim().length < minLength) {
      referenceSuggestions.value = []
      return
    }

    try {
      const response = await fetcher('/api/references/search', {
        query: { q: referenceQuery.value, limit }
      })
      referenceSuggestions.value = (response as any).data || []
    } catch (error) {
      console.error('Error searching references:', error)
      referenceSuggestions.value = []
    }
  }
  const searchReferences = useDebounceFn(_searchReferences, 300)

  // Focus / blur / keyboard handlers for author suggestions
  const handleAuthorInputFocus = () => {
    showAuthorSuggestions.value = true
    selectedAuthorIndex.value = -1
  }

  const handleAuthorInputBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget && authorSuggestionsRef.value?.contains(relatedTarget)) return
    setTimeout(() => {
      showAuthorSuggestions.value = false
      selectedAuthorIndex.value = -1
    }, 150)
  }

  const handleAuthorSuggestionsBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget && authorInputRef.value?.$el?.contains(relatedTarget)) return
    setTimeout(() => {
      showAuthorSuggestions.value = false
      selectedAuthorIndex.value = -1
    }, 150)
  }

  const handleAuthorKeydown = (event: KeyboardEvent) => {
    if (!showAuthorSuggestions.value) return

    const totalItems = authorSuggestions.value.length + (authorQuery.value && !authorSuggestions.value.some(a => a.name.toLowerCase() === authorQuery.value.toLowerCase()) ? 1 : 0)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedAuthorIndex.value = selectedAuthorIndex.value < totalItems - 1 ? selectedAuthorIndex.value + 1 : 0
        scrollToSelectedAuthorItem()
        break
      case 'ArrowUp':
        event.preventDefault()
        selectedAuthorIndex.value = selectedAuthorIndex.value > 0 ? selectedAuthorIndex.value - 1 : totalItems - 1
        scrollToSelectedAuthorItem()
        break
      case 'Enter':
        event.preventDefault()
        if (selectedAuthorIndex.value >= 0) {
          if (selectedAuthorIndex.value < authorSuggestions.value.length) {
            selectAuthor(authorSuggestions.value[selectedAuthorIndex.value])
          } else {
            createNewAuthor()
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        showAuthorSuggestions.value = false
        selectedAuthorIndex.value = -1
        authorInputRef.value?.$el?.focus()
        break
    }
  }

  // Focus / blur / keyboard handlers for references
  const handleReferenceInputFocus = () => {
    showReferenceSuggestions.value = true
    selectedReferenceIndex.value = -1
  }

  const handleReferenceInputBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget && referenceSuggestionsRef.value?.contains(relatedTarget)) return
    setTimeout(() => {
      showReferenceSuggestions.value = false
      selectedReferenceIndex.value = -1
    }, 150)
  }

  const handleReferenceSuggestionsBlur = (event: FocusEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    if (relatedTarget && referenceInputRef.value?.$el?.contains(relatedTarget)) return
    setTimeout(() => {
      showReferenceSuggestions.value = false
      selectedReferenceIndex.value = -1
    }, 150)
  }

  const handleReferenceKeydown = (event: KeyboardEvent) => {
    if (!showReferenceSuggestions.value) return

    const totalItems = referenceSuggestions.value.length + (referenceQuery.value && !referenceSuggestions.value.some(r => r.name.toLowerCase() === referenceQuery.value.toLowerCase()) ? 1 : 0)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        selectedReferenceIndex.value = selectedReferenceIndex.value < totalItems - 1 ? selectedReferenceIndex.value + 1 : 0
        scrollToSelectedReferenceItem()
        break
      case 'ArrowUp':
        event.preventDefault()
        selectedReferenceIndex.value = selectedReferenceIndex.value > 0 ? selectedReferenceIndex.value - 1 : totalItems - 1
        scrollToSelectedReferenceItem()
        break
      case 'Enter':
        event.preventDefault()
        if (selectedReferenceIndex.value >= 0) {
          if (selectedReferenceIndex.value < referenceSuggestions.value.length) {
            selectReference(referenceSuggestions.value[selectedReferenceIndex.value])
          } else {
            createNewReference()
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        showReferenceSuggestions.value = false
        selectedReferenceIndex.value = -1
        referenceInputRef.value?.$el?.focus()
        break
    }
  }

  // Selection helpers
  const selectAuthor = (author: Author) => {
    form.value.selectedAuthor = author
    authorQuery.value = author.name
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const selectReference = (reference: QuoteReference) => {
    form.value.selectedReference = reference
    referenceQuery.value = reference.name
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const createNewAuthor = () => {
    form.value.selectedAuthor = {
      id: 0,
      name: authorQuery.value,
      is_fictional: false,
      birth_date: undefined,
      birth_location: undefined,
      death_date: undefined,
      death_location: undefined,
      job: undefined,
      description: undefined,
      image_url: undefined,
      socials: '{}',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const createNewReference = () => {
    form.value.selectedReference = {
      id: 0,
      name: referenceQuery.value,
      original_language: form.value.language.value as QuoteLanguage,
      release_date: null,
      description: null,
      primary_type: 'other',
      secondary_type: null,
      image_url: undefined,
      urls: '{}',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const clearAuthor = () => {
    form.value.selectedAuthor = null
    authorQuery.value = ''
    selectedAuthorIndex.value = -1
  }

  const clearReference = () => {
    form.value.selectedReference = null
    referenceQuery.value = ''
    selectedReferenceIndex.value = -1
  }

  const resetForm = () => {
    form.value = {
      content: '',
      language: { label: 'English', value: 'en' },
      selectedAuthor: null,
      selectedReference: null
    }
    authorQuery.value = ''
    referenceQuery.value = ''
    authorSuggestions.value = []
    referenceSuggestions.value = []
    selectedAuthorIndex.value = -1
    selectedReferenceIndex.value = -1
  }

  const initializeFormForEdit = (editQuote?: QuoteWithRelations | AdminQuote | null) => {
    if (!editQuote) return
    const quote: any = editQuote
    form.value.content = quote.name || ''
    const languageOption = languageOptions.find(opt => opt.value === quote.language)
    form.value.language = languageOption || { label: 'English', value: 'en' }

    if (quote.author) {
      form.value.selectedAuthor = quote.author as Author
      authorQuery.value = quote.author.name || ''
    }

    if (quote.reference) {
      form.value.selectedReference = quote.reference as QuoteReference
      referenceQuery.value = quote.reference.name || ''
    }
  }

  const scrollToSelectedAuthorItem = () => {
    nextTick(() => {
      if (selectedAuthorIndex.value >= 0 && authorSuggestionsRef.value) {
        const items = (authorSuggestionsRef.value as HTMLElement).children
        const selectedItem = items[selectedAuthorIndex.value]
        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }

  const scrollToSelectedReferenceItem = () => {
    nextTick(() => {
      if (selectedReferenceIndex.value >= 0 && referenceSuggestionsRef.value) {
        const items = (referenceSuggestionsRef.value as HTMLElement).children
        const selectedItem = items[selectedReferenceIndex.value]
        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }

  const createPayload = (user: any): CreateQuoteData => {
    return {
      name: form.value.content.trim(),
      language: form.value.language.value as QuoteLanguage,
      author_id: form.value.selectedAuthor?.id,
      reference_id: form.value.selectedReference?.id,
      new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
      new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value as QuoteLanguage, primary_type: 'other' as const } : undefined,
      user_id: user?.id || -1
    }
  }

  return {
    // state
    form,
    languageOptions,
    authorQuery,
    referenceQuery,
    authorSuggestions,
    referenceSuggestions,
    showAuthorSuggestions,
    showReferenceSuggestions,
    submitting,
    selectedAuthorIndex,
    selectedReferenceIndex,

    // template refs
    authorInputRef,
    referenceInputRef,
    authorSuggestionsRef,
    referenceSuggestionsRef,

    // search (network)
    searchAuthors,
    searchReferences,

    // focus / blur / keyboard handlers (authors)
    handleAuthorInputFocus,
    handleAuthorInputBlur,
    handleAuthorSuggestionsBlur,
    handleAuthorKeydown,

    // focus / blur / keyboard handlers (references)
    handleReferenceInputFocus,
    handleReferenceInputBlur,
    handleReferenceSuggestionsBlur,
    handleReferenceKeydown,

    // selection helpers
    selectAuthor,
    selectReference,
    createNewAuthor,
    createNewReference,
    clearAuthor,
    clearReference,

    // form lifecycle / actions
    resetForm,
    initializeFormForEdit,
    createPayload,

    // utilities
    scrollToSelectedAuthorItem,
    scrollToSelectedReferenceItem
  }
}
