<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Pending Review
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Your quotes awaiting moderation approval.
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="searchQuery"
          placeholder="Search pending quotes..."
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
      <UIcon name="i-ph-clock" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ searchQuery ? 'No matching pending quotes' : 'No pending quotes' }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes to see them here while they await review.' }}
      </p>
      <UButton v-if="!searchQuery" btn="solid-black" to="/dashboard/my-quotes/drafts">
        <UIcon name="i-ph-file-dashed" />
        <span>View Drafts</span>
      </UButton>
    </div>

    <!-- Quotes List -->
    <div v-else class="space-y-6">
      <!-- Results Count -->
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'quote' : 'quotes' }} pending review
      </div>

      <!-- List -->
      <div class="space-y-4">
        <UCard
          v-for="quote in filteredQuotes"
          :key="quote.id"
          class="hover:shadow-md transition-shadow border-dashed"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3 mb-3">
                <UBadge color="orange" variant="subtle" size="xs">
                  Pending Review
                </UBadge>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Submitted {{ formatDate(quote.created_at) }}
                </span>
                <span v-if="quote.updated_at !== quote.created_at" class="text-xs text-gray-500 dark:text-gray-400">
                  Updated {{ formatDate(quote.updated_at) }}
                </span>
              </div>
              
              <blockquote class="text-lg text-gray-900 dark:text-white mb-3 line-clamp-3">
                "{{ quote.name }}"
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

              <!-- Review Notes -->
              <div v-if="quote.rejection_reason" class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div class="flex items-start space-x-2">
                  <UIcon name="i-ph-note" class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Rejection Reason</p>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{{ quote.rejection_reason }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <UDropdownMenu :items="getQuoteActions(quote)">
                <UButton
                  icon
                  variant="ghost"
                  size="sm"
                  label="i-ph-dots-three-vertical"
                />
              </UDropdownMenu>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="text-center pt-8">
        <UButton
          :loading="loadingMore"
          variant="outline"
          size="lg"
          @click="loadMore"
        >
          Load More
        </UButton>
      </div>
    </div>

    <!-- Withdraw Confirmation -->
    <UDialog v-model="showWithdrawModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Withdraw Submission</h3>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to withdraw this quote from review? It will be moved back to drafts.
        </p>
        
        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="outline" @click="showWithdrawModal = false">
              Cancel
            </UButton>
            <UButton
              color="orange"
              :loading="withdrawing"
              @click="withdrawQuote"
            >
              Withdraw
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Pending Review - Dashboard - Verbatims'
})

const loading = ref(true)
const loadingMore = ref(false)
const withdrawing = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref('recent')
const hasMore = ref(false)
const currentPage = ref(1)

const showWithdrawModal = ref(false)
const selectedQuote = ref<DashboardQuote | null>(null)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]

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

const loadPendingQuotes = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/submissions', {
      query: { page, limit: 20, status: 'pending' }
    })
    
    if (page === 1) {
      quotes.value = response.data || []
    } else {
      quotes.value.push(...(response.data || []))
    }
    
    hasMore.value = response.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load pending quotes:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadPendingQuotes(currentPage.value + 1)
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'View Details',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {}, // Divider
  {
    label: 'Withdraw',
    leading: 'i-ph-arrow-counter-clockwise',
    onclick: () => confirmWithdraw(quote)
  }
]

const viewQuote = (quote: DashboardQuote) => {
  navigateTo(`/quotes/${quote.id}`)
}

const confirmWithdraw = (quote: DashboardQuote) => {
  selectedQuote.value = quote
  showWithdrawModal.value = true
}

const withdrawQuote = async () => {
  if (!selectedQuote.value) return

  withdrawing.value = true
  try {
    await $fetch(`/api/quotes/${selectedQuote.value.id}/withdraw`, {
      method: 'POST'
    } as any)

    // Remove from pending list
    quotes.value = quotes.value.filter(q => q.id !== selectedQuote.value?.id)
    showWithdrawModal.value = false
    selectedQuote.value = null
  } catch (error) {
    console.error('Failed to withdraw quote:', error)
  } finally {
    withdrawing.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadPendingQuotes()
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
