<template>
	<UDrawer v-model:open="isOpen" direction="bottom">
		<template #body>
			<div class="p-6 overflow-y-auto">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">
						Add New Quote
					</h2>
					<UButton
						icon
						btn="ghost-gray"
						label="i-ph-x-bold"
						size="sm"
						@click="isOpen = false"
					/>
				</div>

				<form @submit.prevent="submitQuote" class="space-y-6">
					<div>
						<UInput
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

					<div class="grid grid-cols-1 gap-4">
						<!-- Language Selection -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Language
							</label>
							<div>
								<USelect
										v-model="form.language"
										:items="languageOptions"
										placeholder="Select language"
										item-key="label"
										value-key="label"
										:disabled="submitting"
									/>
							</div>
						</div>

						<!-- Author Selection -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Author (Optional)
							</label>
							<div class="relative">
								<UInput
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
								<!-- Selected Author Display -->
								<div v-if="form.selectedAuthor" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
									<div>
										<span class="text-sm font-medium">{{ form.selectedAuthor.name }}</span>
										<span v-if="form.selectedAuthor.job" class="text-xs text-gray-500 ml-2">{{ form.selectedAuthor.job }}</span>
									</div>
									<UButton
										size="xs"
										btn="ghost"
										icon
										label="i-ph-x"
										@click="clearAuthor"
									/>
								</div>
							</div>
						</div>

						<!-- Reference Selection -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Reference (Optional)
							</label>
							<div class="relative">
								<UInput
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
								<!-- Selected Reference Display -->
								<div v-if="form.selectedReference" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
									<div>
										<span class="text-sm font-medium">{{ form.selectedReference.name }}</span>
										<span v-if="form.selectedReference.primary_type" class="text-xs text-gray-500 ml-2 capitalize">{{ form.selectedReference.primary_type.replace('_', ' ') }}</span>
									</div>
									<UButton
										size="xs"
										btn="ghost"
										icon
										label="i-ph-x"
										@click="clearReference"
									/>
								</div>
							</div>
						</div>
					</div>

					<div class="flex space-x-3 pt-4">
						<UButton
							btn="light:soft dark:soft-white"
							@click="isOpen = false"
							:disabled="submitting"
							class="flex-1"
						>
							Cancel
						</UButton>
						<UButton
							btn="soft-blue"
							:loading="submitting"
							type="submit"
							:disabled="!form.content.trim()"
							class="flex-1"
						>
							Save as Draft
						</UButton>
					</div>
				</form>
			</div>
		</template>
	</UDrawer>
</template>

<script lang="ts" setup>
interface Emits {
	(e: 'update:open', value: boolean): void
	(e: 'submitted'): void
}

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<Emits>()

const isOpen = computed({
	get: () => !!props.open,
	set: (val: boolean) => emit('update:open', val)
})

const { user } = useUserSession()

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
} = useQuoteForm()

const onAuthorInput = () => {
	void searchAuthors($fetch, { limit: 10, minLength: 2 })
}

const onReferenceInput = () => {
	void searchReferences($fetch, { limit: 10, minLength: 2 })
}

const submitQuote = async () => {
	if (!form.value.content.trim()) return

	try {
		submitting.value = true
		const payload = {
			name: form.value.content.trim(),
			language: form.value.language.value,
			author_id: form.value.selectedAuthor?.id || null,
			reference_id: form.value.selectedReference?.id || null,
			new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
			new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value, primary_type: 'other' as const } : undefined,
			user_id: user.value?.id,
			status: 'draft'
		}

		await $fetch('/api/quotes', {
			method: 'POST',
			body: payload
		})

		form.value.content = ''
		form.value.selectedAuthor = null
		form.value.selectedReference = null
		authorQuery.value = ''
		referenceQuery.value = ''
		authorSuggestions.value = []
		referenceSuggestions.value = []

		isOpen.value = false

		emit('submitted')
	} catch (error: any) {
		console.error('Error submitting quote:', error)
		useToast().toast({
			title: 'Error',
			duration: 8000,
			description: error?.message || 'Failed to add quote. Please try again.'
		})
	} finally {
		submitting.value = false
	}
}
</script>