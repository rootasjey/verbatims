<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    :submit-text="submitButtonText"
    :submitting="submitting"
    :can-submit="!!titleQuery.trim()"
    max-width="md"
    scrollable
    @submit="submitReference"
  >
    <form @submit.prevent="submitReference" @keydown.ctrl.enter.prevent="submitReference" @keydown.meta.enter.prevent="submitReference" class="space-y-6 m-1">
      <div>
        <div class="relative">
          <NInput
            ref="titleInputRef"
            v-model="titleQuery"
            placeholder="Enter reference title..."
            :disabled="submitting"
            required
            autofocus
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{
              inputTrailingWrapper: 'pr-1.5'
            }"
            @input="searchReferences"
            @focus="handleTitleInputFocus"
            @blur="handleTitleInputBlur"
            @keydown="handleTitleKeydown"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                Title *
              </NBadge>
            </template>
          </NInput>
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

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Type *</label>
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

      <NInput
        v-model="form.secondary_type"
        placeholder="e.g., Horror, Comedy, Biography..."
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{
          inputTrailingWrapper: 'pr-1.5'
        }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            Genre/Category
          </NBadge>
        </template>
      </NInput>

      <div class="flex items-start gap-4">
        <div class="grow-2">
          <NInput
            v-model="form.release_date"
            type="date"
            :disabled="submitting"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{
              inputTrailingWrapper: 'pr-1.5'
            }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                Release Date
              </NBadge>
            </template>
          </NInput>
        </div>

        <div class="grow-1">
          <NSelect
            v-model="form.original_language"
            :items="languageOptions"
            placeholder="Select language"
            :disabled="submitting"
            item-key="label"
            value-key="label"
          />
          <label class="mt-1 pl-1 block text-xs font-600 text-gray-900 dark:text-white">Original Language</label>
        </div>
      </div>

      <div>
        <NInput
          v-model="form.image_url"
          type="url"
          placeholder="https://example.com/cover.jpg"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{
            inputTrailingWrapper: 'pr-1.5'
          }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              Cover Image URL
            </NBadge>
          </template>
        </NInput>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">

        <div class="mt-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 p-3">
          <div class="flex items-center gap-3">
            <div
              class="relative h-16 w-12 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800 flex-shrink-0 cursor-pointer group"
              @click="fileInputRef?.click()"
            >
              <img
                v-if="referencePreviewUrl && !referencePreviewErrored"
                :src="referencePreviewUrl"
                alt="Reference cover preview"
                class="h-full w-full object-cover"
                @error="referencePreviewErrored = true"
              />
              <div v-else class="h-full w-full flex items-center justify-center">
                <NIcon name="i-ph-image" class="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div class="absolute inset-0 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/0 group-hover:bg-black/40">
                <NIcon :name="uploading ? 'i-ph-circle-notch' : 'i-ph-upload'" class="w-5 h-5 text-white drop-shadow" :class="uploading ? 'animate-spin' : ''" />
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Cover preview</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                <span class="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline" @click="fileInputRef?.click()">Click to upload an image</span>
                or paste an accessible cover or poster URL to preview it here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NInput
        type="textarea"
        v-model="form.description"
        placeholder="Brief description or synopsis..."
        :rows="6"
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{
          inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial'
        }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            Description
          </NBadge>
        </template>
      </NInput>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

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

const form = ref({
  name: '',
  primary_type: { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
  secondary_type: '',
  release_date: '',
  original_language: { label: 'English', value: 'en' },
  image_url: '',
  description: ''
})

const titleQuery = ref('')
const titleSuggestions = ref<QuoteReference[]>([])
const showTitleSuggestions = ref(false)
const submitting = ref(false)

const selectedTitleIndex = ref(-1)

const titleInputRef = ref()
const titleSuggestionsRef = ref()
const referencePreviewErrored = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const { uploading, uploadImage } = useImageUpload()
const { showErrorToast } = useErrorToast()

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const url = await uploadImage(file)
  if (url) {
    form.value.image_url = url
  }
  target.value = ''
}

const referencePreviewUrl = computed(() => {
  const value = form.value.image_url.trim()
  return value || ''
})

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

const searchReferences = useDebounceFn(async () => {
  if (!titleQuery.value.trim() || titleQuery.value.trim().length < 2) {
    titleSuggestions.value = []
    return
  }

  try {
    const response = await $fetch<ApiResponse<QuoteReference[]>>('/api/references/search', {
      query: { q: titleQuery.value, limit: 5 }
    })
    titleSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching references:', error)
    titleSuggestions.value = []
  }
}, 300)

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
           selectExistingReference(titleSuggestions.value[selectedTitleIndex.value]!)
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

const selectExistingReference = (reference: QuoteReference) => {
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
  referencePreviewErrored.value = false
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

watch(() => form.value.image_url, () => {
  referencePreviewErrored.value = false
})

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
      await $fetch(`/api/admin/references/${props.editReference.id}`, {
        method: 'PUT',
        body: payload
      })

      emit('reference-updated')
    } else {
      await $fetch('/api/admin/references', {
        method: 'POST',
        body: payload
      })

      emit('reference-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting reference:', error)
    showErrorToast(error, isEditMode.value ? 'Failed to update reference. Please try again.' : 'Failed to create reference. Please try again.')
  } finally {
    submitting.value = false
  }
}

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
