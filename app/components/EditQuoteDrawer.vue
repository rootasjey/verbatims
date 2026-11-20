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
			<div class="max-h-[min(92dvh,56rem)] overflow-y-auto overscroll-contain px-4 pb-0 pt-5 text-gray-900 dark:text-gray-100 sm:px-6">
				<div v-if="!canEditSources" class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">
						{{ editMode ? $t('components.dialogs.edit_quote') : $t('components.dialogs.add_quote') }}
					</h2>
					<NButton
						icon
						btn="ghost-gray"
						label="i-ph-x-bold"
						size="sm"
						@click="handleClose"
					/>
				</div>
				<nav v-if="canEditSources" class="mb-6 flex items-start gap-3" :aria-label="String($t('components.dialogs.quote_form_steps'))">
					<div class="flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain">
					<button v-for="item in drawerSteps" :key="item.number" type="button" :aria-current="drawerStep === item.number ? 'step' : undefined"
						:disabled="!canNavigateTo(item.number)" class="w-max min-w-max shrink-0 whitespace-nowrap border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
						:class="drawerStep === item.number ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 dark:border-neutral-700 dark:text-gray-400'"
						@click="goToStep(item.number)">
						<OverflowingTabLabel :number="'0' + item.number" :label="item.label" intrinsic />
					</button>
					</div>
					<NButton icon btn="ghost-gray" label="i-ph-x-bold" size="sm" class="shrink-0" @click="handleClose" />
				</nav>

				<form @submit.prevent="canEditSources && drawerStep < 3 ? goToNextStep() : submitQuote()" class="space-y-6">
					<div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative overflow-hidden" @transitionend.self="finishStepTransition">
					<Transition :name="transitionName">
					<div :key="drawerStep" class="space-y-6">
					<section v-if="!canEditSources || drawerStep === 1" key="quote" data-quote-step="1" class="space-y-4 px-0 py-2">
						<QuoteContentFields v-model="form.content" :placeholder="String($t('components.dialogs.quote_placeholder'))" :disabled="submitting" />
					</section>

					<section v-if="!canEditSources || drawerStep === 2" key="attribution" data-quote-step="2" class="space-y-4">
						<div v-if="canEditSources && sourceLoadError" class="space-y-2 text-sm text-red-700 dark:text-red-300" role="alert">
							<p>{{ $t('components.dialogs.quote_save_failed') }}</p>
							<NButton btn="outline-gray" type="button" @click="props.editQuote?.id && loadSources(props.editQuote.id)">{{ $t('components.dialogs.source_load_retry') }}</NButton>
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
							:has-attribution="Boolean(form.selectedAuthor || form.selectedReference)"
							:input-refs="attributionInputRefs"
							:suggestion-refs="attributionSuggestionRefs"
							:handlers="attributionFieldHandlers"
						>
							<template #feedback>
								<p v-if="!form.selectedAuthor && !form.selectedReference" id="quote-attribution-required" class="font-sans text-xs text-gray-500 dark:text-gray-400">
									{{ $t('components.dialogs.attribution_required') }}
								</p>
							</template>
						</QuoteAttributionFields>
					</section>

					<section v-if="canEditSources && drawerStep === 3" key="sources" data-quote-step="3" class="space-y-4">
						<div v-if="!sourcesLoaded" class="space-y-3 text-sm text-gray-500 dark:text-gray-400" role="status">
							<p>{{ sourceLoadError ? $t('components.dialogs.quote_save_failed') : $t('common.loading') }}</p>
							<NButton v-if="sourceLoadError" btn="outline-gray" type="button" @click="props.editQuote?.id && loadSources(props.editQuote.id)">{{ $t('components.dialogs.source_load_retry') }}</NButton>
						</div>
						<QuoteSourcesEditor v-else v-model="sources" :disabled="submitting" />
					</section>
					</div>
					</Transition>
					</div>

					<div class="sticky bottom-0 z-10 -mx-4 flex space-x-3 border-t border-gray-200 bg-[#FAFAF9] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 dark:border-neutral-800 dark:bg-[#151515] sm:-mx-6 sm:px-6">
						<NButton v-if="canEditSources && drawerStep > 1"
							btn="light:soft dark:soft-white" type="button" :disabled="submitting" class="flex-1" @click="goToPreviousStep">
							{{ $t('common.back') }}
						</NButton>
						<NButton v-else
							btn="light:soft dark:soft-white"
							type="button"
							@click="handleClose"
							:disabled="submitting"
							class="flex-1"
						>
							{{ $t('common.cancel') }}
						</NButton>
						<NButton v-if="canEditSources && drawerStep < 3"
							btn="solid-black" type="button" :disabled="!canContinue || submitting || (drawerStep === 2 && !sourcesLoaded)" class="flex-1" @click="goToNextStep">
							{{ $t('common.next') }}<NIcon name="i-ph-arrow-right" class="ml-2 h-4 w-4" />
						</NButton>
						<NButton v-else
							btn="soft-blue"
							:loading="submitting"
							type="submit"
							:disabled="!canContinue || (canEditSources && !sourcesLoaded)"
							class="flex-1"
						>
							{{ $t('components.dialogs.save') }}
						</NButton>
					</div>
				</form>
			</div>
		</template>
	</NDrawer>
</template>

<script lang="ts" setup>
import OverflowingTabLabel from '~/components/OverflowingTabLabel.vue'
import QuoteContentFields from '~/components/QuoteContentFields.vue'
import QuoteAttributionFields from '~/components/QuoteAttributionFields.vue'
import { buildQuoteSourceEditPayload, isQuoteSourceLoadCurrent } from '~/utils/quote-source-edit'
import { useQuoteStepTransition } from '~/composables/useQuoteStepTransition'
import { useDashboardQuoteEvents } from '~/composables/useDashboardQuoteEvents'
import { useQuoteForm } from '~/composables/useQuoteForm'

interface Props {
	open?: boolean
	editQuote?: QuoteWithRelations | AdminQuote | null
}

interface Emits {
	(e: 'update:open', value: boolean): void
	(e: 'submitted'): void
}

type EditableDrawerQuoteSource = CreateQuoteSourceData & {
	id?: number
	attribution_id?: number | null
	occurrence_id?: number | null
	verification_status?: QuoteProvenanceStatus
	is_primary?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { publishMutation } = useDashboardQuoteEvents()
const { user } = useUserSession()
const sourcesLoaded = ref(false)
const sourceLoadError = ref(false)
const sourceLoadToken = ref(0)
const sourceSnapshotIds = ref<number[]>([])
const sourceSnapshot = ref<EditableDrawerQuoteSource[]>([])
const sourceAttributionIds = ref<number[]>([])
const primarySourceAttributionId = ref<number | null>(null)
const drawerStep = ref<number>(1)
const { stepViewportRef, stepViewportHeight, transitionName, changeStep, finishStepTransition } = useQuoteStepTransition(drawerStep)
const drawerSteps = computed(() => [
	{ number: 1 as const, label: String($t('components.dialogs.quote_step')) },
	{ number: 2 as const, label: String($t('components.dialogs.attribution_step')) },
	{ number: 3 as const, label: String($t('components.dialogs.source_step')) },
])
const canEditSources = computed(() => editMode.value
	&& ['draft', 'approved'].includes(props.editQuote?.status || '')
	&& ['admin', 'moderator'].includes(user.value?.role || ''))
const canContinue = computed(() => form.value.content.trim().length >= 2
	&& (drawerStep.value !== 2 || Boolean(form.value.selectedAuthor || form.value.selectedReference)))

const canNavigateTo = (step: 1 | 2 | 3) => !submitting.value
	&& form.value.content.trim().length >= 2
	&& (step === 1 || Boolean(form.value.selectedAuthor || form.value.selectedReference))
	&& (step !== 3 || sourcesLoaded.value)

const goToStep = (step: 1 | 2 | 3) => {
	if (canNavigateTo(step)) void changeStep(step)
}

const goToNextStep = () => {
	if (!canContinue.value || submitting.value) return
	if (drawerStep.value < 3) void changeStep(drawerStep.value + 1)
}

const goToPreviousStep = () => {
	if (drawerStep.value > 1 && !submitting.value) void changeStep(drawerStep.value - 1)
}

const isOpen = computed({
	get: () => !!props.open,
	set: (val: boolean) => emit('update:open', val)
})

const editMode = computed(() => !!props.editQuote)

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
} = useQuoteForm()

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

const onAuthorInput = () => {
	void searchAuthors($fetch, { limit: 10, minLength: 2 })
}

const onReferenceInput = () => {
	void searchReferences($fetch, { limit: 10, minLength: 2 })
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
	authorKeydown: handleAuthorKeydown,
	authorSuggestionsBlur: handleAuthorSuggestionsBlur,
	authorPanelKeydown: handleAuthorKeydown,
	selectAuthor,
	createAuthor: createNewAuthor,
	clearAuthor: clearAuthorFromField,
	referenceInput: onReferenceInput,
	referenceFocus: handleReferenceInputFocus,
	referenceBlur: handleReferenceInputBlur,
	referenceKeydown: handleReferenceKeydown,
	referenceSuggestionsBlur: handleReferenceSuggestionsBlur,
	referencePanelKeydown: handleReferenceKeydown,
	selectReference,
	createReference: createNewReference,
	clearReference: clearReferenceFromField,
}

const handleClose = () => {
	resetForm()
	isOpen.value = false
}

const loadSources = async (quoteId: number) => {
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
		const attributions = attributionsResponse.data ?? []
		const primaryId = attributions.find(item => item.is_primary)?.id ?? attributions[0]?.id ?? null
		if (!isQuoteSourceLoadCurrent(token, sourceLoadToken.value, quoteId, props.editQuote?.id, isOpen.value)) return
		sourceSnapshotIds.value = (sourcesResponse.data ?? []).map(source => source.id)
		sourceAttributionIds.value = attributions.map(item => item.id)
		primarySourceAttributionId.value = primaryId
		sources.value = (sourcesResponse.data ?? []).map(source => ({
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
		console.error('Failed to load quote sources:', error)
		showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Failed to load quote sources.' })
	}
}

// Watch for editQuote changes after loadSources has been initialized.
watch(() => props.editQuote, (quote) => {
	if (quote) {
		initializeFormForEdit(quote)
		authorQuery.value = ''
		referenceQuery.value = ''
		finishStepTransition()
		drawerStep.value = 1
	} else if (!quote) {
		resetForm()
		sources.value = []
		sourcesLoaded.value = false
		finishStepTransition()
		drawerStep.value = 1
	}
}, { immediate: true, flush: 'sync' })

watch([isOpen, canEditSources, () => props.editQuote?.id], ([open, allowed, quoteId]) => {
	sourceLoadToken.value++
	if (open && typeof quoteId === 'number' && props.editQuote) {
		initializeFormForEdit(props.editQuote)
		authorQuery.value = ''
		referenceQuery.value = ''
		finishStepTransition()
		drawerStep.value = 1
		if (allowed) void loadSources(quoteId)
	}
	else if (!open) {
		finishStepTransition()
		drawerStep.value = 1
	}
}, { immediate: true, flush: 'sync' })

const submitQuote = async () => {
	if (!form.value.content.trim()) return
	if (editMode.value && canEditSources.value && !sourcesLoaded.value) {
		sourceLoadError.value = true
		return
	}

	try {
		submitting.value = true
		
		if (editMode.value && props.editQuote) {
			// Update existing quote
			const payload = {
				name: form.value.content.trim(),
				attributions: [{
					author_id: form.value.selectedAuthor?.id || null,
					reference_id: form.value.selectedReference?.id || null,
					is_primary: true,
				}],
				new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
				new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value, primary_type: 'other' as const } : undefined,
			}
			if (canEditSources.value) {
				if (primarySourceAttributionId.value == null) throw new Error('A quote requires a primary attribution to record sources')
				const editableSources = sources.value as EditableDrawerQuoteSource[]
				for (const source of editableSources) {
					if (source.locator_type && !source.locator_value?.trim()) throw new Error('A source locator needs a value')
					if (!source.locator_type && source.locator_value?.trim()) throw new Error('A source locator needs a type')
					if (source.source_url?.trim()) new URL(source.source_url.trim())
				}
				Object.assign(payload, buildQuoteSourceEditPayload(editableSources, sourceSnapshotIds.value, sourceSnapshot.value, new Set(sourceAttributionIds.value), primarySourceAttributionId.value))
			}

			const quotePath = `/api/quotes/${props.editQuote.id}` as '/api/quotes/:id'
			await $fetch<{ success: boolean }, '/api/quotes/:id'>(quotePath, {
				method: 'PUT',
				body: payload
			})
			publishMutation({ type: 'updated', quoteIds: [props.editQuote.id] })
		} else {
			// Create new quote
			const payload = {
				name: form.value.content.trim(),
				language: form.value.language.value,
				attributions: [{
					author_id: form.value.selectedAuthor?.id || null,
					reference_id: form.value.selectedReference?.id || null,
					is_primary: true,
				}],
				new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
				new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value, primary_type: 'other' as const } : undefined,
			}

			const response = await $fetch<{ success: boolean; data: { id: number } }, '/api/quotes'>('/api/quotes', {
				method: 'POST',
				body: payload
			})
			publishMutation({ type: 'created', quoteIds: [response.data.id], toStatus: 'draft' })
		}

		resetForm()
		isOpen.value = false

		emit('submitted')
	} catch (error: any) {
		console.error('Error submitting quote:', error)
		showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Failed to save quote. Please try again.' })
	} finally {
		submitting.value = false
	}
}
</script>
