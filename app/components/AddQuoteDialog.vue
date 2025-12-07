<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600">{{ dialogTitle }}</h3>

      <form @submit.prevent="submitQuote" @keydown="handleFormKeydown" class="mt-6 space-y-6">
        <div>
          <NInput
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
            <NInput
              ref="authorInputRef"
              v-model="authorQuery"
              placeholder="Search for an author or enter a new one..."
              :disabled="submitting"
              @input="onAuthorInput"
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
            <NButton
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
            <NInput
              ref="referenceInputRef"
              v-model="referenceQuery"
              placeholder="Search for a reference or enter a new one..."
              :disabled="submitting"
              @input="onReferenceInput"
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
            <NButton
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
          <NSelect
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
        <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">
          Cancel
        </NButton>
        <NButton
          btn="soft-blue"
          :loading="submitting"
          @click="submitQuote"
          :disabled="!form.content.trim()"
        >
          {{ submitButtonText }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type {
  QuoteWithRelations,
  AdminQuote, CreateQuoteData,
} from '~/types'

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
const submitButtonText = computed(() => isEditMode.value ? 'Update Quote' : 'Save as Draft')

import { useQuoteForm } from '~/composables/useQuoteForm'
const {
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
  authorInputRef,
  referenceInputRef,
  authorSuggestionsRef,
  referenceSuggestionsRef,
  searchAuthors,
  searchReferences,
  handleAuthorInputFocus,
  handleAuthorInputBlur,
  handleAuthorSuggestionsBlur,
  handleAuthorKeydown,
  handleReferenceInputFocus,
  handleReferenceInputBlur,
  handleReferenceSuggestionsBlur,
  handleReferenceKeydown,
  selectAuthor,
  selectReference,
  createNewAuthor,
  createNewReference,
  clearAuthor,
  clearReference,
  resetForm,
  initializeFormForEdit,
  scrollToSelectedAuthorItem,
  scrollToSelectedReferenceItem,
  createPayload
} = useQuoteForm()

const handleFormKeydown = (event: KeyboardEvent) => {
  // Handle Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) to submit form
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (form.value.content.trim() && !submitting.value) submitQuote()
  }
}

const onAuthorInput = () => {
  void searchAuthors($fetch, { limit: 5, minLength: 1 })
}

const onReferenceInput = () => {
  void searchReferences($fetch, { limit: 5, minLength: 1 })
}

const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

watch(() => props.editQuote, (newQuote) => {
  if (newQuote) initializeFormForEdit(newQuote)
  else resetForm()
}, { immediate: true })

const showContentEmptyError = () => {
  useToast().toast({
    title: 'Content Required',
    description: 'Please enter the quote content before submitting.'
  })
}

const showNotLoggedInError = () => {
  useToast().toast({
    title: 'Not Logged In',
    description: 'You must be logged in to submit a quote.',
    actions: [
      {
        label: 'Log In',
        btn: 'primary',
        altText: 'Log in to your account',
        onClick: () => {
          navigateTo('/login')
          closeDialog()
        }
      },
      {
        label: 'Create Account',
        btn: 'ghost',
        altText: 'Create a new account',
        onClick: () => {
          navigateTo('/signup')
          closeDialog()
        }
      }
    ]
  })
}

const submitQuote = async () => {
  if (!form.value.content.trim()) { showContentEmptyError(); return }
  if (!user.value) { showNotLoggedInError(); return }
  submitting.value = true

  try {
    const payload = createPayload(user.value)

    if (isEditMode.value && props.editQuote) {
      const id = props.editQuote.id
      await submitUpdateQuote(id, payload)
      return
    }

    await submitCreateQuote(payload)
  } catch (error) {
    console.error('Error submitting quote:', error)
    useToast().toast({
      title: 'Error',
      description: isEditMode.value ? 'Failed to update quote. Please try again.' : 'Failed to add quote. Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

const submitCreateQuote = async (payload: CreateQuoteData) => {
  await $fetch('/api/quotes', {
    method: 'POST',
    body: payload
  })
  
  emit('quote-added')
  closeDialog()
}

const submitUpdateQuote = async (editQuoteId: number, payload: CreateQuoteData) => {
  await $fetch(`/api/quotes/${editQuoteId}`, {
    method: 'PUT',
    body: payload,
  })
  
  emit('quote-updated')
  closeDialog()
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
