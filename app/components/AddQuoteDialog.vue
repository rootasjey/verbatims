<template>
  <AppDialog
    v-model="isOpen"
    :submit-text="submitButtonText"
    :submitting="submitting"
    :can-submit="!!form.content.trim()"
    max-width="lg"
    scrollable
    @submit="submitQuote"
    @close="closeDialog"
  >
    <template #header-title>
      <div class="flex items-center gap-2">
        <NIcon name="i-lucide-quote" />
        <NIcon v-if="isEditMode" name="i-tabler-writing-filled" />
      </div>
    </template>
    <form @keydown="handleFormKeydown" class="space-y-6">
      <!-- Quote Content -->
      <div>
        <textarea
          v-model="form.content"
          autofocus
          placeholder="Enter the quote content..."
          rows="4"
          :disabled="submitting"
          required
          class="w-full font-subtitle text-xl font-500 text-gray-900
            dark:text-gray-100 rounded-2
            bg-blue-400/10 dark:bg-[#303841]/10
            px-4 py-4 placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none resize-none"
        />
        <div class="px-1 flex justify-between">
          <span class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400">{{ dialogTitle }}</span>
          <span class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400">{{ form.content.length }} characters</span>
        </div>
      </div>

      <!-- Author -->
      <div>
        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Author</label>
        <div class="relative">
          <input
            ref="authorInputRef"
            v-model="authorQuery"
            type="text"
            placeholder="Search for an author or enter a new one..."
            :disabled="submitting"
            class="w-full font-sans text-sm bg-transparent border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            @input="onAuthorInput"
            @focus="handleAuthorInputFocus"
            @blur="handleAuthorInputBlur"
            @keydown="handleAuthorKeydown"
          />
          <div
            v-if="showAuthorSuggestions && (authorSuggestions.length > 0 || authorQuery)"
            ref="authorSuggestionsRef"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto"
            tabindex="-1"
            @blur="handleAuthorSuggestionsBlur"
            @keydown="handleAuthorKeydown"
          >
            <div
              v-for="(author, index) in authorSuggestions"
              :key="author.id"
              :class="[
                'px-3 py-2 cursor-pointer font-sans text-sm',
                selectedAuthorIndex === index ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="selectAuthor(author)"
              @mouseenter="selectedAuthorIndex = index"
            >
              <p class="text-sm text-gray-900 dark:text-gray-100">{{ author.name }}</p>
              <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</p>
            </div>
            <div
              v-if="authorQuery && !authorSuggestions.some(a => a.name.toLowerCase() === authorQuery.toLowerCase())"
              :class="[
                'px-3 py-2 cursor-pointer border-t border-dashed border-gray-200 dark:border-gray-700 font-sans text-sm',
                selectedAuthorIndex === authorSuggestions.length ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="createNewAuthor"
              @mouseenter="selectedAuthorIndex === authorSuggestions.length ? selectedAuthorIndex = authorSuggestions.length : null"
            >
              <p class="text-sm text-blue-600 dark:text-blue-400">Create new author: &ldquo;{{ authorQuery }}&rdquo;</p>
            </div>
          </div>
        </div>
        <div v-if="form.selectedAuthor" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div>
            <span class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ form.selectedAuthor.name }}</span>
            <span v-if="form.selectedAuthor.job" class="font-sans text-xs text-gray-500 dark:text-gray-400 ml-2">{{ form.selectedAuthor.job }}</span>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="clearAuthor"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Reference -->
      <div>
        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Reference</label>
        <div class="relative">
          <input
            ref="referenceInputRef"
            v-model="referenceQuery"
            type="text"
            placeholder="Search for a reference or enter a new one..."
            :disabled="submitting"
            class="w-full font-sans text-sm bg-transparent border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            @input="onReferenceInput"
            @focus="handleReferenceInputFocus"
            @blur="handleReferenceInputBlur"
            @keydown="handleReferenceKeydown"
          />
          <div
            v-if="showReferenceSuggestions && (referenceSuggestions.length > 0 || referenceQuery)"
            ref="referenceSuggestionsRef"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 max-h-48 overflow-auto"
            tabindex="-1"
            @blur="handleReferenceSuggestionsBlur"
            @keydown="handleReferenceKeydown"
          >
            <div
              v-for="(reference, index) in referenceSuggestions"
              :key="reference.id"
              :class="[
                'px-3 py-2 cursor-pointer font-sans text-sm',
                selectedReferenceIndex === index ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="selectReference(reference)"
              @mouseenter="selectedReferenceIndex = index"
            >
              <p class="text-sm text-gray-900 dark:text-gray-100">{{ reference.name }}</p>
              <p v-if="reference.primary_type" class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ reference.primary_type.replace('_', ' ') }}</p>
            </div>
            <div
              v-if="referenceQuery && !referenceSuggestions.some(r => r.name.toLowerCase() === referenceQuery.toLowerCase())"
              :class="[
                'px-3 py-2 cursor-pointer border-t border-dashed border-gray-200 dark:border-gray-700 font-sans text-sm',
                selectedReferenceIndex === referenceSuggestions.length ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="createNewReference"
              @mouseenter="selectedReferenceIndex = referenceSuggestions.length"
            >
              <p class="text-sm text-blue-600 dark:text-blue-400">Create new reference: &ldquo;{{ referenceQuery }}&rdquo;</p>
            </div>
          </div>
        </div>
        <div v-if="form.selectedReference" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div>
            <span class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ form.selectedReference.name }}</span>
            <span v-if="form.selectedReference.primary_type" class="font-sans text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{{ form.selectedReference.primary_type.replace('_', ' ') }}</span>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="clearReference"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Language -->
      <div>
        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
        <select
          v-model="form.language"
          :disabled="submitting"
          class="w-full font-sans text-sm bg-transparent border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none"
          @change="onLanguageSelected(form.language)"
        >
          <option v-for="opt in languageOptions" :key="opt.value" :value="opt" class="dark:bg-gray-800">{{ opt.label }}</option>
        </select>
        <div v-if="languageDetection.label" class="mt-2 flex flex-wrap items-center gap-2 font-sans text-xs">
          <span class="inline-flex items-center bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
            {{ languageDetection.source === 'manual' ? `Language set to ${languageDetection.label}` : `Auto-detected: ${languageDetection.label}` }}
          </span>
          <span v-if="languageDetection.lowConfidence && languageDetection.source === 'auto'" class="text-amber-700 dark:text-amber-300">Low confidence &mdash; please confirm.</span>
        </div>
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
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
  languageDetection,
  authorQuery,
  referenceQuery,
  authorSuggestions,
  referenceSuggestions,
  showAuthorSuggestions,
  showReferenceSuggestions,
  submitting,
  selectedAuthorIndex,
  selectedReferenceIndex,
  searchAuthors,
  searchReferences,
  onLanguageSelected,
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
  createPayload
} = useQuoteForm()

const { showErrorToast } = useErrorToast()

const handleFormKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (form.value.content.trim() && !submitting.value) submitQuote()
  }
}

const onAuthorInput = () => { void searchAuthors($fetch, { limit: 5, minLength: 1 }) }
const onReferenceInput = () => { void searchReferences($fetch, { limit: 5, minLength: 1 }) }
const closeDialog = () => { isOpen.value = false }

watch(() => props.editQuote, (newQuote) => {
  if (newQuote) initializeFormForEdit(newQuote)
  else resetForm()
}, { immediate: true })

const showContentEmptyError = () => {
  useToast().toast({ title: 'Content Required', description: 'Please enter the quote content before submitting.' })
}

const showNotLoggedInError = () => {
  useToast().toast({
    title: 'Not Logged In',
    description: 'You must be logged in to submit a quote.',
    actions: [
      { label: 'Log In', btn: 'primary', altText: 'Log in to your account', onClick: () => { navigateTo('/login'); closeDialog() } },
      { label: 'Create Account', btn: 'ghost', altText: 'Create a new account', onClick: () => { navigateTo('/signup'); closeDialog() } }
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
      await submitUpdateQuote(props.editQuote.id, payload)
      return
    }
    await submitCreateQuote(payload)
  } catch (error) {
    console.error('Error submitting quote:', error)
    showErrorToast(error, isEditMode.value ? 'Failed to update quote. Please try again.' : 'Failed to add quote. Please try again.')
  } finally {
    submitting.value = false
  }
}

const submitCreateQuote = async (payload: CreateQuoteData) => {
  await $fetch('/api/quotes', { method: 'POST', body: payload })
  emit('quote-added')
  closeDialog()
}

const submitUpdateQuote = async (editQuoteId: number, payload: CreateQuoteData) => {
  await $fetch(`/api/quotes/${editQuoteId}`, { method: 'PUT', body: payload })
  emit('quote-updated')
  closeDialog()
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showAuthorSuggestions.value = false
    showReferenceSuggestions.value = false
    selectedAuthorIndex.value = -1
    selectedReferenceIndex.value = -1
  }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
