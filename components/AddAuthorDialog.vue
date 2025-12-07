<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ dialogTitle }}</h3>
      </div>

      <form @submit.prevent="submitAuthor" @keydown="handleFormKeydown" class="space-y-6">
        <!-- Author Name -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Author Name *
          </label>
          <div class="relative">
            <NInput
              ref="nameInputRef"
              v-model="nameQuery"
              placeholder="Enter author name..."
              :disabled="submitting"
              @input="searchAuthors"
              @focus="handleNameInputFocus"
              @blur="handleNameInputBlur"
              @keydown="handleNameKeydown"
              required
              autofocus
            />
            <!-- Author Name Suggestions -->
            <div
              v-if="showNameSuggestions && (nameSuggestions.length > 0 || nameQuery)"
              ref="nameSuggestionsRef"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
              tabindex="-1"
              @blur="handleNameSuggestionsBlur"
              @keydown="handleNameKeydown"
            >
              <div
                v-for="(author, index) in nameSuggestions"
                :key="author.id"
                :class="[
                  'px-3 py-2 cursor-pointer flex items-center space-x-2',
                  selectedNameIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="selectExistingAuthor(author)"
                @mouseenter="selectedNameIndex = index"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ author.name }}</div>
                  <div v-if="author.job" class="text-xs text-gray-500">{{ author.job }}</div>
                </div>
              </div>
              <div
                v-if="nameQuery && !nameSuggestions.some(a => a.name.toLowerCase() === nameQuery.toLowerCase())"
                :class="[
                  'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
                  selectedNameIndex === nameSuggestions.length
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="useNewAuthorName"
                @mouseenter="selectedNameIndex = nameSuggestions.length"
              >
                <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Create new author: "{{ nameQuery }}"
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Job/Title -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Job/Title
          </label>
          <NInput
            v-model="form.job"
            placeholder="e.g., Writer, Philosopher, Actor..."
            :disabled="submitting"
          />
        </div>

        <!-- Birth Date -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Birth Date
          </label>
          <NInput
            v-model="form.birth_date"
            type="date"
            :disabled="submitting"
          />
        </div>

        <!-- Death Date -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Death Date
          </label>
          <NInput
            v-model="form.death_date"
            type="date"
            :disabled="submitting"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty if the author is still alive
          </p>
        </div>

        <!-- Avatar/Image URL -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Avatar/Image URL
          </label>
          <NInput
            v-model="form.image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            :disabled="submitting"
          />
        </div>

        <!-- Is Fictional -->
        <div>
          <label class="flex items-center space-x-2">
            <NToggle
              v-model="form.is_fictional"
              :disabled="submitting"
            />
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              This is a fictional character
            </span>
          </label>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Description
          </label>
          <NInput
            type="textarea"
            v-model="form.description"
            placeholder="Brief biographical description..."
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
          @click="submitAuthor"
          :disabled="!nameQuery.trim()"
        >
          {{ submitButtonText }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { Author, CreateAuthorData, UpdateAuthorData } from '~/types/author'

interface Props {
  modelValue: boolean
  editAuthor?: Author | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'author-added'): void
  (e: 'author-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editAuthor)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Author' : 'Add New Author')
const submitButtonText = computed(() => isEditMode.value ? 'Update Author' : 'Create Author')

// Form state
const form = ref({
  name: '',
  job: '',
  birth_date: '',
  death_date: '',
  image_url: '',
  is_fictional: false,
  description: ''
})

// Search state
const nameQuery = ref('')
const nameSuggestions = ref<Author[]>([])
const showNameSuggestions = ref(false)
const submitting = ref(false)

// Keyboard navigation state
const selectedNameIndex = ref(-1)

// Template refs
const nameInputRef = ref()
const nameSuggestionsRef = ref()

// Search debounced function
const searchAuthors = useDebounceFn(async () => {
  if (!nameQuery.value.trim() || nameQuery.value.trim().length < 2) {
    nameSuggestions.value = []
    return
  }

  try {
    const response = await $fetch('/api/authors/search', {
      query: { q: nameQuery.value, limit: 5 }
    })
    nameSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching authors:', error)
    nameSuggestions.value = []
  }
}, 300)

// Name input focus and keyboard navigation functions
const handleNameInputFocus = () => {
  showNameSuggestions.value = true
  selectedNameIndex.value = -1
}

const handleNameInputBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && nameSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }, 150)
}

const handleNameSuggestionsBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && nameInputRef.value?.$el?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }, 150)
}

const handleNameKeydown = (event: KeyboardEvent) => {
  if (!showNameSuggestions.value) return

  const totalItems = nameSuggestions.value.length + (nameQuery.value && !nameSuggestions.value.some(a => a.name.toLowerCase() === nameQuery.value.toLowerCase()) ? 1 : 0)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedNameIndex.value = selectedNameIndex.value < totalItems - 1 ? selectedNameIndex.value + 1 : 0
      scrollToSelectedNameItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedNameIndex.value = selectedNameIndex.value > 0 ? selectedNameIndex.value - 1 : totalItems - 1
      scrollToSelectedNameItem()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedNameIndex.value >= 0) {
        if (selectedNameIndex.value < nameSuggestions.value.length) {
          selectExistingAuthor(nameSuggestions.value[selectedNameIndex.value])
        } else {
          useNewAuthorName()
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      showNameSuggestions.value = false
      selectedNameIndex.value = -1
      nameInputRef.value?.$el?.focus()
      break
  }
}

const handleFormKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (nameQuery.value.trim() && !submitting.value) {
      submitAuthor()
    }
  }
}

// Auto-scroll function for keyboard navigation
const scrollToSelectedNameItem = () => {
  nextTick(() => {
    if (selectedNameIndex.value >= 0 && nameSuggestionsRef.value) {
      const items = nameSuggestionsRef.value.children
      const selectedItem = items[selectedNameIndex.value]
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
const selectExistingAuthor = (author: Author) => {
  // Fill form with existing author data for editing
  form.value = {
    name: author.name,
    job: author.job || '',
    birth_date: author.birth_date || '',
    death_date: author.death_date || '',
    image_url: author.image_url || '',
    is_fictional: author.is_fictional,
    description: author.description || ''
  }
  nameQuery.value = author.name
  showNameSuggestions.value = false
  selectedNameIndex.value = -1
}

const useNewAuthorName = () => {
  form.value.name = nameQuery.value
  showNameSuggestions.value = false
  selectedNameIndex.value = -1
}

const resetForm = () => {
  form.value = {
    name: '',
    job: '',
    birth_date: '',
    death_date: '',
    image_url: '',
    is_fictional: false,
    description: ''
  }
  nameQuery.value = ''
  nameSuggestions.value = []
  selectedNameIndex.value = -1
}

const initializeFormForEdit = () => {
  if (!props.editAuthor) return

  const author = props.editAuthor
  form.value = {
    name: author.name,
    job: author.job || '',
    birth_date: author.birth_date || '',
    death_date: author.death_date || '',
    image_url: author.image_url || '',
    is_fictional: author.is_fictional,
    description: author.description || ''
  }
  nameQuery.value = author.name
}

const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

// Watch for editAuthor changes to initialize form
watch(() => props.editAuthor, (newAuthor) => {
  if (newAuthor) {
    initializeFormForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

const submitAuthor = async () => {
  if (!nameQuery.value.trim()) return

  submitting.value = true
  try {
    // Update form name with current query
    form.value.name = nameQuery.value.trim()

    const payload: CreateAuthorData | UpdateAuthorData = {
      name: form.value.name,
      job: form.value.job.trim() || null,
      birth_date: form.value.birth_date || null,
      death_date: form.value.death_date || null,
      image_url: form.value.image_url.trim() || null,
      is_fictional: form.value.is_fictional,
      description: form.value.description.trim() || null
    }

    if (isEditMode.value && props.editAuthor) {
      // Update existing author
      await $fetch(`/api/admin/authors/${props.editAuthor.id}`, {
        method: 'PUT',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: 'Author Updated',
        description: 'The author has been updated successfully.'
      })

      emit('author-updated')
    } else {
      // Create new author
      await $fetch('/api/admin/authors', {
        method: 'POST',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: 'Author Created',
        description: 'The author has been created successfully.'
      })

      emit('author-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting author:', error)
    useToast().toast({
      toast: 'error',
      title: 'Error',
      description: isEditMode.value ? 'Failed to update author. Please try again.' : 'Failed to create author. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

// Click outside to close suggestions
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
