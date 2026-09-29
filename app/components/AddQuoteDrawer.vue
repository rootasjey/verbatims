<template>
	<NDrawer v-model:open="isOpen" direction="bottom">
		<template #body>
			<div class="max-h-[min(88dvh,48rem)] overflow-y-auto rounded-t-5 bg-[#FAFAF9] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-gray-900 dark:bg-[#151515] dark:text-gray-100 sm:px-8">
				<div class="mb-6 flex items-center justify-between gap-4 border-b border-gray-200/80 pb-4 dark:border-neutral-700/80">
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

				<form v-else @submit.prevent="submitQuote" @keydown.capture="handleCreateEscape" @keydown="handleCreateFormKeydown" class="space-y-6">
					<div class="mb-6 grid grid-cols-2 gap-3" :aria-label="String($t('components.dialogs.add_quote_steps'))">
						<button type="button" :aria-current="step === 1 ? 'step' : undefined" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors', step === 1 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToQuoteStep">
							<span class="mr-2 text-xs tabular-nums opacity-60">01</span>{{ $t('components.dialogs.quote_step') }}
						</button>
						<button type="button" :aria-current="step === 2 ? 'step' : undefined" :disabled="form.content.trim().length < 2" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', step === 2 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToAttributionStep">
							<span class="mr-2 text-xs tabular-nums opacity-60">02</span>{{ $t('components.dialogs.attribution_step') }}
						</button>
					</div>
					<p v-if="draftSaved" role="status" aria-live="polite" class="mb-4 flex items-center gap-2 font-sans text-sm text-gray-600 dark:text-gray-300">
						<NIcon name="i-tabler-circle-check" class="h-4 w-4 shrink-0" />
						{{ $t('components.dialogs.draft_saved_continue') }}
					</p>

					<div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative overflow-hidden" @transitionend.self="finishStepTransition">
					<Transition :name="transitionName">
					<div v-if="step === 1" key="quote" data-quote-step="1" class="space-y-5 p-2">
						<div class="relative">
							<NInput
								ref="quoteInputRef"
								type="textarea"
								autofocus
								v-model="form.content"
								class="min-h-48 rounded-1.5 bg-gray-100/80 px-4 pb-10 pt-4 font-serif text-2xl leading-snug text-gray-900 ring-transparent placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-gray-400/60 light:focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-600 dark:focus-visible:ring-gray-500"
								:placeholder="quotePlaceholder"
								:rows="4"
								:disabled="submitting"
								@input="draftSaved = false"
								required
							/>
							<span class="pointer-events-none absolute bottom-3 right-4 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite" :aria-label="String($t('components.dialogs.character_count', { count: form.content.length }))">{{ form.content.length }}</span>
						</div>
						<div>
							<label class="mb-1.5 block font-sans text-sm font-600 text-gray-700 dark:text-gray-300">
								{{ $t('components.dialogs.language') }}
							</label>
							<NSelect
								v-model="form.language"
								:items="languageOptions"
								:placeholder="$t('components.dialogs.select_language') as string"
								item-key="label"
								value-key="label"
								:disabled="submitting"
								@update:model-value="onLanguageSelected"
							/>
							<p v-if="languageDetection.source === 'auto' && languageDetection.label" class="mt-1.5 font-sans text-xs text-gray-500 dark:text-gray-400">
								{{ $t('components.dialogs.detected_language', { language: languageDetection.label }) }}
							</p>
						</div>
					</div>

					<div v-else key="attribution" data-quote-step="2" class="space-y-5">
						<!-- Author Selection -->
						<div>
							<label class="sr-only">
								{{ $t('components.dialogs.author_label') }}
							</label>
							<div class="relative">
								<div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
									<span v-if="form.selectedAuthor" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
										<NAvatar :src="form.selectedAuthor.image_url" :alt="form.selectedAuthor.name" size="xs" class="shrink-0" />
										<span class="max-w-48 truncate">{{ form.selectedAuthor.name }}</span>
										<button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearAuthorFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
									</span>
									<input
										id="drawer-add-quote-author"
										ref="authorInputRef"
										v-model="authorQuery"
										type="text"
										class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
										:aria-label="String($t('components.dialogs.author_label'))"
										:placeholder="(form.selectedAuthor ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_author')) as string"
										:disabled="submitting"
										@input="onAuthorInput"
										@focus="handleAuthorInputFocus"
										@blur="handleAuthorInputBlur"
										@keydown="onAuthorKeydown"
									/>
								</div>
								<!-- Author Suggestions -->
								<Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
								<div
									v-if="showAuthorSuggestions && (authorSuggestions.length > 0 || authorQuery)"
									ref="authorSuggestionsRef"
								:style="{ height: authorSuggestionsHeight }"
									class="quote-suggestions-panel relative z-10 mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
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
											? 'bg-gray-100 dark:bg-neutral-700'
											: 'hover:bg-gray-100 dark:hover:bg-neutral-800'
										]"
										@click="selectAuthor(author)"
										@mouseenter="selectedAuthorIndex = index"
									>
										<NAvatar :src="author.image_url" :alt="author.name" size="xs" class="shrink-0" />
										<div class="flex-1">
											<div class="text-sm font-medium">{{ author.name }}</div>
											<div v-if="author.job" class="text-xs text-gray-500">{{ author.job }}</div>
										</div>
									</div>
									<div
										v-if="authorQuery && !authorSuggestions.some((a: Author) => a.name.toLowerCase() === authorQuery.toLowerCase())"
										:class="[
											'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
											selectedAuthorIndex === authorSuggestions.length
											? 'bg-gray-100 dark:bg-neutral-700'
											: 'hover:bg-gray-100 dark:hover:bg-neutral-800'
										]"
										@click="createNewAuthor"
										@mouseenter="selectedAuthorIndex = authorSuggestions.length"
									>
										<div class="text-sm font-medium text-blue-600 dark:text-blue-400">
											{{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}
										</div>
									</div>
								</div>
								</Transition>
								</div>
						</div>

						<!-- Reference Selection -->
						<div>
							<label class="sr-only">
								{{ $t('components.dialogs.reference_label') }}
							</label>
							<div class="relative">
								<div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
									<span v-if="form.selectedReference" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
										<NAvatar :src="form.selectedReference.image_url" :alt="form.selectedReference.name" rounded="2" size="xs" class="shrink-0" />
										<span class="max-w-48 truncate">{{ form.selectedReference.name }}</span>
										<button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearReferenceFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
									</span>
									<input
										id="drawer-add-quote-reference"
										ref="referenceInputRef"
										v-model="referenceQuery"
										type="text"
										class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
										:aria-label="String($t('components.dialogs.reference_label'))"
										:placeholder="(form.selectedReference ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_reference')) as string"
										:disabled="submitting"
										@input="onReferenceInput"
										@focus="handleReferenceInputFocus"
										@blur="handleReferenceInputBlur"
										@keydown="onReferenceKeydown"
									/>
								</div>
								<!-- Reference Suggestions -->
								<Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
								<div
									v-if="showReferenceSuggestions && (referenceSuggestions.length > 0 || referenceQuery)"
									ref="referenceSuggestionsRef"
								:style="{ height: referenceSuggestionsHeight }"
									class="quote-suggestions-panel relative z-10 mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
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
											? 'bg-gray-100 dark:bg-neutral-700'
											: 'hover:bg-gray-100 dark:hover:bg-neutral-800'
										]"
										@click="selectReference(reference)"
										@mouseenter="selectedReferenceIndex = index"
									>
										<NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="xs" class="shrink-0" />
										<div class="flex-1">
											<div class="text-sm font-medium">{{ reference.name }}</div>
											<div v-if="reference.primary_type" class="text-xs text-gray-500 capitalize">{{ reference.primary_type.replace('_', ' ') }}</div>
										</div>
									</div>
									<div
										v-if="referenceQuery && !referenceSuggestions.some((r: QuoteReference) => r.name.toLowerCase() === referenceQuery.toLowerCase())"
										:class="[
											'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
											selectedReferenceIndex === referenceSuggestions.length
											? 'bg-gray-100 dark:bg-neutral-700'
											: 'hover:bg-gray-100 dark:hover:bg-neutral-800'
										]"
										@click="createNewReference"
										@mouseenter="selectedReferenceIndex = referenceSuggestions.length"
									>
										<div class="text-sm font-medium text-blue-600 dark:text-blue-400">
											{{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}
										</div>
									</div>
								</div>
								</Transition>
								</div>
						</div>
						<p v-if="!form.selectedAuthor && !form.selectedReference" class="text-right font-sans text-xs text-gray-500 dark:text-gray-400">
							{{ $t('components.dialogs.attribution_required') }}
						</p>
					</div>
					</Transition>
					</div>

					<div class="flex items-center justify-between gap-3 border-t border-gray-200/80 pt-5 dark:border-neutral-700/80">
						<NButton
							btn="light:soft dark:soft-white"
							type="button"
							@click="step === 2 ? goToQuoteStep() : isOpen = false"
							:disabled="submitting"
							class="min-w-24"
						>
							{{ step === 2 ? $t('common.back') : $t('common.cancel') }}
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
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
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
const step = ref<number>(1)
const quoteInputRef = ref<any>(null)
const lastSavedQuote = ref('')
const draftSaved = ref(false)
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
})
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
	onLanguageSelected,
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

const { showErrorToast } = useErrorToast()

const goToAuth = async (path: '/login' | '/signup') => {
	isOpen.value = false
	await navigateTo(path)
}

const onAuthorInput = () => {
	draftSaved.value = false
	showAuthorSuggestions.value = Boolean(authorQuery.value.trim())
	if (authorQuery.value.trim()) void searchAuthors($fetch, { limit: 10, minLength: 2 })
	else authorSuggestions.value = []
}

const onReferenceInput = () => {
	draftSaved.value = false
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

const goToAttributionStep = async () => {
	if (form.value.content.trim().length < 2) return
	await changeStep(2)
	void nextTick(() => authorInputRef.value?.focus?.())
}

const goToQuoteStep = async () => {
	await changeStep(1)
	void nextTick(() => quoteInputRef.value?.$el?.querySelector('textarea')?.focus())
}

const handleCreateFormKeydown = (event: KeyboardEvent) => {
	if (event.defaultPrevented || event.isComposing) return

	if (step.value === 1 && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
		event.preventDefault()
		void goToAttributionStep()
		return
	}

	if (step.value === 2 && event.key === 'Enter' && !submitting.value) {
		event.preventDefault()
		void submitQuote()
	}
}

const handleCreateEscape = (event: KeyboardEvent) => {
	if (event.key !== 'Escape') return
	event.preventDefault()
	event.stopPropagation()
	if (step.value === 2) void goToQuoteStep()
	else isOpen.value = false
}

const submitQuote = async () => {
	if (submitting.value) return
	if (form.value.content.trim().length < 2) return
	if (!form.value.selectedAuthor && !form.value.selectedReference) {
		void goToAttributionStep()
		return
	}

	try {
		submitting.value = true
		const savedText = form.value.content.trim()
		const payload = {
			name: form.value.content.trim(),
			language: form.value.language.value,
			attributions: [{
				author_id: form.value.selectedAuthor?.id || null,
				reference_id: form.value.selectedReference?.id || null,
				is_primary: true,
			}],
			new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
			new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value, primary_type: 'other' as const } : undefined
		}

		await $fetch('/api/quotes', {
			method: 'POST',
			body: payload
		})

		lastSavedQuote.value = savedText
		form.value.content = ''
		draftSaved.value = true
		emit('submitted')
		await goToQuoteStep()
	} catch (error: any) {
		console.error('Error submitting quote:', error)
		showErrorToast(error, String($t('components.dialogs.toast_error')))
	} finally {
		submitting.value = false
		if (draftSaved.value) nextTick(() => quoteInputRef.value?.$el?.querySelector('textarea')?.focus())
	}
}
</script>
