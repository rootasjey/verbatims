<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    title-class="font-sans text-lg font-600 tracking-normal"
    center-title
    compact-header
    :submit-text="submitButtonText"
    :submitting="submitting"
    :can-submit="!!form.content.trim()"
    :hide-footer="!canUseForm"
    max-width="md"
    scrollable
    scroll-fade
    @submit="submitQuote"
    @close="closeDialog"
  >
    <template v-if="canUseForm" #header-progress>
      <div :class="['grid gap-3', canEditSources || !isEditMode ? 'grid-cols-3' : 'grid-cols-2']" :aria-label="String($t('components.dialogs.quote_form_steps'))">
        <button type="button" class="overflowing-tab-trigger min-w-0 overflow-hidden whitespace-nowrap" :aria-label="String($t('components.dialogs.quote_step'))" :aria-current="quoteStep === 1 ? 'step' : undefined" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors', quoteStep === 1 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToQuoteStep">
          <OverflowingTabLabel number="01" :label="String($t('components.dialogs.quote_step'))" />
        </button>
        <button type="button" class="overflowing-tab-trigger min-w-0 overflow-hidden whitespace-nowrap" :aria-label="String($t('components.dialogs.attribution_step'))" :aria-current="quoteStep === 2 ? 'step' : undefined" :disabled="form.content.trim().length < 2" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', quoteStep === 2 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToAttributionStep">
          <OverflowingTabLabel number="02" :label="String($t('components.dialogs.attribution_step'))" />
        </button>
        <button v-if="!isEditMode || canEditSources" type="button" class="overflowing-tab-trigger min-w-0 overflow-hidden whitespace-nowrap" :aria-label="String($t('components.dialogs.source_step'))" :aria-current="quoteStep === 3 ? 'step' : undefined" :disabled="form.content.trim().length < 2 || !hasAttribution || submitting || (isEditMode && !sourcesLoaded)" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', quoteStep === 3 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToSourceStep">
          <OverflowingTabLabel number="03" :label="String($t('components.dialogs.source_step'))" />
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

    <form v-else id="quote-editor-form" @submit.prevent="quoteStep === 1 ? goToAttributionStep() : submitQuote()" @keydown.capture="handleCreateEscape" @keydown="handleQuoteFormKeydown" class="space-y-5 px-2">
      <div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative overflow-hidden" @transitionend.self="finishStepTransition">
      <Transition :name="transitionName">
      <section v-if="quoteStep === 1" key="quote" data-quote-step="1" class="space-y-4 px-0 py-2">
        <QuoteContentFields
          ref="quoteTextarea"
          v-model="form.content"
          :placeholder="quotePlaceholder"
          :disabled="submitting"
          @input="draftSaved = false; clearDraftSavedPulse()"
        />
      </section>

      <section v-else-if="quoteStep === 2" key="attribution" data-quote-step="2" class="space-y-4">
        <div v-if="isEditMode && canEditSources && sourceLoadError" class="space-y-2 text-sm text-red-700 dark:text-red-300" role="alert">
          <p>{{ $t('components.dialogs.quote_save_failed') }}</p>
          <NButton btn="outline-gray" type="button" @click="loadProvenance">{{ $t('components.dialogs.source_load_retry') }}</NButton>
        </div>
        <QuoteAttributionFields
          :selected-author="form.selectedAuthor"
          :selected-reference="form.selectedReference"
          v-model:author-query="authorQuery"
          v-model:reference-query="referenceQuery"
          :author-suggestions="authorSuggestions"
          :reference-suggestions="referenceSuggestions"
          :show-author-suggestions="showAuthorSuggestions"
          :show-reference-suggestions="showReferenceSuggestions"
          :selected-author-index="selectedAuthorIndex"
          :selected-reference-index="selectedReferenceIndex"
          :disabled="submitting"
          :has-attribution="hasAttribution"
          :input-refs="attributionInputRefs"
          :suggestion-refs="attributionSuggestionRefs"
          :handlers="attributionFieldHandlers"
        >
          <template #feedback>
            <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
              <p v-if="!hasAttribution" id="quote-attribution-required" :class="['quote-step-required-feedback quote-attribution-required-feedback w-fit max-w-full font-sans text-xs text-gray-500 dark:text-gray-400', { 'quote-attribution-required-feedback--pulse': attributionRequiredPulseActive }]">
                <span class="quote-attribution-required-feedback-label">{{ $t('components.dialogs.attribution_required') }}</span>
              </p>
            </Transition>
          </template>
        </QuoteAttributionFields>
      </section>

      <section v-else-if="quoteStep === 3" key="sources" data-quote-step="3" class="py-2">
        <div v-if="isEditMode && !sourcesLoaded" class="space-y-3 text-sm text-gray-500 dark:text-gray-400" role="status">
          <p>{{ sourceLoadError ? $t('components.dialogs.quote_save_failed') : $t('common.loading') }}</p>
          <NButton v-if="sourceLoadError" btn="outline-gray" type="button" @click="loadProvenance">{{ $t('components.dialogs.source_load_retry') }}</NButton>
        </div>
        <QuoteSourcesEditor v-else v-model="sources" :disabled="submitting" />
      </section>
      </Transition>
      </div>

      <div v-if="submissionError" role="alert" aria-live="assertive" aria-atomic="true" class="flex items-start gap-2 rounded-1.5 border border-red-200 bg-red-50 px-3 py-2.5 font-sans text-sm leading-relaxed text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100">
        <NIcon name="i-ph-warning-circle" class="mt-0.5 h-4 w-4 shrink-0" />
        <div class="min-w-0 break-words">
          <p>{{ submissionError }}</p>
          <p v-if="submissionErrorId" class="mt-1 text-xs">{{ $t('components.dialogs.quote_error_reference', { id: submissionErrorId }) }}</p>
          <button v-if="submissionErrorId" type="button" class="mt-1 rounded-sm font-600 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-200" @click="reportSubmissionError">
            {{ $t('components.dialogs.quote_error_report_action') }}
          </button>
        </div>
      </div>

      <p v-if="draftSaved" role="status" aria-live="polite" :class="['quote-draft-saved-feedback flex items-center gap-2 font-sans text-sm text-gray-600 dark:text-gray-300', { 'quote-draft-saved-feedback--pulse': draftSavedPulseActive }]">
        <NIcon name="i-tabler-circle-check" class="h-4 w-4 shrink-0" />
        <span>
          <NuxtLink :to="draftEditUrl" class="underline decoration-gray-400 underline-offset-2 transition-colors hover:text-gray-900 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:decoration-neutral-500 dark:hover:text-gray-100" @click="closeDialog">{{ $t('components.dialogs.draft_saved') }}</NuxtLink>
          {{ $t('components.dialogs.attribution_ready_for_next_quote') }}
        </span>
      </p>
    </form>

    <template #footer>
      <div class="w-full flex items-center justify-between gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
        <NButton btn="ghost-gray" type="button" :disabled="submitting" @click="quoteStep > 1 ? goToPreviousStep() : closeDialog()">
          {{ quoteStep > 1 ? $t('common.back') : $t('common.cancel') }}
        </NButton>
        <NButton v-if="quoteStep === 1" btn="solid-black" type="button" :disabled="form.content.trim().length < 2 || submitting" @click="goToAttributionStep">
          {{ $t('common.next') }}<NIcon name="i-ph-arrow-right" class="ml-2 h-4 w-4" />
        </NButton>
        <NButton v-else btn="solid-black" type="submit" form="quote-editor-form" :disabled="!hasAttribution || submitting || (isEditMode && canEditSources && !sourcesLoaded)" :loading="submitting" class="min-h-10 rounded-1 px-4">
          {{ isEditMode ? $t('components.dialogs.update') : $t('components.dialogs.save_as_draft') }}
        </NButton>
      </div>
    </template>
  </AppDialog>

  <ReportDialog
    v-model="showErrorReport"
    category="bug"
    :initial-message="errorReportMessage"
  />
</template>

<script setup lang="ts">
import { buildQuoteSourceEditPayload, isQuoteSourceLoadCurrent } from '~/utils/quote-source-edit'
import OverflowingTabLabel from '~/components/OverflowingTabLabel.vue'
import QuoteContentFields from '~/components/QuoteContentFields.vue'
import QuoteAttributionFields from '~/components/QuoteAttributionFields.vue'
import { useDashboardQuoteEvents } from '~/composables/useDashboardQuoteEvents'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuoteForm } from '~/composables/useQuoteForm'
import { useQuoteStepTransition } from '~/composables/useQuoteStepTransition'
import { normalizeTimecode } from '~~/shared/utils/timecode'
import { handleQuoteFormKeydown as handleSuggestionFormKeydown } from '~/utils/quote-suggestion-keyboard'

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
const { publishMutation } = useDashboardQuoteEvents()

const quoteTextarea = ref<{ focus: () => void } | null>(null)
const quoteStep = ref<1 | 2 | 3>(1)
const lastSavedQuote = ref('')
const draftSaved = ref(false)
const savedDraftId = ref<number | null>(null)
const draftEditUrl = computed(() => ({
  path: '/dashboard/my-quotes/drafts',
  query: { edit: savedDraftId.value ? String(savedDraftId.value) : undefined },
}))
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
const submissionError = ref('')
const submissionErrorId = ref('')
const showErrorReport = ref(false)
const errorReportMessage = ref('')
const route = useRoute()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editQuote)
const canUseForm = computed(() => Boolean(user.value) || isEditMode.value)
const canEditSources = computed(() => isEditMode.value && ['draft', 'approved'].includes(props.editQuote?.status || '') && ['admin', 'moderator'].includes(user.value?.role || ''))
type EditableQuoteSource = CreateQuoteSourceData & {
  id?: number
  attribution_id?: number | null
  occurrence_id?: number | null
  source_type?: string
  verification_status?: QuoteProvenanceStatus
  is_primary?: boolean
}
const sourcesLoaded = ref(false)
const sourceLoadError = ref(false)
const sourceLoadToken = ref(0)
const sourceSnapshotIds = ref<number[]>([])
const sourceSnapshot = ref<EditableQuoteSource[]>([])
const sourceAttributionIds = ref<number[]>([])
const primarySourceAttributionId = ref<number | null>(null)
const loadProvenance = async () => {
  if (!props.editQuote?.id || !canEditSources.value) return
  const quoteId = props.editQuote.id
  const token = ++sourceLoadToken.value
  sourcesLoaded.value = false
  sourceLoadError.value = false
  sources.value = []
  sourceSnapshotIds.value = []
  sourceSnapshot.value = []
  sourceAttributionIds.value = []
  primarySourceAttributionId.value = null
  try {
    const [attributionsResponse, sourcesResponse] = await Promise.all([
      $fetch<ApiResponse<QuoteAttribution[]>, '/api/admin/quotes/:id/attributions'>(`/api/admin/quotes/${quoteId}/attributions` as '/api/admin/quotes/:id/attributions'),
      $fetch<ApiResponse<QuoteSource[]>, '/api/admin/quotes/:id/sources'>(`/api/admin/quotes/${quoteId}/sources` as '/api/admin/quotes/:id/sources'),
    ])
    const attributions = attributionsResponse.data || []
    const sourceData = sourcesResponse.data || []
    if (!isQuoteSourceLoadCurrent(token, sourceLoadToken.value, quoteId, props.editQuote?.id, isOpen.value)) return
    const primaryAttribution = attributions.find(attribution => attribution.is_primary) ?? attributions[0]
    sourceSnapshotIds.value = sourceData.map(source => source.id)
    sourceAttributionIds.value = attributions.map(attribution => attribution.id)
    primarySourceAttributionId.value = primaryAttribution?.id ?? null
    sources.value = sourceData.map(source => ({
      id: source.id,
      attribution_id: source.attribution_id ?? null,
      occurrence_id: source.occurrence_id ?? null,
      source_type: source.source_type,
      source_medium: source.source_medium ?? null,
      source_url: source.source_url ?? null,
      label: source.label ?? null,
      locator_type: source.locator_type ?? null,
      locator_value: source.locator_value ?? null,
      translator_name: source.translator_name ?? null,
      verification_status: source.verification_status,
      verified_by: source.verified_by ?? null,
      verified_at: source.verified_at ?? null,
      notes: source.notes ?? null,
      is_primary: source.is_primary,
    }))
    sourceSnapshot.value = sources.value.map(source => ({ ...source }))
    sourcesLoaded.value = true
  } catch (error) {
    if (isQuoteSourceLoadCurrent(token, sourceLoadToken.value, quoteId, props.editQuote?.id, isOpen.value)) sourceLoadError.value = true
    console.error('Failed to load quote provenance:', error)
  }
}
const dialogTitle = computed(() => isEditMode.value ? String($t('components.dialogs.edit_quote')) : String($t('components.dialogs.add_quote')))
const submitButtonText = computed(() => isEditMode.value ? String($t('components.dialogs.update')) : String($t('common.save')))
const {
  form,
  sources,
  authorQuery,
  referenceQuery,
  authorSuggestions,
  referenceSuggestions,
  showAuthorSuggestions,
  showReferenceSuggestions,
  submitting,
  rotateSubmissionKey,
  getSubmissionKey,
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
const handleQuoteFormKeydown = (event: KeyboardEvent) => {
  handleSuggestionFormKeydown(event, {
    step: quoteStep.value,
    submitting: submitting.value,
    advance: () => { void goToAttributionStep() },
    submit: () => { void submitQuote() },
  })
}

const handleCreateEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (quoteStep.value === 3) void goToAttributionStep()
  else if (quoteStep.value === 2) void goToQuoteStep()
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

const attributionInputRefs = { author: authorInputRef, reference: referenceInputRef }
const attributionSuggestionRefs = { author: authorSuggestionsRef, reference: referenceSuggestionsRef }
const attributionFieldHandlers = {
  authorInput: onAuthorInput,
  authorFocus: handleAuthorInputFocus,
  authorBlur: handleAuthorInputBlur,
  authorKeydown: onAuthorKeydown,
  authorSuggestionsBlur: handleAuthorSuggestionsBlur,
  authorPanelKeydown: handleAuthorKeydown,
  selectAuthor,
  createAuthor: createNewAuthor,
  clearAuthor: clearAuthorFromField,
  referenceInput: onReferenceInput,
  referenceFocus: handleReferenceInputFocus,
  referenceBlur: handleReferenceInputBlur,
  referenceKeydown: onReferenceKeydown,
  referenceSuggestionsBlur: handleReferenceSuggestionsBlur,
  referencePanelKeydown: handleReferenceKeydown,
  selectReference,
  createReference: createNewReference,
  clearReference: clearReferenceFromField,
}

const closeDialog = () => { isOpen.value = false }

watch(isOpen, (open) => {
  sourceLoadToken.value++
  if (open && canUseForm.value) {
    quoteStep.value = 1
    nextTick(() => quoteTextarea.value?.focus())
    if (canEditSources.value) void loadProvenance()
  }
  else {
    clearDraftSavedPulse()
    submissionError.value = ''
    submissionErrorId.value = ''
  }
}, { flush: 'sync' })

watch([() => form.value, sources], () => {
  submissionError.value = ''
  submissionErrorId.value = ''
}, { deep: true })

watch(() => props.editQuote, (newQuote) => {
  sourceLoadToken.value++
  if (newQuote) {
    initializeFormForEdit(newQuote)
    // Selected entities render as chips in the shared quote form.
    authorQuery.value = ''
    referenceQuery.value = ''
    if (isOpen.value && canEditSources.value) void loadProvenance()
  }
  else resetForm()
}, { immediate: true, flush: 'sync' })

const showContentEmptyError = () => {
  useToast().toast({ title: String($t('components.dialogs.toast_error')), description: String($t('components.dialogs.quote_placeholder')) })
}

const reportSubmissionError = async () => {
  if (!submissionErrorId.value) return
  const stepLabel = String($t(quoteStep.value === 1
    ? 'components.dialogs.quote_step'
    : quoteStep.value === 2
      ? 'components.dialogs.attribution_step'
      : 'components.dialogs.source_step'))
  errorReportMessage.value = String($t('components.dialogs.quote_error_report_template', {
    id: submissionErrorId.value,
    page: route.path,
    step: stepLabel,
  }))
  closeDialog()
  await nextTick()
  showErrorReport.value = true
}

const goToAttributionStep = async () => {
  if (form.value.content.trim().length < 2) return
  await changeStep(2)
  nextTick(() => (authorInputRef.value as HTMLInputElement | null)?.focus?.())
}

const goToSourceStep = async () => {
  if ((isEditMode.value && !canEditSources.value) || form.value.content.trim().length < 2 || !hasAttribution.value) return
  if (isEditMode.value && !sourcesLoaded.value) return
  await changeStep(3)
}

const goToPreviousStep = async () => {
  if (quoteStep.value === 3) await goToAttributionStep()
  else await goToQuoteStep()
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
  submissionError.value = ''
  submissionErrorId.value = ''
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
  if (isEditMode.value && canEditSources.value && !sourcesLoaded.value) {
    sourceLoadError.value = true
    submissionError.value = String($t('components.dialogs.quote_save_failed'))
    return
  }
  submitting.value = true
  let savedDraft = false

  try {
    const payload = createPayload()
    if (isEditMode.value && props.editQuote) {
      const { language: _language, sources: _sources, ...updatePayload } = payload
      if (canEditSources.value) {
        validateEditedSources()
        if (primarySourceAttributionId.value == null) throw new Error('A quote requires a primary attribution to record sources')
        const sourcePayload = buildQuoteSourceEditPayload(sources.value as EditableQuoteSource[], sourceSnapshotIds.value, sourceSnapshot.value, new Set(sourceAttributionIds.value), primarySourceAttributionId.value)
        await submitUpdateQuote(props.editQuote.id, { ...updatePayload, ...sourcePayload } as any)
        publishMutation({ type: 'updated', quoteIds: [props.editQuote.id] })
        emit('quote-updated')
        closeDialog()
      }
      else await submitUpdateQuote(props.editQuote.id, updatePayload)
      if (!canEditSources.value) {
        publishMutation({ type: 'updated', quoteIds: [props.editQuote.id] })
        emit('quote-updated')
        closeDialog()
      }
      return
    }
    await submitCreateQuote(payload)
    savedDraft = true
  } catch (error) {
    console.error('Error submitting quote:', error)
    const err = error as Record<string, any> | undefined
    const message = err?.data?.statusMessage || err?.statusMessage || err?.data?.message || err?.message
    const errorId = err?.data?.data?.errorId ?? err?.data?.errorId
    submissionErrorId.value = typeof errorId === 'string' ? errorId : ''
    submissionError.value = !message || message === 'Failed to create quote'
      ? String($t('components.dialogs.quote_save_failed'))
      : String(message)
  } finally {
    submitting.value = false
    if (savedDraft) nextTick(() => quoteTextarea.value?.focus())
  }
}

const submitCreateQuote = async (payload: CreateQuoteData) => {
  const savedText = form.value.content.trim()
  const idempotencyKey = getSubmissionKey(payload)
  const response = await $fetch<{ success: boolean; data: { id: number } }, '/api/quotes'>('/api/quotes', {
    method: 'POST',
    body: payload,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  rotateSubmissionKey()
  sources.value = []
  publishMutation({ type: 'created', quoteIds: [response.data.id], toStatus: 'draft' })
  savedDraftId.value = response.data.id
  lastSavedQuote.value = savedText
  form.value.content = ''
  draftSaved.value = true
  void triggerDraftSavedPulse()
  emit('quote-added')
  await changeStep(1)
}

const submitUpdateQuote = async (
  editQuoteId: number,
  payload: Omit<CreateQuoteData, 'language' | 'sources'>,
) => {
  const updateQuotePath = `/api/quotes/${editQuoteId}` as '/api/quotes/:id'
  await $fetch<{ success: boolean }, '/api/quotes/:id'>(updateQuotePath, {
    method: 'PUT',
    body: payload
  })
}

const hasSourceContent = (source: CreateQuoteSourceData) => Boolean(
  source.source_type?.trim()
  ||
  source.source_url?.trim()
  || source.label?.trim()
  || source.source_medium
  || source.locator_type
  || source.locator_value?.trim()
  || source.translator_name?.trim()
  || source.notes?.trim(),
)

const validateEditedSources = () => {
  for (const source of sources.value) {
    if (!hasSourceContent(source)) continue
    if (Boolean(source.locator_type) !== Boolean(source.locator_value?.trim())) {
      throw new Error('A source locator needs both a type and a value')
    }
    if (source.locator_type === 'timecode' && source.locator_value && !normalizeTimecode(source.locator_value)) {
      throw new Error('Use MM:SS or HH:MM:SS with seconds below 60')
    }
    if (source.source_url?.trim()) {
      try { new URL(source.source_url.trim()) }
      catch { throw new Error('Enter a valid source URL') }
    }
  }
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
