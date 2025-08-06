<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
            Drafts
          </h1>
          <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
            Your unpublished quote drafts.
          </p>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Search your drafts..."
          leading="i-ph-magnifying-glass"
          size="md"
        />
      </div>
      <div class="w-full sm:w-48">
        <USelect
          v-model="sortBy"
          :items="sortOptions"
          placeholder="Sort by"
          size="sm"
          item-key="label"
          value-key="value"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
      <UIcon name="i-ph-file-dashed" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ searchQuery ? 'No matching drafts' : 'No drafts yet' }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Start writing your first quote draft.' }}
      </p>
    </div>

    <!-- Quotes List -->
    <div v-else class="space-y-6">
      <!-- Results Count -->
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'draft' : 'drafts' }}
      </div>

      <!-- List -->
      <div class="space-y-4">
        <div
          v-for="quote in filteredQuotes"
          :key="quote.id"
          class="p-4 border border-dashed rounded-lg hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3 mb-3">
                <UBadge color="yellow" variant="subtle" size="xs">
                  Draft
                </UBadge>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Created {{ formatDate(quote.created_at) }}
                </span>

                <div class="flex items-center space-x-2 ml-4">
                  <UDropdownMenu :items="getQuoteActions(quote)">
                    <UButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                    />
                  </UDropdownMenu>
                </div>
              </div>

              <blockquote class="text-lg text-gray-900 dark:text-white mb-3 line-clamp-3">
                {{ quote.name }}
              </blockquote>
              
              <div class="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                <span v-if="quote.author">
                  <UIcon name="i-ph-user" class="w-4 h-4 inline mr-1" />
                  {{ quote.author.name }}
                </span>
                <span v-if="quote.reference">
                  <UIcon name="i-ph-book" class="w-4 h-4 inline mr-1" />
                  {{ quote.reference.name }}
                </span>
                <span v-if="quote.tags?.length">
                  <UIcon name="i-ph-tag" class="w-4 h-4 inline mr-1" />
                  {{ quote.tags.length }} {{ quote.tags.length === 1 ? 'tag' : 'tags' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="w-full pt-8">
        <UButton
          :loading="loadingMore"
          btn="dark:solid-black"
          size="md"
          class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
          @click="loadMore"
        >
          Load More
        </UButton>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <UDialog v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete Draft</h3>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this draft? This action cannot be undone.
        </p>
        
        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="deleting"
              @click="deleteDraft"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <AddQuoteDialog
      v-model="showEditQuoteDialog"
      :edit-quote="selectedQuote"
      @quote-updated="onQuoteUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

// Use dashboard layout
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// SEO
useHead({
  title: 'Drafts - Dashboard - Verbatims'
})

// Data
const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref('recent')
const hasMore = ref(false)
const currentPage = ref(1)

const showDeleteModal = ref(false)
const showEditQuoteDialog = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)

// Sort options
const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]

// Computed
const filteredQuotes = computed(() => {
  let filtered = [...quotes.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote => 
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query)
    )
  }
  
  // Sort
  switch (sortBy.value) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'author':
      filtered.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default: // recent
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  
  return filtered
})

// Methods
const loadDrafts = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/submissions', {
      query: { page, limit: 20, status: 'draft' }
    })
    
    if (page === 1) {
      quotes.value = response.data || []
    } else {
      quotes.value.push(...(response.data || []))
    }
    
    hasMore.value = response.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load drafts:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadDrafts(currentPage.value + 1)
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {}, // Divider
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    onclick: () => submitQuote(quote)
  },
  {}, // Divider
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(quote)
  }
]

const editQuote = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = null
  // Refresh the quotes list to show updated data
  loadDrafts()
}

const submitQuote = async (quote: DashboardQuote) => {
  const { toast } = useToast()

  try {
    await $fetch(`/api/quotes/${quote.id}/submit`, {
      method: 'POST'
    } as any)

    // Remove from drafts list
    quotes.value = quotes.value.filter(q => q.id !== quote.id)

    toast({
      title: 'Quote submitted successfully!',
      description: 'Your quote is now pending moderation review.'
    })
  } catch (error: any) {
    console.error('Failed to submit quote:', error)
    toast({
      title: 'Failed to submit quote',
      description: error?.data?.message || 'Please try again.'
    })
  }
}

const confirmDelete = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showDeleteModal.value = true
}

const deleteDraft = async () => {
  if (!selectedQuote.value) return

  deleting.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}`, {
      method: 'DELETE'
    } as any)

    // Remove from list
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showDeleteModal.value = false
    selectedQuote.value = null
  } catch (error) {
    console.error('Failed to delete draft:', error)
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadDrafts()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
