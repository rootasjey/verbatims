<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.bulk_edit_title', { n: selectedCount }) as string"
    :submit-text="$t('components.dialogs.bulk_edit_update') as string"
    :submitting="submitting"
    :can-submit="canSubmit"
    @submit="submitEdit"
  >
    <div class="space-y-6">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t('components.dialogs.bulk_edit_help') }}
      </p>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.language') }}</label>
        <NSelect
          v-model="selectedLanguage"
          :items="languageItems"
          :placeholder="$t('components.dialogs.bulk_no_change') as string"
          :disabled="submitting"
          item-key="label"
          value-key="label"
        />
      </div>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.author_label') }}</label>
        <div class="relative">
          <NInput
            ref="authorInputRef"
            v-model="authorQuery"
            :placeholder="$t('components.dialogs.search_author') as string"
            :disabled="submitting"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
            @input="onAuthorInput"
            @focus="handleAuthorInputFocus"
            @blur="handleAuthorInputBlur"
            @keydown="handleAuthorKeydown"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.author_label') }}</NBadge>
            </template>
          </NInput>
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
              @click="onSelectAuthor(author)"
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
              @click="onCreateNewAuthor"
              @mouseenter="selectedAuthorIndex = authorSuggestions.length"
            >
              <div class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}</div>
            </div>
          </div>
        </div>
        <div v-if="form.selectedAuthor" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div>
            <span class="text-sm font-medium">{{ form.selectedAuthor.name }}</span>
            <span v-if="form.selectedAuthor.job" class="text-xs text-gray-500 ml-2">{{ form.selectedAuthor.job }}</span>
          </div>
          <NButton size="xs" btn="ghost" icon label="i-ph-x" @click="onClearAuthor" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.reference_label') }}</label>
        <div class="relative">
          <NInput
            ref="referenceInputRef"
            v-model="referenceQuery"
            :placeholder="$t('components.dialogs.search_reference') as string"
            :disabled="submitting"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
            @input="onReferenceInput"
            @focus="handleReferenceInputFocus"
            @blur="handleReferenceInputBlur"
            @keydown="handleReferenceKeydown"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.reference_label') }}</NBadge>
            </template>
          </NInput>
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
              @click="onSelectReference(reference)"
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
              @click="onCreateNewReference"
              @mouseenter="selectedReferenceIndex = referenceSuggestions.length"
            >
              <div class="text-sm font-medium text-blue-600 dark:text-blue-400">{{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}</div>
            </div>
          </div>
        </div>
        <div v-if="form.selectedReference" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div>
            <span class="text-sm font-medium">{{ form.selectedReference.name }}</span>
            <span v-if="form.selectedReference.primary_type" class="text-xs text-gray-500 ml-2 capitalize">{{ form.selectedReference.primary_type.replace('_', ' ') }}</span>
          </div>
          <NButton size="xs" btn="ghost" icon label="i-ph-x" @click="onClearReference" />
        </div>
      </div>

      <div v-if="summary.length > 0" class="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 text-sm space-y-1">
        <p class="font-medium text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.bulk_edit_changes') }}</p>
        <p v-for="item in summary" :key="item" class="text-gray-600 dark:text-gray-400">{{ item }}</p>
      </div>
    </div>

    <template #submit>
      <NButton btn="solid-indigo" class="px-6" :loading="submitting" :disabled="!canSubmit" @click="submitEdit">
        {{ $t('components.dialogs.bulk_edit_update') }}
      </NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuoteForm } from '~/composables/useQuoteForm'

interface Props {
  open: boolean
  selectedQuotes: (QuoteWithRelations | AdminQuote)[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const selectedCount = computed(() => props.selectedQuotes.length)
const selectedQuoteIds = computed(() => props.selectedQuotes.map(q => q.id))

const {
  form,
  languageOptions,
  authorQuery,
  referenceQuery,
  authorSuggestions,
  referenceSuggestions,
  showAuthorSuggestions,
  showReferenceSuggestions,
  selectedAuthorIndex,
  selectedReferenceIndex,
  submitting,
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
  createNewAuthor: _createNewAuthor,
  createNewReference: _createNewReference,
  clearAuthor,
  clearReference,
  resetForm
} = useQuoteForm()

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

const languageTouched = ref(false)
const authorTouched = ref(false)
const referenceTouched = ref(false)

const selectedLanguage = ref<{ label: string, value: string }>({ label: String($t('components.dialogs.bulk_no_change')), value: '' })
const languageItems = computed(() => [
  { label: String($t('components.dialogs.bulk_no_change')), value: '' },
  ...languageOptions
])

watch(selectedLanguage, (opt) => {
  if (opt && opt.value !== '') {
    languageTouched.value = true
  }
})

const onSelectAuthor = (author: Author) => {
  selectAuthor(author)
  authorTouched.value = true
}

const onClearAuthor = () => {
  clearAuthor()
  authorTouched.value = true
}

const onCreateNewAuthor = () => {
  _createNewAuthor()
  authorTouched.value = true
}

const onSelectReference = (reference: QuoteReference) => {
  selectReference(reference)
  referenceTouched.value = true
}

const onClearReference = () => {
  clearReference()
  referenceTouched.value = true
}

const onCreateNewReference = () => {
  _createNewReference()
  referenceTouched.value = true
}

const onAuthorInput = () => {
  void searchAuthors($fetch, { limit: 5, minLength: 1 })
}

const onReferenceInput = () => {
  void searchReferences($fetch, { limit: 5, minLength: 1 })
}

const summary = computed(() => {
  const items: string[] = []
  if (languageTouched.value && selectedLanguage.value?.value) {
    items.push(`Language → ${selectedLanguage.value.label}`)
  }
  if (authorTouched.value) {
    if (form.value.selectedAuthor) {
      items.push(`Author → ${form.value.selectedAuthor.name}`)
    } else {
      items.push('Author → (cleared)')
    }
  }
  if (referenceTouched.value) {
    if (form.value.selectedReference) {
      items.push(`Reference → ${form.value.selectedReference.name}`)
    } else {
      items.push('Reference → (cleared)')
    }
  }
  return items
})

const canSubmit = computed(() => {
  return !!((languageTouched.value && selectedLanguage.value?.value) || authorTouched.value || referenceTouched.value)
})

const submitt = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      quote_ids: selectedQuoteIds.value
    }

    if (languageTouched.value && selectedLanguage.value?.value) {
      payload.language = selectedLanguage.value.value
    }

    if (authorTouched.value) {
      const author = form.value.selectedAuthor
      if (author) {
        if (author.id === 0) {
          payload.new_author = { name: author.name }
        } else {
          payload.author_id = author.id
        }
      } else {
        payload.author_id = null
      }
    }

    if (referenceTouched.value) {
      const ref = form.value.selectedReference
      if (ref) {
        if (ref.id === 0) {
          payload.new_reference = { name: ref.name, primary_type: ref.primary_type || 'other' }
        } else {
          payload.reference_id = ref.id
        }
      } else {
        payload.reference_id = null
      }
    }

    await $fetch('/api/admin/quotes/bulk-edit', {
      method: 'POST',
      body: payload
    } as any)

    useToast().toast({
      title: String($t('components.dialogs.toast_updated')),
      description: `${selectedCount.value} ${selectedCount.value > 1 ? $t('common.quote_plural') : $t('common.quote_singular')} updated successfully.`,
      toast: 'soft-success'
    })

    emit('updated')
    isOpen.value = false
  } catch (error) {
    console.error('Failed to bulk edit quotes:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
  } finally {
    submitting.value = false
  }
}

const submitEdit = () => {
  void submitt()
}

const closeDialog = () => {
  isOpen.value = false
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

watch(isOpen, (open) => {
  if (open) {
    resetForm()
    languageTouched.value = false
    authorTouched.value = false
    referenceTouched.value = false
    selectedLanguage.value = { label: String($t('components.dialogs.bulk_no_change')), value: '' }
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
