<template>
	<UDrawer v-model:open="isOpen" direction="bottom">
		<template #body>
			<div class="p-6">
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
							v-model="quoteForm.content"
							class="text-size-6 font-600 font-subtitle border-dashed
								focus-visible:border-gray-700 ring-transparent light:focus-visible:ring-transparent dark:focus-visible:ring-transparent dark:focus-visible:border-gray-300"
							placeholder="Enter the quote content..."
							:rows="4"
							:disabled="submittingQuote"
							required
						/>
						<!-- Character Counter -->
						<div class="mt-2 text-right">
							<span class="text-xs text-gray-500 dark:text-gray-400">
								{{ quoteForm.content.length }} characters
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
									v-model="quoteForm.language"
									:items="languageOptions"
									placeholder="Select language"
									item-key="label"
									value-key="label"
									:disabled="submittingQuote"
								/>
							</div>
						</div>

						<!-- Author Selection -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Author (Optional)
							</label>
							<div>
								<UInput
									v-model="authorSearchQuery"
									placeholder="Search for an author..."
									:disabled="submittingQuote"
									@input="searchAuthors"
								/>
								<div v-if="authorSearchResults.length > 0" class="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
									<div
										v-for="author in authorSearchResults"
										:key="author.id"
										class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
										@click="selectAuthor(author)"
									>
										<div class="flex items-center space-x-3">
											<img
												v-if="author.image_url"
												:src="author.image_url"
												:alt="author.name"
												class="w-8 h-8 rounded-full object-cover"
											/>
											<div
												v-else
												class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300"
											>
												{{ getAuthorInitials(author.name) }}
											</div>
											<div>
												<p class="text-sm font-medium text-gray-900 dark:text-white">{{ author.name }}</p>
												<p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</p>
											</div>
										</div>
									</div>
								</div>
								<div v-if="quoteForm.selectedAuthor" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<img
												v-if="quoteForm.selectedAuthor.image_url"
												:src="quoteForm.selectedAuthor.image_url"
												:alt="quoteForm.selectedAuthor.name"
												class="w-8 h-8 rounded-full object-cover"
											/>
											<div
												v-else
												class="w-8 h-8 rounded-full bg-blue-300 dark:bg-blue-600 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-200"
											>
												{{ getAuthorInitials(quoteForm.selectedAuthor.name) }}
											</div>
											<div>
												<p class="text-sm font-medium text-blue-900 dark:text-blue-100">{{ quoteForm.selectedAuthor.name }}</p>
												<p v-if="quoteForm.selectedAuthor.job" class="text-xs text-blue-700 dark:text-blue-300">{{ quoteForm.selectedAuthor.job }}</p>
											</div>
										</div>
										<UButton
											icon
											btn="ghost-gray"
											label="i-ph-x-bold"
											size="xs"
											@click="clearAuthor"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="flex space-x-3 pt-4">
						<UButton
							btn="light:soft dark:soft-white"
							@click="isOpen = false"
							:disabled="submittingQuote"
							class="flex-1"
						>
							Cancel
						</UButton>
						<UButton
							btn="soft-blue"
							:loading="submittingQuote"
							type="submit"
							:disabled="!quoteForm.content.trim()"
							class="flex-1"
						>
							Submit Quote
						</UButton>
					</div>
				</form>
			</div>
		</template>
	</UDrawer>
</template>

<script lang="ts" setup>
import type { Author } from '~/types'

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

const submittingQuote = ref(false)
const authorSearchQuery = ref('')
const authorSearchResults = ref<Author[]>([])

const quoteForm = ref({
	content: '',
	language: { label: 'English', value: 'en' },
	selectedAuthor: null as Author | null
})

const languageOptions = [
	{ label: 'English', value: 'en' },
	{ label: 'French', value: 'fr' },
	{ label: 'Spanish', value: 'es' },
	{ label: 'German', value: 'de' },
	{ label: 'Italian', value: 'it' },
	{ label: 'Portuguese', value: 'pt' },
	{ label: 'Japanese', value: 'ja' },
	{ label: 'Korean', value: 'ko' },
	{ label: 'Chinese', value: 'zh' },
	{ label: 'Russian', value: 'ru' },
	{ label: 'Arabic', value: 'ar' },
	{ label: 'Hindi', value: 'hi' }
]

const searchAuthors = async () => {
	if (authorSearchQuery.value.length < 2) {
		authorSearchResults.value = []
		return
	}

	try {
		const response = await $fetch('/api/authors/search', {
			query: {
				q: authorSearchQuery.value,
				limit: 10
			}
		})

		if ((response as any).success) {
			authorSearchResults.value = (response as any).data || []
		}
	} catch (error) {
		console.error('Failed to search authors:', error)
		authorSearchResults.value = []
	}
}

// Select author from search results
const selectAuthor = (author: Author) => {
	quoteForm.value.selectedAuthor = author
	authorSearchQuery.value = ''
	authorSearchResults.value = []
}

const clearAuthor = () => {
	quoteForm.value.selectedAuthor = null
}

// Get author initials for avatar fallback
const getAuthorInitials = (name: string): string => {
	return name
		.split(' ')
		.map(word => word.charAt(0))
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

const submitQuote = async () => {
	if (!quoteForm.value.content.trim()) return

	try {
		submittingQuote.value = true

		const payload = {
			content: quoteForm.value.content.trim(),
			language: (quoteForm.value.language as any).value,
			author_id: quoteForm.value.selectedAuthor?.id || null,
			user_id: user.value?.id,
			status: 'draft' as const
		}

		await $fetch('/api/quotes', {
			method: 'POST',
			body: payload
		})

		// Reset form
		quoteForm.value.content = ''
		quoteForm.value.selectedAuthor = null
		authorSearchQuery.value = ''
		authorSearchResults.value = []

		// Close drawer
		isOpen.value = false

		// Show success message
		useToast().toast({
			toast: 'success',
			title: 'Quote Added',
			description: 'Your quote has been submitted successfully!'
		})

		emit('submitted')
	} catch (error) {
		console.error('Error submitting quote:', error)
		useToast().toast({
			toast: 'error',
			title: 'Error',
			description: 'Failed to add quote. Please try again.'
		})
	} finally {
		submittingQuote.value = false
	}
}
</script>