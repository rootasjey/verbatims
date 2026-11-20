<template>
	<NDrawer
		v-model:open="isOpen"
		direction="bottom"
		:una="{
			drawerContent: 'max-h-[min(92dvh,56rem)] w-full max-w-full overflow-hidden rounded-t-2xl border border-b-0 border-gray-200 bg-[#FAFAF9] shadow-2xl dark:border-neutral-800 dark:bg-[#151515]',
			drawerOverlay: 'bg-black/45',
		}"
	>
		<template #body>
			<div class="flex h-[min(88dvh,48rem)] max-h-[min(88dvh,48rem)] flex-col overflow-hidden rounded-t-5 bg-[#FAFAF9] px-5 pt-6 text-gray-900 dark:bg-[#151515] dark:text-gray-100 sm:px-8">
				<div v-if="!user" class="mb-6 flex items-center justify-between gap-4 border-b border-gray-200/80 pb-4 dark:border-neutral-700/80">
					<h2 class="font-sans text-lg font-600 tracking-normal">
						{{ $t('components.dialogs.add_quote') }}
					</h2>
					<NButton
						icon
						btn="ghost-gray"
						label="i-ph-x"
						size="sm"
						class="rounded-full"
						@click="isOpen = false"
					/>
				</div>

				<section v-if="!user" class="max-w-xl py-3">
					<div class="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
						<NIcon name="i-ph-quotes" class="h-5 w-5" />
					</div>
					<p class="mt-3 font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400">
						{{ $t('components.dialogs.add_quote_guest_message') }}
					</p>
					<div class="mt-6 flex flex-col gap-3 sm:flex-row">
						<NButton btn="solid-black" class="w-full rounded-full px-6 sm:w-auto" @click="goToAuth('/login')">
							{{ $t('auth.sign_in_button') }}
						</NButton>
						<NButton btn="outline-gray" class="w-full rounded-full px-6 sm:w-auto" @click="goToAuth('/signup')">
							{{ $t('auth.sign_up_button') }}
						</NButton>
					</div>
				</section>

				<form v-else @submit.prevent="submitQuote" @keydown.capture="handleCreateEscape" @keydown="handleCreateFormKeydown" class="flex min-h-0 flex-1 flex-col">
					<div class="mb-6 flex items-start gap-3" :aria-label="String($t('components.dialogs.add_quote_steps'))">
						<div class="flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain">
						<button type="button" class="shrink-0 whitespace-nowrap" :aria-label="String($t('components.dialogs.quote_step'))" :aria-current="step === 1 ? 'step' : undefined" :class="['w-max min-w-max border-b-2 pb-2 text-left font-sans text-sm transition-colors', step === 1 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToQuoteStep">
							<OverflowingTabLabel number="01" :label="String($t('components.dialogs.quote_step'))" intrinsic />
						</button>
						<button type="button" class="shrink-0 whitespace-nowrap" :aria-label="String($t('components.dialogs.attribution_step'))" :aria-current="step === 2 ? 'step' : undefined" :disabled="form.content.trim().length < 2" :class="['w-max min-w-max border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', step === 2 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToAttributionStep">
							<OverflowingTabLabel number="02" :label="String($t('components.dialogs.attribution_step'))" intrinsic />
						</button>
						<button type="button" class="shrink-0 whitespace-nowrap" :aria-label="String($t('components.dialogs.source_step'))" :aria-current="step === 3 ? 'step' : undefined" :disabled="form.content.trim().length < 2 || !hasAttribution || submitting" :class="['w-max min-w-max border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', step === 3 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToSourceStep">
							<OverflowingTabLabel number="03" :label="String($t('components.dialogs.source_step'))" intrinsic />
						</button>
						</div>
						<NButton icon btn="ghost-gray" label="i-ph-x" size="sm" class="shrink-0 rounded-full" @click="isOpen = false" />
					</div>
					<p v-if="draftSaved" role="status" aria-live="polite" :class="['quote-draft-saved-feedback mb-4 flex items-center gap-2 font-sans text-sm text-gray-600 dark:text-gray-300', { 'quote-draft-saved-feedback--pulse': draftSavedPulseActive }]">
						<NIcon name="i-tabler-circle-check" class="h-4 w-4 shrink-0" />
						<span>
							<NuxtLink :to="draftEditUrl" class="underline decoration-gray-400 underline-offset-2 transition-colors hover:text-gray-900 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:decoration-neutral-500 dark:hover:text-gray-100" @click="isOpen = false">{{ $t('components.dialogs.draft_saved') }}</NuxtLink>
							{{ $t('components.dialogs.attribution_ready_for_next_quote') }}
						</span>
					</p>
					<div v-if="submissionError" role="alert" aria-live="assertive" aria-atomic="true" class="mb-4 flex items-start gap-2 rounded-1.5 border border-red-200 bg-red-50 px-3 py-2.5 font-sans text-sm leading-relaxed text-red-900 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100">
						<NIcon name="i-ph-warning-circle" class="mt-0.5 h-4 w-4 shrink-0" />
						<div class="min-w-0 break-words">
							<p>{{ submissionError }}</p>
							<p v-if="submissionErrorId" class="mt-1 text-xs">{{ $t('components.dialogs.quote_error_reference', { id: submissionErrorId }) }}</p>
							<button v-if="submissionErrorId" type="button" class="mt-1 rounded-sm font-600 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-200" @click="reportSubmissionError">
								{{ $t('components.dialogs.quote_error_report_action') }}
							</button>
						</div>
					</div>

					<div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain" @transitionend.self="finishStepTransition">
					<Transition :name="transitionName">
					<div v-if="step === 1" key="quote" data-quote-step="1" class="space-y-4 px-0 py-2">
						<QuoteContentFields
							ref="quoteInputRef"
							v-model="form.content"
							:placeholder="quotePlaceholder"
							:disabled="submitting"
							@input="draftSaved = false; clearDraftSavedPulse()"
						/>
					</div>

					<div v-else-if="step === 2" key="attribution" data-quote-step="2" class="space-y-5">
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
								<p v-if="!hasAttribution" class="font-sans text-xs text-gray-500 dark:text-gray-400">
									{{ $t('components.dialogs.attribution_required') }}
								</p>
							</template>
						</QuoteAttributionFields>
					</div>

					<div v-else key="sources" data-quote-step="3" class="py-2">
						<QuoteSourcesEditor v-model="sources" :disabled="submitting" />
					</div>
					</Transition>
					</div>

					<div class="mt-auto -mx-5 flex shrink-0 items-center justify-between gap-3 border-t border-gray-200/80 bg-[#FAFAF9] px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 dark:border-neutral-700/80 dark:bg-[#151515] sm:-mx-8 sm:px-8">
						<NButton
							btn="light:soft dark:soft-white"
							type="button"
							@click="step > 1 ? goToPreviousStep() : isOpen = false"
							:disabled="submitting"
							class="min-w-24"
						>
							{{ step > 1 ? $t('common.back') : $t('common.cancel') }}
						</NButton>
						<NButton v-if="step === 1"
							btn="solid-black"
							type="button"
							:disabled="form.content.trim().length < 2 || submitting"
							class="min-w-32"
							@click="goToAttributionStep"
						>
							{{ $t('common.next') }}
							<NIcon name="i-ph-arrow-right" class="ml-2 h-4 w-4" />
						</NButton>
						<NButton v-else
							btn="solid-black"
							:loading="submitting"
							type="submit"
							:disabled="(!form.selectedAuthor && !form.selectedReference) || form.content.trim().length < 2 || submitting"
							class="min-h-10 min-w-32 rounded-1 px-4"
						>
							{{ $t('components.dialogs.save_as_draft') }}
						</NButton>
					</div>
				</form>
			</div>
		</template>
	</NDrawer>

	<ReportDrawer
		v-model:open="showErrorReport"
		category="bug"
		:initial-message="errorReportMessage"
	/>
</template>

<script lang="ts" setup>
import OverflowingTabLabel from '~/components/OverflowingTabLabel.vue'
import QuoteContentFields from '~/components/QuoteContentFields.vue'
import QuoteAttributionFields from '~/components/QuoteAttributionFields.vue'
import { useDashboardQuoteEvents } from '~/composables/useDashboardQuoteEvents'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useQuoteForm } from '~/composables/useQuoteForm'
import { useQuoteStepTransition } from '~/composables/useQuoteStepTransition'

interface Emits {
	(e: 'update:open', value: boolean): void
	(e: 'submitted'): void
}

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()
const { user } = useUserSession()
const { publishMutation } = useDashboardQuoteEvents()
const step = ref<number>(1)
const quoteInputRef = ref<any>(null)
const lastSavedQuote = ref('')
const draftSaved = ref(false)
const savedDraftId = ref<number | null>(null)
const draftEditUrl = computed(() => ({
	path: '/dashboard/my-quotes/drafts',
	query: { edit: savedDraftId.value ? String(savedDraftId.value) : undefined },
}))
const draftSavedPulseActive = ref(false)
const submissionError = ref('')
const submissionErrorId = ref('')
const showErrorReport = ref(false)
const errorReportMessage = ref('')
const route = useRoute()
let draftSavedPulseTimer: ReturnType<typeof setTimeout> | undefined
const quotePlaceholder = computed(() => {
	if (!lastSavedQuote.value) return String($t('components.dialogs.quote_placeholder'))
	const excerpt = lastSavedQuote.value.replace(/\s+/g, ' ').trim()
	return excerpt.length > 90 ? `${excerpt.slice(0, 87).trimEnd()}…` : excerpt
})
const { stepViewportRef, stepViewportHeight, transitionName, changeStep, finishStepTransition } = useQuoteStepTransition(step)

const isOpen = computed({
	get: () => !!props.open,
	set: (val: boolean) => emit('update:open', val)
})

watch(isOpen, (open) => {
	if (open) step.value = 1
	else {
		clearDraftSavedPulse()
		submissionError.value = ''
		submissionErrorId.value = ''
	}
})

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
	createPayload,
} = useQuoteForm()

const hasAttribution = computed(() => Boolean(form.value.selectedAuthor || form.value.selectedReference))

const reportSubmissionError = async () => {
	if (!submissionErrorId.value) return
	const stepLabel = String($t(step.value === 1
		? 'components.dialogs.quote_step'
		: step.value === 2
			? 'components.dialogs.attribution_step'
			: 'components.dialogs.source_step'))
	errorReportMessage.value = String($t('components.dialogs.quote_error_report_template', {
		id: submissionErrorId.value,
		page: route.path,
		step: stepLabel,
	}))
	isOpen.value = false
	await nextTick()
	showErrorReport.value = true
}

watch([() => form.value, sources], () => {
	submissionError.value = ''
	submissionErrorId.value = ''
}, { deep: true })

const goToAuth = async (path: '/login' | '/signup') => {
	isOpen.value = false
	await navigateTo(path)
}

const onAuthorInput = () => {
	draftSaved.value = false
	clearDraftSavedPulse()
	showAuthorSuggestions.value = Boolean(authorQuery.value.trim())
	if (authorQuery.value.trim()) void searchAuthors($fetch, { limit: 10, minLength: 2 })
	else authorSuggestions.value = []
}

const onReferenceInput = () => {
	draftSaved.value = false
	clearDraftSavedPulse()
	showReferenceSuggestions.value = Boolean(referenceQuery.value.trim())
	if (referenceQuery.value.trim()) void searchReferences($fetch, { limit: 10, minLength: 2 })
	else referenceSuggestions.value = []
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

const goToAttributionStep = async () => {
	if (form.value.content.trim().length < 2) return
	await changeStep(2)
	void nextTick(() => authorInputRef.value?.focus?.())
}

const goToSourceStep = async () => {
	if (form.value.content.trim().length < 2 || !hasAttribution.value) return
	await changeStep(3)
}

const goToPreviousStep = async () => {
	if (step.value === 3) await goToAttributionStep()
	else await goToQuoteStep()
}

const goToQuoteStep = async () => {
	await changeStep(1)
	void nextTick(() => quoteInputRef.value?.focus?.())
}

const handleCreateFormKeydown = (event: KeyboardEvent) => {
	if (event.defaultPrevented || event.isComposing) return

	if (step.value === 1 && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
		event.preventDefault()
		void goToAttributionStep()
		return
	}

		if (step.value > 1 && event.key === 'Enter' && !submitting.value) {
		event.preventDefault()
		void submitQuote()
	}
}

const handleCreateEscape = (event: KeyboardEvent) => {
	if (event.key !== 'Escape') return
	event.preventDefault()
	event.stopPropagation()
	if (step.value === 3) void goToAttributionStep()
	else if (step.value === 2) void goToQuoteStep()
	else isOpen.value = false
}

const submitQuote = async () => {
	if (submitting.value) return
	submissionError.value = ''
	submissionErrorId.value = ''
	if (form.value.content.trim().length < 2) return
	if (!form.value.selectedAuthor && !form.value.selectedReference) {
		void goToAttributionStep()
		return
	}

	try {
		submitting.value = true
		const savedText = form.value.content.trim()
		const payload = createPayload()
		const idempotencyKey = getSubmissionKey(payload)

		const response = await $fetch<{ success: boolean; data: { id: number } }, '/api/quotes'>('/api/quotes', {
			method: 'POST',
			body: payload,
			headers: { 'Idempotency-Key': idempotencyKey },
		})
		rotateSubmissionKey()

		savedDraftId.value = response.data.id
		publishMutation({ type: 'created', quoteIds: [response.data.id], toStatus: 'draft' })
		lastSavedQuote.value = savedText
		form.value.content = ''
		sources.value = []
		draftSaved.value = true
		void triggerDraftSavedPulse()
		emit('submitted')
		await goToQuoteStep()
	} catch (error: any) {
		console.error('Error submitting quote:', error)
		const errorId = error?.data?.data?.errorId ?? error?.data?.errorId
		submissionErrorId.value = typeof errorId === 'string' ? errorId : ''
		const message = error?.data?.statusMessage || error?.statusMessage || error?.data?.message || error?.message
		submissionError.value = !message || message === 'Failed to create quote'
			? String($t('components.dialogs.quote_save_failed'))
			: String(message)
	} finally {
		submitting.value = false
		if (draftSaved.value) nextTick(() => quoteInputRef.value?.focus?.())
	}
}

onUnmounted(clearDraftSavedPulse)
</script>
