<template>
	<div class="space-y-4">
		<div>
			<label class="sr-only" for="quote-attribution-author">{{ $t('components.dialogs.author_label') }}</label>
			<div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
				<span v-if="selectedAuthor" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
					<NAvatar :src="selectedAuthor.image_url" :alt="selectedAuthor.name" size="xs" class="shrink-0" />
					<span class="max-w-48 truncate">{{ selectedAuthor.name }}</span>
					<button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="handlers.clearAuthor">
						<NIcon name="i-tabler-x" class="h-3.5 w-3.5" />
					</button>
				</span>
				<input
					id="quote-attribution-author"
					:ref="inputRefs.author"
					:value="authorQuery"
					type="text"
					:placeholder="(selectedAuthor ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_author')) as string"
					:aria-describedby="!hasAttribution ? 'quote-attribution-required' : undefined"
					:disabled="disabled"
					class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
					@input="emit('update:authorQuery', ($event.target as HTMLInputElement).value); handlers.authorInput()"
					@focus="handlers.authorFocus"
					@blur="handlers.authorBlur"
					@keydown="handlers.authorKeydown"
				/>
			</div>
			<Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
				<div v-if="showAuthorSuggestions && (authorSuggestions.length || authorQuery)" :ref="suggestionRefs.author" :style="{ height: authorSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handlers.authorSuggestionsBlur" @keydown="handlers.authorPanelKeydown">
					<button v-for="(author, index) in authorSuggestions" :key="author.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedAuthorIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="handlers.selectAuthor(author)">
						<NAvatar :src="author.image_url" :alt="author.name" size="xs" class="shrink-0" />
						<span class="min-w-0">
							<span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ author.name }}</span>
							<span v-if="author.job" class="block truncate font-sans text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</span>
						</span>
					</button>
					<button v-if="authorQuery && !authorSuggestions.some(author => author.name.toLowerCase() === authorQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedAuthorIndex === authorSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="handlers.createAuthor">
						{{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}
					</button>
				</div>
			</Transition>
		</div>

		<div>
			<label class="sr-only" for="quote-attribution-reference">{{ $t('components.dialogs.reference_label') }}</label>
			<div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
				<span v-if="selectedReference" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
					<NAvatar :src="selectedReference.image_url" :alt="selectedReference.name" rounded="2" size="xs" class="shrink-0" />
					<span class="max-w-48 truncate">{{ selectedReference.name }}</span>
					<button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="handlers.clearReference">
						<NIcon name="i-tabler-x" class="h-3.5 w-3.5" />
					</button>
				</span>
				<input
					id="quote-attribution-reference"
					:ref="inputRefs.reference"
					:value="referenceQuery"
					type="text"
					:placeholder="(selectedReference ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_reference')) as string"
					:aria-describedby="!hasAttribution ? 'quote-attribution-required' : undefined"
					:disabled="disabled"
					class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
					@input="emit('update:referenceQuery', ($event.target as HTMLInputElement).value); handlers.referenceInput()"
					@focus="handlers.referenceFocus"
					@blur="handlers.referenceBlur"
					@keydown="handlers.referenceKeydown"
				/>
			</div>
			<Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
				<div v-if="showReferenceSuggestions && (referenceSuggestions.length || referenceQuery)" :ref="suggestionRefs.reference" :style="{ height: referenceSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handlers.referenceSuggestionsBlur" @keydown="handlers.referencePanelKeydown">
					<button v-for="(reference, index) in referenceSuggestions" :key="reference.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedReferenceIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="handlers.selectReference(reference)">
						<NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="xs" class="shrink-0" />
						<span class="min-w-0">
							<span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ reference.name }}</span>
							<span v-if="reference.primary_type" class="block truncate font-sans text-xs capitalize text-gray-500 dark:text-gray-400">{{ reference.primary_type.replace('_', ' ') }}</span>
						</span>
					</button>
					<button v-if="referenceQuery && !referenceSuggestions.some(reference => reference.name.toLowerCase() === referenceQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedReferenceIndex === referenceSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="handlers.createReference">
						{{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}
					</button>
				</div>
			</Transition>
		</div>

		<slot name="feedback" />
	</div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch, type Ref } from 'vue'

interface FieldRefs {
	author: Ref<HTMLInputElement | null>
	reference: Ref<HTMLInputElement | null>
}

interface SuggestionRefs {
	author: Ref<HTMLElement | null>
	reference: Ref<HTMLElement | null>
}

interface Handlers {
	authorInput: () => void
	authorFocus: (event: FocusEvent) => void
	authorBlur: (event: FocusEvent) => void
	authorKeydown: (event: KeyboardEvent) => void
	authorSuggestionsBlur: (event: FocusEvent) => void
	authorPanelKeydown: (event: KeyboardEvent) => void
	selectAuthor: (author: Author) => void
	createAuthor: () => void
	clearAuthor: () => void
	referenceInput: () => void
	referenceFocus: (event: FocusEvent) => void
	referenceBlur: (event: FocusEvent) => void
	referenceKeydown: (event: KeyboardEvent) => void
	referenceSuggestionsBlur: (event: FocusEvent) => void
	referencePanelKeydown: (event: KeyboardEvent) => void
	selectReference: (reference: QuoteReference) => void
	createReference: () => void
	clearReference: () => void
}

const props = defineProps<{
	selectedAuthor: Author | null
	selectedReference: QuoteReference | null
	authorQuery: string
	referenceQuery: string
	authorSuggestions: Author[]
	referenceSuggestions: QuoteReference[]
	showAuthorSuggestions: boolean
	showReferenceSuggestions: boolean
	selectedAuthorIndex: number
	selectedReferenceIndex: number
	disabled: boolean
	hasAttribution: boolean
	inputRefs: FieldRefs
	suggestionRefs: SuggestionRefs
	handlers: Handlers
}>()

const emit = defineEmits<{
	(e: 'update:authorQuery', value: string): void
	(e: 'update:referenceQuery', value: string): void
}>()

const authorSuggestionsHeight = ref('0px')
const referenceSuggestionsHeight = ref('0px')

watch(() => [props.showAuthorSuggestions, props.authorSuggestions, props.authorQuery] as const, async ([visible]) => {
	if (!visible) return
	await nextTick()
	const panel = props.suggestionRefs.author.value
	if (panel) authorSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

watch(() => [props.showReferenceSuggestions, props.referenceSuggestions, props.referenceQuery] as const, async ([visible]) => {
	if (!visible) return
	await nextTick()
	const panel = props.suggestionRefs.reference.value
	if (panel) referenceSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

const collapseSuggestionPanel = (element: Element, done: () => void) => {
	const panel = element as HTMLElement
	panel.style.height = `${panel.getBoundingClientRect().height}px`
	panel.style.marginTop = getComputedStyle(panel).marginTop
	requestAnimationFrame(() => {
		panel.style.height = '0px'
		panel.style.marginTop = '0px'
	})
	panel.addEventListener('transitionend', done, { once: true })
}
</script>
