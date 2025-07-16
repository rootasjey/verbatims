<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Quote Moderation
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Review and moderate submitted quotes
        </p>
      </div>
      <UButton
        variant="ghost"
        icon
        label="i-ph-arrow-left"
        to="/admin"
      >
        Back to Admin
      </UButton>
    </div>

    <!-- Filters and Search -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search quotes, authors, or users..."
            icon
            label="i-ph-magnifying-glass"
            @input="debouncedSearch"
          />
        </div>
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          @change="loadQuotes"
        />
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedQuotes.length > 0" class="mb-6">
      <UCard>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ selectedQuotes.length }} quotes selected
          </span>
          <div class="flex items-center gap-3">
            <UButton
              size="sm"
              icon
              label="i-ph-check"
              :loading="bulkProcessing"
              @click="bulkApprove"
            >
              Approve Selected
            </UButton>
            <UButton
              size="sm"
              color="red"
              icon
              label="i-ph-x"
              :loading="bulkProcessing"
              @click="showBulkRejectModal = true"
            >
              Reject Selected
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              @click="clearSelection"
            >
              Clear Selection
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <UCard>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </UCard>
      </div>
    </div>

    <!-- Quotes List -->
    <div v-else-if="quotes.length > 0" class="space-y-6">
      <UCard
        v-for="quote in quotes"
        :key="quote.id"
        :class="{ 'ring-2 ring-primary-500': selectedQuotes.includes(quote.id) }"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-3">
              <UCheckbox
                :model-value="selectedQuotes.includes(quote.id)"
                @update:model-value="toggleQuoteSelection(quote.id)"
              />
              <div class="flex-1">
                <blockquote class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  "{{ quote.name }}"
                </blockquote>
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="quote.author_name">{{ quote.author_name }}</span>
                  <span v-if="quote.reference_name">{{ quote.reference_name }}</span>
                  <span>{{ formatDate(quote.created_at) }}</span>
                </div>
              </div>
            </div>
            <UBadge :color="getStatusColor(quote.status)" variant="subtle">
              {{ quote.status }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Submitter Info -->
          <div class="flex items-center space-x-3">
            <UAvatar
              :src="quote.user_avatar"
              :alt="quote.user_name"
              size="sm"
              :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
            />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ quote.user_name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ quote.user_email }}
              </p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="quote.tags && quote.tags.length > 0" class="flex flex-wrap gap-2">
            <UBadge
              v-for="tag in quote.tags"
              :key="tag.name"
              :style="{ backgroundColor: tag.color }"
              variant="soft"
              size="xs"
            >
              {{ tag.name }}
            </UBadge>
          </div>

          <!-- Rejection Reason -->
          <div v-if="quote.status === 'rejected' && quote.rejection_reason" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="text-sm text-red-800 dark:text-red-200">
              <strong>Rejection Reason:</strong> {{ quote.rejection_reason }}
            </p>
            <p v-if="quote.moderator_name" class="text-xs text-red-600 dark:text-red-400 mt-1">
              Rejected by {{ quote.moderator_name }} on {{ formatDate(quote.moderated_at) }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <UButton
                size="sm"
                icon
                label="i-ph-eye"
                variant="ghost"
                @click="viewQuote(quote)"
              >
                View Details
              </UButton>
              <UButton
                size="sm"
                icon
                label="i-ph-pencil"
                variant="ghost"
                @click="editQuote(quote)"
              >
                Edit
              </UButton>
            </div>
            
            <div v-if="quote.status === 'draft'" class="flex items-center gap-3">
              <UButton
                size="sm"
                icon
                label="i-ph-check"
                :loading="processing.has(quote.id)"
                @click="approveQuote(quote)"
              >
                Approve
              </UButton>
              <UButton
                size="sm"
                color="red"
                icon
                label="i-ph-x"
                :loading="processing.has(quote.id)"
                @click="rejectQuote(quote)"
              >
                Reject
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-check-circle" class="h-16 w-16 text-green-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        All caught up!
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        {{ searchQuery ? 'No quotes match your search' : 'No pending quotes to review' }}
      </p>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-8">
      <UButton
        variant="outline"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load More Quotes
      </UButton>
    </div>

    <!-- Reject Quote Modal -->
    <UDialog v-model:open="showRejectModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Reject Quote</h3>
        </template>

        <div class="space-y-4">
          <div v-if="selectedQuote" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <blockquote class="text-sm font-medium text-gray-900 dark:text-white">
              "{{ selectedQuote.name }}"
            </blockquote>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              by {{ selectedQuote.user_name }}
            </p>
          </div>

          <UFormGroup label="Rejection Reason" required>
            <UInput
              type="textarea"
              v-model="rejectionReason"
              placeholder="Please provide a reason for rejecting this quote..."
              :rows="3"
              :disabled="processing.has(selectedQuote?.id)"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="showRejectModal = false"
              :disabled="processing.has(selectedQuote?.id)"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="processing.has(selectedQuote?.id)"
              @click="confirmRejectQuote"
            >
              Reject Quote
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Bulk Reject Modal -->
    <UDialog v-model:open="showBulkRejectModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Reject {{ selectedQuotes.length }} Quotes</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            You are about to reject {{ selectedQuotes.length }} quotes. This action cannot be undone.
          </p>

          <UFormGroup label="Rejection Reason" required>
            <UInput
              type="textarea"
              v-model="bulkRejectionReason"
              placeholder="Please provide a reason for rejecting these quotes..."
              :rows="3"
              :disabled="bulkProcessing"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="showBulkRejectModal = false"
              :disabled="bulkProcessing"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="bulkProcessing"
              @click="confirmBulkReject"
            >
              Reject All
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup>
// Require admin authentication
definePageMeta({
  middleware: 'admin'
})

// SEO
useHead({
  title: 'Quote Moderation - Admin - Verbatims'
})

// Data
const quotes = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const bulkProcessing = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const searchQuery = ref('')
const statusFilter = ref('draft')
const selectedQuotes = ref([])
const processing = ref(new Set())

// Modals
const showRejectModal = ref(false)
const showBulkRejectModal = ref(false)
const selectedQuote = ref(null)
const rejectionReason = ref('')
const bulkRejectionReason = ref('')

// Options
const statusOptions = [
  { label: 'Pending Review', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

// Load quotes
const loadQuotes = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
      selectedQuotes.value = []
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      limit: 20,
      status: statusFilter.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch('/api/admin/quotes/pending', { query: params })
    
    if (reset) {
      quotes.value = response.data
    } else {
      quotes.value.push(...response.data)
    }
    
    hasMore.value = response.pagination.hasMore
  } catch (error) {
    console.error('Failed to load quotes:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  loadQuotes()
}, 300)

// Load more quotes
const loadMore = () => {
  currentPage.value++
  loadQuotes(false)
}

// Quote selection
const toggleQuoteSelection = (quoteId) => {
  const index = selectedQuotes.value.indexOf(quoteId)
  if (index > -1) {
    selectedQuotes.value.splice(index, 1)
  } else {
    selectedQuotes.value.push(quoteId)
  }
}

const clearSelection = () => {
  selectedQuotes.value = []
}

// Individual quote actions
const approveQuote = async (quote) => {
  try {
    processing.value.add(quote.id)
    await $fetch(`/api/admin/quotes/${quote.id}/moderate`, {
      method: 'POST',
      body: { action: 'approve' }
    })
    
    // Remove from list if filtering by draft
    if (statusFilter.value === 'draft') {
      quotes.value = quotes.value.filter(q => q.id !== quote.id)
    } else {
      // Update status in place
      const index = quotes.value.findIndex(q => q.id === quote.id)
      if (index !== -1) {
        quotes.value[index].status = 'approved'
      }
    }
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to approve quote:', error)
    // TODO: Show error toast
  } finally {
    processing.value.delete(quote.id)
  }
}

const rejectQuote = (quote) => {
  selectedQuote.value = quote
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmRejectQuote = async () => {
  if (!selectedQuote.value || !rejectionReason.value.trim()) return

  try {
    processing.value.add(selectedQuote.value.id)
    const response = await $fetch(`/api/admin/quotes/${selectedQuote.value.id}/moderate`, {
      method: 'POST',
      body: {
        action: 'reject',
        rejection_reason: rejectionReason.value.trim()
      }
    })

    onQuoteRejected(response.data)
    showRejectModal.value = false
    rejectionReason.value = ''

    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to reject quote:', error)
    // TODO: Show error toast
  } finally {
    processing.value.delete(selectedQuote.value.id)
  }
}

// Bulk actions
const bulkApprove = async () => {
  if (selectedQuotes.value.length === 0) return
  
  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: {
        quote_ids: selectedQuotes.value,
        action: 'approve'
      }
    })
    
    // Remove approved quotes from list if filtering by draft
    if (statusFilter.value === 'draft') {
      quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
    }
    
    selectedQuotes.value = []
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to bulk approve quotes:', error)
    // TODO: Show error toast
  } finally {
    bulkProcessing.value = false
  }
}

const confirmBulkReject = async () => {
  if (selectedQuotes.value.length === 0 || !bulkRejectionReason.value.trim()) return

  try {
    bulkProcessing.value = true
    await $fetch('/api/admin/quotes/bulk-moderate', {
      method: 'POST',
      body: {
        quote_ids: selectedQuotes.value,
        action: 'reject',
        rejection_reason: bulkRejectionReason.value.trim()
      }
    })

    onBulkRejected()
    showBulkRejectModal.value = false
    bulkRejectionReason.value = ''

    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to bulk reject quotes:', error)
    // TODO: Show error toast
  } finally {
    bulkProcessing.value = false
  }
}

// Event handlers
const onQuoteRejected = (rejectedQuote) => {
  if (statusFilter.value === 'draft') {
    quotes.value = quotes.value.filter(q => q.id !== rejectedQuote.id)
  } else {
    const index = quotes.value.findIndex(q => q.id === rejectedQuote.id)
    if (index !== -1) {
      quotes.value[index] = rejectedQuote
    }
  }
}

const onBulkRejected = () => {
  if (statusFilter.value === 'draft') {
    quotes.value = quotes.value.filter(q => !selectedQuotes.value.includes(q.id))
  }
  selectedQuotes.value = []
}

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    default: return 'yellow'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const viewQuote = (quote) => {
  // TODO: Open quote detail modal
}

const editQuote = (quote) => {
  // TODO: Open quote edit modal
}

// Load initial data
onMounted(() => {
  loadQuotes()
})

// Watch for status filter changes
watch(statusFilter, () => {
  loadQuotes()
})
</script>
