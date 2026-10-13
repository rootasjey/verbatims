<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    title-class="font-sans text-lg font-600 tracking-normal"
    center-title
    :submit-text="submitButtonText"
    :submitting="submitting"
    :can-submit="!!form.content.trim()"
    :hide-footer="true"
    max-width="md"
    scrollable
    @submit="submitQuote"
    @close="closeDialog"
  >
    <template v-if="canUseForm" #header-progress>
      <div class="grid grid-cols-2 gap-3" :aria-label="String($t('components.dialogs.quote_form_steps'))">
        <button type="button" :aria-current="quoteStep === 1 ? 'step' : undefined" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors', quoteStep === 1 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToQuoteStep">
          <span class="mr-2 text-xs tabular-nums opacity-60">01</span>{{ $t('components.dialogs.quote_step') }}
        </button>
        <button type="button" :aria-current="quoteStep === 2 ? 'step' : undefined" :disabled="form.content.trim().length < 2" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', quoteStep === 2 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToAttributionStep">
          <span class="mr-2 text-xs tabular-nums opacity-60">02</span>{{ $t('components.dialogs.attribution_step') }}
        </button>
      </div>
    </template>

    <section v-if="!canUseForm" class="mx-auto max-w-sm py-2 text-center md:py-3">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
        <NIcon name="i-ph-quotes" class="h-6 w-6" />
      </div>
      <p class="font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('components.dialogs.add_quote_guest_message') }}
      </p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <NButton btn="solid-black" class="rounded-full px-6" @click="goToAuth('/login')">
          {{ $t('auth.sign_in_button') }}
        </NButton>
        <NButton btn="outline-gray" class="rounded-full px-6" @click="goToAuth('/signup')">
          {{ $t('auth.sign_up_button') }}
        </NButton>
      </div>
    </section>

    <form v-else @submit.prevent="quoteStep === 1 ? goToAttributionStep() : submitQuote()" @keydown.capture="handleCreateEscape" @keydown="handleQuoteFormKeydown" class="space-y-5 px-2">
      <div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative overflow-hidden" @transitionend.self="finishStepTransition">
      <Transition :name="transitionName">
      <section v-if="quoteStep === 1" key="quote" data-quote-step="1" class="space-y-4 px-0 py-2">
        <div class="relative">
          <textarea
            ref="quoteTextarea"
            autofocus
          v-model="form.content"
          :placeholder="quotePlaceholder"
          rows="5"
          :disabled="submitting"
          required
          @input="draftSaved = false; clearDraftSavedPulse()"
          class="min-h-40 w-full resize-y rounded-1.5 bg-gray-100/80 px-4 pb-10 pt-4 font-serif text-xl leading-snug text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-600 dark:focus-visible:ring-gray-500"
        />
          <span class="pointer-events-none absolute bottom-3 right-4 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite" :aria-label="String($t('components.dialogs.character_count', { count: form.content.length }))">{{ form.content.length }}</span>
        </div>
      </section>

      <section v-else key="attribution" data-quote-step="2" class="space-y-4">
        <div>
          <label class="sr-only" for="add-quote-author">{{ $t('components.dialogs.author_label') }}</label>
          <div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
            <span v-if="form.selectedAuthor" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
              <NAvatar :src="form.selectedAuthor.image_url" :alt="form.selectedAuthor.name" size="xs" class="shrink-0" />
              <span class="max-w-48 truncate">{{ form.selectedAuthor.name }}</span>
              <button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearAuthorFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
            </span>
            <input
              id="add-quote-author"
              ref="authorInputRef"
              v-model="authorQuery"
              type="text"
              :placeholder="(form.selectedAuthor ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_author')) as string"
              :aria-describedby="!hasAttribution ? 'quote-attribution-required' : undefined"
              :disabled="submitting"
              class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
              @input="onAuthorInput"
              @focus="handleAuthorInputFocus"
              @blur="handleAuthorInputBlur"
              @keydown="onAuthorKeydown"
            />
          </div>
          <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <div v-if="showAuthorSuggestions && (authorSuggestions.length || authorQuery)" ref="authorSuggestionsRef" :style="{ height: authorSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleAuthorSuggestionsBlur" @keydown="handleAuthorKeydown">
            <button v-for="(author, index) in authorSuggestions" :key="author.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedAuthorIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectAuthor(author)">
              <NAvatar :src="author.image_url" :alt="author.name" size="xs" class="shrink-0" />
              <span class="min-w-0">
                <span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ author.name }}</span>
                <span v-if="author.job" class="block truncate font-sans text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</span>
              </span>
            </button>
            <button v-if="authorQuery && !authorSuggestions.some(author => author.name.toLowerCase() === authorQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedAuthorIndex === authorSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="createNewAuthor">
              {{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}
            </button>
          </div>
          </Transition>
        </div>

        <div>
          <label class="sr-only" for="add-quote-reference">{{ $t('components.dialogs.reference_label') }}</label>
          <div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
            <span v-if="form.selectedReference" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
              <NAvatar :src="form.selectedReference.image_url" :alt="form.selectedReference.name" rounded="2" size="xs" class="shrink-0" />
              <span class="max-w-48 truncate">{{ form.selectedReference.name }}</span>
              <button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearReferenceFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
            </span>
            <input
              id="add-quote-reference"
              ref="referenceInputRef"
              v-model="referenceQuery"
              type="text"
              :placeholder="(form.selectedReference ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_reference')) as string"
              :aria-describedby="!hasAttribution ? 'quote-attribution-required' : undefined"
              :disabled="submitting"
              class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
              @input="onReferenceInput"
              @focus="handleReferenceInputFocus"
              @blur="handleReferenceInputBlur"
              @keydown="onReferenceKeydown"
            />
          </div>
          <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <div v-if="showReferenceSuggestions && (referenceSuggestions.length || referenceQuery)" ref="referenceSuggestionsRef" :style="{ height: referenceSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleReferenceSuggestionsBlur" @keydown="handleReferenceKeydown">
            <button v-for="(reference, index) in referenceSuggestions" :key="reference.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedReferenceIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectReference(reference)">
              <NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="xs" class="shrink-0" />
              <span class="min-w-0">
                <span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ reference.name }}</span>
                <span v-if="reference.primary_type" class="block truncate font-sans text-xs capitalize text-gray-500 dark:text-gray-400">{{ reference.primary_type.replace('_', ' ') }}</span>
              </span>
            </button>
            <button v-if="referenceQuery && !referenceSuggestions.some(reference => reference.name.toLowerCase() === referenceQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedReferenceIndex === referenceSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="createNewReference">
              {{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}
            </button>
          </div>
          </Transition>
        </div>
        <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <p v-if="!hasAttribution" id="quote-attribution-required" :class="['quote-suggestions-panel quote-attribution-required-feedback w-fit max-w-full font-sans text-xs text-gray-500 dark:text-gray-400', { 'quote-attribution-required-feedback--pulse': attributionRequiredPulseActive }]">
            <span class="quote-attribution-required-feedback-label">{{ $t('components.dialogs.attribution_required') }}</span>
          </p>
        </Transition>

        <div v-if="canEditProvenance" class="space-y-4 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
          <div>
            <h3 class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">Provenance</h3>
            <p class="mt-1 font-sans text-xs text-gray-500 dark:text-gray-400">Record where this quote was verified.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block font-sans text-sm text-gray-700 dark:text-gray-300">Source type</label>
              <select
                v-model="form.sourceType"
                :disabled="submitting"
                class="w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 font-sans text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100"
              >
                <option value="" class="dark:bg-gray-800">No source type</option>
                <option value="wikiquote-en" class="dark:bg-gray-800">Wikiquote (English)</option>
                <option value="wikiquote-fr" class="dark:bg-gray-800">Wikiquote (French)</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block font-sans text-sm text-gray-700 dark:text-gray-300">Source URL</label>
              <input
                v-model="form.sourceUrl"
                type="url"
                placeholder="https://..."
                :disabled="submitting"
                class="w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 font-sans text-sm text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </section>
      </Transition>
      </div>

      <p v-if="draftSaved" role="status" aria-live="polite" :class="['quote-draft-saved-feedback flex items-center gap-2 font-sans text-sm text-gray-600 dark:text-gray-300', { 'quote-draft-saved-feedback--pulse': draftSavedPulseActive }]">
        <NIcon name="i-tabler-circle-check" class="h-4 w-4 shrink-0" />
        {{ $t('components.dialogs.draft_saved_continue') }}
      </p>
      <div class="flex items-center justify-between gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
        <NButton btn="ghost-gray" type="button" :disabled="submitting" @click="quoteStep === 2 ? goToQuoteStep() : closeDialog()">
          {{ quoteStep === 2 ? $t('common.back') : $t('common.cancel') }}
        </NButton>
        <NButton v-if="quoteStep === 1" btn="solid-black" type="button" :disabled="form.content.trim().length < 2 || submitting" @click="goToAttributionStep">
          {{ $t('common.next') }}<NIcon name="i-ph-arrow-right" class="ml-2 h-4 w-4" />
        </NButton>
        <NButton v-else btn="solid-black" type="submit" :disabled="!hasAttribution || submitting" :loading="submitting" class="min-h-10 rounded-1 px-4">
          {{ isEditMode ? $t('components.dialogs.update') : $t('components.dialogs.save_as_draft') }}
        </NButton>
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuoteForm } from '~/composables/useQuoteForm'
import { useQuoteStepTransition } from '~/composables/useQuoteStepTransition'

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

const { $t } = useI18n()
const { user } = useUserSession()

const quoteTextarea = ref<HTMLTextAreaElement | null>(null)
const quoteStep = ref<1 | 2>(1)
const lastSavedQuote = ref('')
const draftSaved = ref(false)
const draftSavedPulseActive = ref(false)
let draftSavedPulseTimer: ReturnType<typeof setTimeout> | undefined
const attributionRequiredPulseActive = ref(false)
let attributionRequiredPulseTimer: ReturnType<typeof setTimeout> | undefined
const quotePlaceholder = computed(() => {
  if (!lastSavedQuote.value) return String($t('components.dialogs.quote_placeholder'))
  const excerpt = lastSavedQuote.value.replace(/\s+/g, ' ').trim()
  return excerpt.length > 90 ? `${excerpt.slice(0, 87).trimEnd()}…` : excerpt
})
const { stepViewportRef, stepViewportHeight, transitionName, changeStep, finishStepTransition } = useQuoteStepTransition(quoteStep)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editQuote)
const canUseForm = computed(() => Boolean(user.value) || isEditMode.value)
const canEditProvenance = computed(() => isEditMode.value && ['admin', 'moderator'].includes(user.value?.role || ''))
const dialogTitle = computed(() => isEditMode.value ? String($t('components.dialogs.edit_quote')) : String($t('components.dialogs.add_quote')))
const submitButtonText = computed(() => isEditMode.value ? String($t('components.dialogs.update')) : String($t('common.save')))
const {
  form,
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
  createPayload
} = useQuoteForm()

const authorSuggestionsHeight = ref('0px')
const referenceSuggestionsHeight = ref('0px')

watch([showAuthorSuggestions, authorSuggestions, authorQuery], async ([visible]) => {
  if (!visible) return
  await nextTick()
  const panel = authorSuggestionsRef.value
  if (panel) authorSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

watch([showReferenceSuggestions, referenceSuggestions, referenceQuery], async ([visible]) => {
  if (!visible) return
  await nextTick()
  const panel = referenceSuggestionsRef.value
  if (panel) referenceSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

const collapseSuggestionPanel = (element: Element, done: () => void) => {
  const panel = element as HTMLElement
  panel.style.height = `${panel.getBoundingClientRect().height}px`
  panel.style.marginTop = getComputedStyle(panel).marginTop

  let completed = false
  const finish = () => {
    if (completed) return
    completed = true
    clearTimeout(fallback)
    panel.removeEventListener('transitionend', onTransitionEnd)
    done()
  }
  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === panel && event.propertyName === 'height') finish()
  }
  const fallback = setTimeout(finish, 320)
  panel.addEventListener('transitionend', onTransitionEnd)

  requestAnimationFrame(() => {
    panel.style.height = '0px'
    panel.style.marginTop = '0px'
  })
}

const hasAttribution = computed(() => Boolean(form.value.selectedAuthor || form.value.selectedReference))
const { showErrorToast } = useErrorToast()

const handleQuoteFormKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing) return

  if (quoteStep.value === 1 && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    void goToAttributionStep()
    return
  }

  if (quoteStep.value === 2 && event.key === 'Enter' && !submitting.value) {
    event.preventDefault()
    void submitQuote()
  }
}

const handleCreateEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (quoteStep.value === 2) void goToQuoteStep()
  else closeDialog()
}

const onAuthorKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !authorQuery.value && form.value.selectedAuthor) {
    event.preventDefault()
    clearAuthor()
    return
  }
  handleAuthorKeydown(event)
}

const onReferenceKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !referenceQuery.value && form.value.selectedReference) {
    event.preventDefault()
    clearReference()
    return
  }
  handleReferenceKeydown(event)
}

const clearAuthorFromField = () => {
  clearAuthor()
  nextTick(() => authorInputRef.value?.focus?.())
}

const clearReferenceFromField = () => {
  clearReference()
  nextTick(() => referenceInputRef.value?.focus?.())
}

const clearDraftSavedPulse = () => {
  draftSavedPulseActive.value = false
  if (draftSavedPulseTimer) clearTimeout(draftSavedPulseTimer)
  draftSavedPulseTimer = undefined
}

const triggerDraftSavedPulse = async () => {
  clearDraftSavedPulse()
  await nextTick()
  draftSavedPulseActive.value = true
  draftSavedPulseTimer = setTimeout(clearDraftSavedPulse, 1400)
}

const clearAttributionRequiredPulse = () => {
  attributionRequiredPulseActive.value = false
  if (attributionRequiredPulseTimer) clearTimeout(attributionRequiredPulseTimer)
  attributionRequiredPulseTimer = undefined
}

const triggerAttributionRequiredPulse = async () => {
  clearAttributionRequiredPulse()
  await nextTick()
  attributionRequiredPulseActive.value = true
  attributionRequiredPulseTimer = setTimeout(clearAttributionRequiredPulse, 720)
}

const onAuthorInput = () => {
  draftSaved.value = false
  clearDraftSavedPulse()
  showAuthorSuggestions.value = Boolean(authorQuery.value.trim())
  if (authorQuery.value.trim()) void searchAuthors($fetch, { limit: 5, minLength: 1 })
  else authorSuggestions.value = []
}

const onReferenceInput = () => {
  draftSaved.value = false
  clearDraftSavedPulse()
  showReferenceSuggestions.value = Boolean(referenceQuery.value.trim())
  if (referenceQuery.value.trim()) void searchReferences($fetch, { limit: 5, minLength: 1 })
  else referenceSuggestions.value = []
}
const closeDialog = () => { isOpen.value = false }

watch(isOpen, (open) => {
  if (open && canUseForm.value) {
    quoteStep.value = 1
    nextTick(() => quoteTextarea.value?.focus())
  }
  else clearDraftSavedPulse()
})

watch(() => props.editQuote, (newQuote) => {
  if (newQuote) {
    initializeFormForEdit(newQuote)
    // Selected entities render as chips in the shared two-step form.
    authorQuery.value = ''
    referenceQuery.value = ''
  }
  else resetForm()
}, { immediate: true })

const showContentEmptyError = () => {
  useToast().toast({ title: String($t('components.dialogs.toast_error')), description: String($t('components.dialogs.quote_placeholder')) })
}

const goToAttributionStep = async () => {
  if (form.value.content.trim().length < 2) return
  await changeStep(2)
  nextTick(() => (authorInputRef.value as HTMLInputElement | null)?.focus?.())
}

const goToQuoteStep = async () => {
  await changeStep(1)
  nextTick(() => quoteTextarea.value?.focus())
}

const goToAuth = async (path: '/login' | '/signup') => {
  closeDialog()
  await navigateTo(path)
}

const submitQuote = async () => {
  if (submitting.value) return
  if (form.value.content.trim().length < 2) { showContentEmptyError(); return }
  if (!user.value) return
  if (!hasAttribution.value) {
    if (quoteStep.value === 2) {
      void triggerAttributionRequiredPulse()
      await nextTick()
      authorInputRef.value?.focus()
    } else {
      void goToAttributionStep()
    }
    return
  }
  submitting.value = true
  let savedDraft = false

  try {
    const payload = createPayload()
    if (isEditMode.value && props.editQuote) {
      const { language: _language, ...baseUpdatePayload } = payload
      const updatePayload = canEditProvenance.value
        ? {
            ...baseUpdatePayload,
            source_type: form.value.sourceType || null,
            source_url: form.value.sourceUrl || null,
          }
        : baseUpdatePayload
      await submitUpdateQuote(props.editQuote.id, updatePayload)
      return
    }
    await submitCreateQuote(payload)
    savedDraft = true
  } catch (error) {
    console.error('Error submitting quote:', error)
    showErrorToast(error, isEditMode.value ? String($t('components.dialogs.toast_error')) : String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
    if (savedDraft) nextTick(() => quoteTextarea.value?.focus())
  }
}

const submitCreateQuote = async (payload: CreateQuoteData) => {
  const savedText = form.value.content.trim()
  await $fetch('/api/quotes', { method: 'POST', body: payload })
  lastSavedQuote.value = savedText
  form.value.content = ''
  draftSaved.value = true
  void triggerDraftSavedPulse()
  emit('quote-added')
  await changeStep(1)
}

const submitUpdateQuote = async (
  editQuoteId: number,
  payload: Omit<CreateQuoteData, 'language'> & { source_type?: string | null; source_url?: string | null },
) => {
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
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  clearDraftSavedPulse()
  clearAttributionRequiredPulse()
})
</script>
