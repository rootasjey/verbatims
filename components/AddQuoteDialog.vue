<template>
  <UDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600">{{ dialogTitle }}</h3>

      <form @submit.prevent="submitQuote" @keydown="handleFormKeydown" class="mt-6 space-y-6">
        <div>
          <UInput
            type="textarea"
            autofocus
            v-model="form.content"
            class="text-size-6 font-600 font-subtitle border-dashed
              focus-visible:border-gray-700 ring-transparent light:focus-visible:ring-transparent dark:focus-visible:ring-transparent dark:focus-visible:border-gray-300"
            placeholder="Enter the quote content..."
            :rows="4"
            :disabled="submitting"
            required
          />
          <!-- Character Counter -->
          <div class="mt-2 text-right">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ form.content.length }} characters
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Author
          </label>
          <div class="relative">
            <UInput
              ref="authorInputRef"
              v-model="authorQuery"
              placeholder="Search for an author or enter a new one..."
              :disabled="submitting"
              @input="searchAuthors"
              @focus="handleAuthorInputFocus"
              @blur="handleAuthorInputBlur"
              @keydown="handleAuthorKeydown"
            />
            <!-- Author Suggestions -->
            <div
              v-if="showAuthorSuggestions && (authorSuggestions.length > 0 || authorQuery)"
              ref="authorSuggestionsRef"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
              tabindex="-1"
              @blur="handleAuthorSuggestionsBlur"
              @keydown="handleAuthorKeydown"
            >
              <div
                v-for="(author, index) in authorSuggestions"
                :key="author.id"
                :class="[
                  'px-3 py-2 cursor-pointer flex items-center space-x-2',
                  selectedAuthorIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="selectAuthor(author)"
                @mouseenter="selectedAuthorIndex = index"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ author.name }}</div>
                  <div v-if="author.job" class="text-xs text-gray-500">{{ author.job }}</div>
                </div>
              </div>
              <div
                v-if="authorQuery && !authorSuggestions.some(a => a.name.toLowerCase() === authorQuery.toLowerCase())"
                :class="[
                  'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
                  selectedAuthorIndex === authorSuggestions.length
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="createNewAuthor"
                @mouseenter="selectedAuthorIndex = authorSuggestions.length"
              >
                <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Create new author: "{{ authorQuery }}"
                </div>
              </div>
            </div>
          </div>
          <!-- Selected Author Display -->
          <div v-if="form.selectedAuthor" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
            <div>
              <span class="text-sm font-medium">{{ form.selectedAuthor.name }}</span>
              <span v-if="form.selectedAuthor.job" class="text-xs text-gray-500 ml-2">{{ form.selectedAuthor.job }}</span>
            </div>
            <UButton
              size="xs"
              btn="ghost"
              icon
              label="i-ph-x"
              @click="clearAuthor"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Reference
          </label>
          <div class="relative">
            <UInput
              ref="referenceInputRef"
              v-model="referenceQuery"
              placeholder="Search for a reference or enter a new one..."
              :disabled="submitting"
              @input="searchReferences"
              @focus="handleReferenceInputFocus"
              @blur="handleReferenceInputBlur"
              @keydown="handleReferenceKeydown"
            />
            <!-- Reference Suggestions -->
            <div
              v-if="showReferenceSuggestions && (referenceSuggestions.length > 0 || referenceQuery)"
              ref="referenceSuggestionsRef"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
              tabindex="-1"
              @blur="handleReferenceSuggestionsBlur"
              @keydown="handleReferenceKeydown"
            >
              <div
                v-for="(reference, index) in referenceSuggestions"
                :key="reference.id"
                :class="[
                  'px-3 py-2 cursor-pointer flex items-center space-x-2',
                  selectedReferenceIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="selectReference(reference)"
                @mouseenter="selectedReferenceIndex = index"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ reference.name }}</div>
                  <div v-if="reference.primary_type" class="text-xs text-gray-500 capitalize">{{ reference.primary_type.replace('_', ' ') }}</div>
                </div>
              </div>
              <div
                v-if="referenceQuery && !referenceSuggestions.some(r => r.name.toLowerCase() === referenceQuery.toLowerCase())"
                :class="[
                  'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
                  selectedReferenceIndex === referenceSuggestions.length
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="createNewReference"
                @mouseenter="selectedReferenceIndex = referenceSuggestions.length"
              >
                <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Create new reference: "{{ referenceQuery }}"
                </div>
              </div>
            </div>
          </div>
          <!-- Selected Reference Display -->
          <div v-if="form.selectedReference" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
            <div>
              <span class="text-sm font-medium">{{ form.selectedReference.name }}</span>
              <span v-if="form.selectedReference.primary_type" class="text-xs text-gray-500 ml-2 capitalize">{{ form.selectedReference.primary_type.replace('_', ' ') }}</span>
            </div>
            <UButton
              size="xs"
              btn="ghost"
              icon
              label="i-ph-x"
              @click="clearReference"
            />
          </div>
        </div>

        <!-- Language -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Language
          </label>
          <USelect
            v-model="form.language"
            :items="languageOptions"
            placeholder="Select language"
            :disabled="submitting"
            item-key="label"
            value-key="label"
          />
        </div>
      </form>

      <div class="mt-6 flex justify-end space-x-3">
        <UButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">
          Cancel
        </UButton>
        <UButton
          btn="soft-blue"
          :loading="submitting"
          @click="submitQuote"
          :disabled="!form.content.trim()"
        >
          {{ submitButtonText }}
        </UButton>
      </div>
    </div>
  </UDialog>
</template>

<script setup lang="ts">
import type { Author } from '~/types/author'
import type { QuoteReference } from '~/types/quote-reference'
import type { QuoteWithRelations, AdminQuote } from '~/types/quote'

interface Props {
  modelValue: boolean
  editQuote?: QuoteWithRelations | AdminQuote | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'quote-added'): void
  (e: 'quote-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { user } = useUserSession()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editQuote)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Quote' : 'Add New Quote')
const submitButtonText = computed(() => isEditMode.value ? 'Update Quote' : 'Submit Quote')

// Form state
const form = ref({
  content: '',
  language: { label: 'English', value: 'en' },
  selectedAuthor: null as Author | null,
  selectedReference: null as QuoteReference | null
})

// Search state
const authorQuery = ref('')
const referenceQuery = ref('')
const authorSuggestions = ref<Author[]>([])
const referenceSuggestions = ref<QuoteReference[]>([])
const showAuthorSuggestions = ref(false)
const showReferenceSuggestions = ref(false)
const submitting = ref(false)

// Keyboard navigation state
const selectedAuthorIndex = ref(-1)
const selectedReferenceIndex = ref(-1)

// Template refs
const authorInputRef = ref()
const referenceInputRef = ref()
const authorSuggestionsRef = ref()
const referenceSuggestionsRef = ref()

// Language options
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  // { label: 'Spanish', value: 'es' },
  // { label: 'German', value: 'de' },
  // { label: 'Italian', value: 'it' },
  // { label: 'Portuguese', value: 'pt' },
  // { label: 'Russian', value: 'ru' },
  // { label: 'Japanese', value: 'ja' },
  // { label: 'Chinese', value: 'zh' }
]

// Search debounced functions
const searchAuthors = useDebounceFn(async () => {
  if (!authorQuery.value.trim()) {
    authorSuggestions.value = []
    return
  }

  try {
    const response = await $fetch('/api/authors/search', {
      query: { q: authorQuery.value, limit: 5 }
    })
    authorSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching authors:', error)
    authorSuggestions.value = []
  }
}, 300)

const searchReferences = useDebounceFn(async () => {
  if (!referenceQuery.value.trim()) {
    referenceSuggestions.value = []
    return
  }

  try {
    const response = await $fetch('/api/references/search', {
      query: { q: referenceQuery.value, limit: 5 }
    })
    referenceSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching references:', error)
    referenceSuggestions.value = []
  }
}, 300)

// Author focus and keyboard navigation functions
const handleAuthorInputFocus = () => {
  showAuthorSuggestions.value = true
  selectedAuthorIndex.value = -1
}

const handleAuthorInputBlur = (event: FocusEvent) => {
  // Don't hide suggestions if focus is moving to the suggestions dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && authorSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }, 150)
}

const handleAuthorSuggestionsBlur = (event: FocusEvent) => {
  // Don't hide suggestions if focus is moving back to the input
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && authorInputRef.value?.$el?.contains(relatedTarget)) {
    return
  }
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

const handleFormKeydown = (event: KeyboardEvent) => {
  // Handle Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) to submit form
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (form.value.content.trim() && !submitting.value) {
      submitQuote()
    }
  }
}

// Auto-scroll functions for keyboard navigation
const scrollToSelectedAuthorItem = () => {
  nextTick(() => {
    if (selectedAuthorIndex.value >= 0 && authorSuggestionsRef.value) {
      const items = authorSuggestionsRef.value.children
      const selectedItem = items[selectedAuthorIndex.value]
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      }
    }
  })
}

const scrollToSelectedReferenceItem = () => {
  nextTick(() => {
    if (selectedReferenceIndex.value >= 0 && referenceSuggestionsRef.value) {
      const items = referenceSuggestionsRef.value.children
      const selectedItem = items[selectedReferenceIndex.value]
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      }
    }
  })
}

// Selection functions
const selectAuthor = (author: Author) => {
  form.value.selectedAuthor = author
  authorQuery.value = author.name
  showAuthorSuggestions.value = false
  selectedAuthorIndex.value = -1
}

// Reference focus and keyboard navigation functions
const handleReferenceInputFocus = () => {
  showReferenceSuggestions.value = true
  selectedReferenceIndex.value = -1
}

const handleReferenceInputBlur = (event: FocusEvent) => {
  // Don't hide suggestions if focus is moving to the suggestions dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && referenceSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }, 150)
}

const handleReferenceSuggestionsBlur = (event: FocusEvent) => {
  // Don't hide suggestions if focus is moving back to the input
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && referenceInputRef.value?.$el?.contains(relatedTarget)) {
    return
  }
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

const selectReference = (reference: QuoteReference) => {
  form.value.selectedReference = reference
  referenceQuery.value = reference.name
  showReferenceSuggestions.value = false
  selectedReferenceIndex.value = -1
}

const createNewAuthor = () => {
  form.value.selectedAuthor = {
    id: 0, // Will be created
    name: authorQuery.value,
    is_fictional: false,
    birth_date: null,
    birth_location: null,
    death_date: null,
    death_location: null,
    job: null,
    description: null,
    image_url: null,
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
    id: 0, // Will be created
    name: referenceQuery.value,
    original_language: form.value.language.value,
    release_date: null,
    description: null,
    primary_type: 'other',
    secondary_type: null,
    image_url: null,
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

const initializeFormForEdit = () => {
  if (!props.editQuote) return

  const quote = props.editQuote

  // Set form content
  form.value.content = quote.name || ''

  // Set language
  const languageOption = languageOptions.find(opt => opt.value === quote.language)
  form.value.language = languageOption || { label: 'English', value: 'en' }

  // Set author if exists
  if (quote.author) {
    form.value.selectedAuthor = quote.author as Author
    authorQuery.value = quote.author.name || ''
  }

  // Set reference if exists
  if (quote.reference) {
    form.value.selectedReference = quote.reference as QuoteReference
    referenceQuery.value = quote.reference.name || ''
  }
}

const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

// Watch for editQuote changes to initialize form
watch(() => props.editQuote, (newQuote) => {
  if (newQuote) {
    initializeFormForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

const submitQuote = async () => {
  if (!form.value.content.trim() || !user.value) return

  submitting.value = true
  try {
    const payload = {
      name: form.value.content.trim(),
      language: form.value.language.value,
      author_id: form.value.selectedAuthor?.id || null,
      reference_id: form.value.selectedReference?.id || null,
      // Include new author/reference data if needed
      new_author: form.value.selectedAuthor?.id === 0 ? {
        name: form.value.selectedAuthor.name,
        is_fictional: false
      } : null,
      new_reference: form.value.selectedReference?.id === 0 ? {
        name: form.value.selectedReference.name,
        original_language: form.value.language.value,
        primary_type: 'other' as const
      } : null
    }

    if (isEditMode.value && props.editQuote) {
      // Update existing quote
      await $fetch(`/api/quotes/${props.editQuote.id}`, {
        method: 'PUT',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: 'Quote Updated',
        description: 'Your quote has been updated successfully.'
      })

      emit('quote-updated')
    } else {
      // Create new quote
      await $fetch('/api/quotes', {
        method: 'POST',
        body: {
          ...payload,
          user_id: user.value.id,
          status: 'draft' as const
        }
      })

      useToast().toast({
        toast: 'success',
        title: 'Quote Added',
        description: 'Your quote has been saved as a draft.'
      })

      emit('quote-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting quote:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: isEditMode.value ? 'Failed to update quote. Please try again.' : 'Failed to add quote. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

// Click outside to close suggestions
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showAuthorSuggestions.value = false
    showReferenceSuggestions.value = false
    selectedAuthorIndex.value = -1
    selectedReferenceIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
