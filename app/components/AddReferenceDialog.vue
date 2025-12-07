<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ dialogTitle }}</h3>
      </div>

      <form @submit.prevent="submitReference" @keydown="handleFormKeydown" class="space-y-6">
        <!-- Reference Title -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Title *
          </label>
          <div class="relative">
            <NInput
              ref="titleInputRef"
              v-model="titleQuery"
              placeholder="Enter reference title..."
              :disabled="submitting"
              @input="searchReferences"
              @focus="handleTitleInputFocus"
              @blur="handleTitleInputBlur"
              @keydown="handleTitleKeydown"
              required
              autofocus
            />
            <!-- Reference Title Suggestions -->
            <div
              v-if="showTitleSuggestions && (titleSuggestions.length > 0 || titleQuery)"
              ref="titleSuggestionsRef"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
              tabindex="-1"
              @blur="handleTitleSuggestionsBlur"
              @keydown="handleTitleKeydown"
            >
              <div
                v-for="(reference, index) in titleSuggestions"
                :key="reference.id"
                :class="[
                  'px-3 py-2 cursor-pointer flex items-center space-x-2',
                  selectedTitleIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="selectExistingReference(reference)"
                @mouseenter="selectedTitleIndex = index"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ reference.name }}</div>
                  <div v-if="reference.primary_type" class="text-xs text-gray-500 capitalize">{{ reference.primary_type.replace('_', ' ') }}</div>
                </div>
              </div>
              <div
                v-if="titleQuery && !titleSuggestions.some(r => r.name.toLowerCase() === titleQuery.toLowerCase())"
                :class="[
                  'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
                  selectedTitleIndex === titleSuggestions.length
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="useNewReferenceTitle"
                @mouseenter="selectedTitleIndex = titleSuggestions.length"
              >
                <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Create new reference: "{{ titleQuery }}"
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Primary Type -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Type *
          </label>
          <div>
            <NSelect
              v-model="form.primary_type"
              :items="primaryTypeOptions"
              placeholder="Select type"
              :disabled="submitting"
              item-key="label"
              value-key="label"
              required
            />
          </div>
        </div>

        <!-- Secondary Type/Genre -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Genre/Category
          </label>
          <NInput
            v-model="form.secondary_type"
            placeholder="e.g., Horror, Comedy, Biography..."
            :disabled="submitting"
          />
        </div>

        <!-- Publication/Release Date -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Publication/Release Date
          </label>
          <NInput
            v-model="form.release_date"
            type="date"
            :disabled="submitting"
          />
        </div>

        <!-- Original Language -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Original Language
          </label>
          <NSelect
            v-model="form.original_language"
            :items="languageOptions"
            placeholder="Select language"
            :disabled="submitting"
            item-key="label"
            value-key="label"
          />
        </div>

        <!-- Image URL -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Cover/Poster Image URL
          </label>
          <NInput
            v-model="form.image_url"
            type="url"
            placeholder="https://example.com/cover.jpg"
            :disabled="submitting"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Description
          </label>
          <NInput
            type="textarea"
            v-model="form.description"
            placeholder="Brief description or synopsis..."
            :rows="3"
            :disabled="submitting"
          />
        </div>
      </form>

      <div class="mt-6 flex justify-end space-x-3">
        <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">
          Cancel
        </NButton>
        <NButton
          btn="soft-blue"
          :loading="submitting"
          @click="submitReference"
          :disabled="!titleQuery.trim() || !form.primary_type.value"
        >
          {{ submitButtonText }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { QuoteReference, QuoteReferencePrimaryType, CreateQuoteReferenceData, UpdateQuoteReferenceData } from '~/types/quote-reference'

interface Props {
  modelValue: boolean
  editReference?: QuoteReference | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'reference-added'): void
  (e: 'reference-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editReference)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Reference' : 'Add New Reference')
const submitButtonText = computed(() => isEditMode.value ? 'Update Reference' : 'Create Reference')

// Form state
const form = ref({
  name: '',
  primary_type: { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
  secondary_type: '',
  release_date: '',
  original_language: { label: 'English', value: 'en' },
  image_url: '',
  description: ''
})

// Search state
const titleQuery = ref('')
const titleSuggestions = ref<QuoteReference[]>([])
const showTitleSuggestions = ref(false)
const submitting = ref(false)

// Keyboard navigation state
const selectedTitleIndex = ref(-1)

// Template refs
const titleInputRef = ref()
const titleSuggestionsRef = ref()

// Options
const primaryTypeOptions = [
  { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
  { label: 'Film', value: 'film' as QuoteReferencePrimaryType },
  { label: 'TV Series', value: 'tv_series' as QuoteReferencePrimaryType },
  { label: 'Music', value: 'music' as QuoteReferencePrimaryType },
  { label: 'Speech', value: 'speech' as QuoteReferencePrimaryType },
  { label: 'Podcast', value: 'podcast' as QuoteReferencePrimaryType },
  { label: 'Interview', value: 'interview' as QuoteReferencePrimaryType },
  { label: 'Documentary', value: 'documentary' as QuoteReferencePrimaryType },
  { label: 'Media Stream', value: 'media_stream' as QuoteReferencePrimaryType },
  { label: 'Writings', value: 'writings' as QuoteReferencePrimaryType },
  { label: 'Video Game', value: 'video_game' as QuoteReferencePrimaryType },
  { label: 'Other', value: 'other' as QuoteReferencePrimaryType }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' }
]

// Search debounced function
const searchReferences = useDebounceFn(async () => {
  if (!titleQuery.value.trim() || titleQuery.value.trim().length < 2) {
    titleSuggestions.value = []
    return
  }

  try {
    const response = await $fetch('/api/references/search', {
      query: { q: titleQuery.value, limit: 5 }
    })
    titleSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching references:', error)
    titleSuggestions.value = []
  }
}, 300)

// Title input focus and keyboard navigation functions
const handleTitleInputFocus = () => {
  showTitleSuggestions.value = true
  selectedTitleIndex.value = -1
}

const handleTitleInputBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && titleSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }, 150)
}

const handleTitleSuggestionsBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && titleInputRef.value?.$el?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }, 150)
}

const handleTitleKeydown = (event: KeyboardEvent) => {
  if (!showTitleSuggestions.value) return

  const totalItems = titleSuggestions.value.length + (titleQuery.value && !titleSuggestions.value.some(r => r.name.toLowerCase() === titleQuery.value.toLowerCase()) ? 1 : 0)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedTitleIndex.value = selectedTitleIndex.value < totalItems - 1 ? selectedTitleIndex.value + 1 : 0
      scrollToSelectedTitleItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedTitleIndex.value = selectedTitleIndex.value > 0 ? selectedTitleIndex.value - 1 : totalItems - 1
      scrollToSelectedTitleItem()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedTitleIndex.value >= 0) {
        if (selectedTitleIndex.value < titleSuggestions.value.length) {
          selectExistingReference(titleSuggestions.value[selectedTitleIndex.value])
        } else {
          useNewReferenceTitle()
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      showTitleSuggestions.value = false
      selectedTitleIndex.value = -1
      titleInputRef.value?.$el?.focus()
      break
  }
}

const handleFormKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (titleQuery.value.trim() && form.value.primary_type.value && !submitting.value) {
      submitReference()
    }
  }
}

// Auto-scroll function for keyboard navigation
const scrollToSelectedTitleItem = () => {
  nextTick(() => {
    if (selectedTitleIndex.value >= 0 && titleSuggestionsRef.value) {
      const items = titleSuggestionsRef.value.children
      const selectedItem = items[selectedTitleIndex.value]
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
const selectExistingReference = (reference: QuoteReference) => {
  // Fill form with existing reference data for editing
  const primaryTypeOption = primaryTypeOptions.find(opt => opt.value === reference.primary_type)
  const languageOption = languageOptions.find(opt => opt.value === reference.original_language)

  form.value = {
    name: reference.name,
    primary_type: primaryTypeOption || { label: 'Other', value: 'other' as QuoteReferencePrimaryType },
    secondary_type: reference.secondary_type || '',
    release_date: reference.release_date || '',
    original_language: languageOption || { label: 'English', value: 'en' },
    image_url: reference.image_url || '',
    description: reference.description || ''
  }
  titleQuery.value = reference.name
  showTitleSuggestions.value = false
  selectedTitleIndex.value = -1
}

const useNewReferenceTitle = () => {
  form.value.name = titleQuery.value
  showTitleSuggestions.value = false
  selectedTitleIndex.value = -1
}

const resetForm = () => {
  form.value = {
    name: '',
    primary_type: { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
    secondary_type: '',
    release_date: '',
    original_language: { label: 'English', value: 'en' },
    image_url: '',
    description: ''
  }
  titleQuery.value = ''
  titleSuggestions.value = []
  selectedTitleIndex.value = -1
}

const initializeFormForEdit = () => {
  if (!props.editReference) return

  const reference = props.editReference
  const primaryTypeOption = primaryTypeOptions.find(opt => opt.value === reference.primary_type)
  const languageOption = languageOptions.find(opt => opt.value === reference.original_language)

  form.value = {
    name: reference.name,
    primary_type: primaryTypeOption || { label: 'Other', value: 'other' as QuoteReferencePrimaryType },
    secondary_type: reference.secondary_type || '',
    release_date: reference.release_date || '',
    original_language: languageOption || { label: 'English', value: 'en' },
    image_url: reference.image_url || '',
    description: reference.description || ''
  }
  titleQuery.value = reference.name
}

const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

// Watch for editReference changes to initialize form
watch(() => props.editReference, (newReference) => {
  if (newReference) {
    initializeFormForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

const submitReference = async () => {
  if (!titleQuery.value.trim() || !form.value.primary_type.value) return

  submitting.value = true
  try {
    // Update form name with current query
    form.value.name = titleQuery.value.trim()

    const payload: CreateQuoteReferenceData | UpdateQuoteReferenceData = {
      name: form.value.name,
      primary_type: form.value.primary_type.value,
      secondary_type: form.value.secondary_type.trim() || null,
      release_date: form.value.release_date || null,
      original_language: form.value.original_language.value,
      image_url: form.value.image_url.trim() || null,
      description: form.value.description.trim() || null
    }

    if (isEditMode.value && props.editReference) {
      // Update existing reference
      await $fetch(`/api/admin/references/${props.editReference.id}`, {
        method: 'PUT',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: 'Reference Updated',
        description: 'The reference has been updated successfully.'
      })

      emit('reference-updated')
    } else {
      // Create new reference
      await $fetch('/api/admin/references', {
        method: 'POST',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: 'Reference Created',
        description: 'The reference has been created successfully.'
      })

      emit('reference-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting reference:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: isEditMode.value ? 'Failed to update reference. Please try again.' : 'Failed to create reference. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

// Click outside to close suggestions
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
