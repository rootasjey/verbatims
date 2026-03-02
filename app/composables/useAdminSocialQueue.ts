import type { SocialPlatform, SocialQueueStatus } from '~~/shared/constants/social'
import { SOCIAL_PLATFORMS } from '~~/shared/constants/social'

export interface SelectOption {
  label: string
  value: string
}

export interface SocialQueueItem {
  id: number
  quote_id: number
  quote_text: string
  author_name: string | null
  reference_name: string | null
  status: SocialQueueStatus
  position: number
  quote_posts_count: number
  last_posted_at: string | null
}

interface SocialQueueResponse {
  success: boolean
  data: SocialQueueItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  stats: {
    queued: number
    processing: number
    posted: number
    failed: number
  }
}

interface PickerQuote {
  id: number
  name: string
  author?: { name?: string }
  reference?: { name?: string }
}

interface RunNowResult {
  success?: boolean
  skipped?: boolean
  reason?: string
  postUrl?: string
}

interface RunNowResponse {
  success: boolean
  data?: RunNowResult
}

interface UseAdminSocialQueueOptions {
  showErrorToast: (title: string, description: string) => void
}

interface PlatformOption {
  label: string
  value: SocialPlatform
}

const platformIcons: Record<SocialPlatform, string> = {
  x: 'i-ph-twitter-logo',
  bluesky: 'i-ph-butterfly',
  instagram: 'i-ph-instagram-logo',
  threads: 'i-ph-threads-logo',
  facebook: 'i-ph-facebook-logo',
  pinterest: 'i-ph-pinterest-logo'
}

const statusOptions: SelectOption[] = [
  { label: 'All statuses', value: '' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Posted', value: 'posted' },
  { label: 'Failed', value: 'failed' }
]

export function useAdminSocialQueue(options: UseAdminSocialQueueOptions) {
  const loading = ref(false)
  const randomAdding = ref(false)
  const runNowLoading = ref(false)
  const pickerLoading = ref(false)
  const pickerLoaded = ref(false)
  const clearingAll = ref(false)
  const clearingFinished = ref(false)

  const queueItems = ref<SocialQueueItem[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalItems = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

  const searchQuery = ref('')
  const selectedStatus = ref<SelectOption>({ label: 'All statuses', value: '' })
  const selectedPlatform = ref<SocialPlatform>('x')
  const platformOptions: PlatformOption[] = SOCIAL_PLATFORMS.map(platform => ({
    label: platformIcons[platform],
    value: platform as SocialPlatform
  }))

  const randomCount = ref('5')
  const pickerSearch = ref('')
  const pickerQuotes = ref<PickerQuote[]>([])

  const stats = ref({
    queued: 0,
    processing: 0,
    posted: 0,
    failed: 0
  })

  async function loadQueue() {
    loading.value = true

    try {
      const response = await $fetch<SocialQueueResponse>('/api/admin/social-queue', {
        query: {
          page: currentPage.value,
          limit: pageSize.value,
          search: searchQuery.value || undefined,
          status: selectedStatus.value.value || undefined,
          platform: selectedPlatform.value
        }
      })

      queueItems.value = response.data || []
      totalItems.value = response.pagination?.total || 0
      stats.value = response.stats || stats.value
    } catch (error) {
      console.error('Failed to load social queue:', error)
      options.showErrorToast('Error', 'Failed to load social queue')
    } finally {
      loading.value = false
    }
  }

  async function addRandomQuotes(count?: number) {
    randomAdding.value = true

    try {
      await $fetch('/api/admin/social-queue/bulk-random', {
        method: 'POST',
        body: {
          count: Number((count ?? randomCount.value) || '5'),
          platform: selectedPlatform.value
        }
      })

      await loadQueue()
    } catch (error) {
      console.error('Failed to add random quotes:', error)
      options.showErrorToast('Error', 'Failed to add random quotes')
    } finally {
      randomAdding.value = false
    }
  }

  async function runNow() {
    runNowLoading.value = true

    try {
      const response = await $fetch<RunNowResponse>('/api/admin/social-queue/run-now', {
        method: 'POST',
        body: {
          platform: selectedPlatform.value
        }
      })

      const result = response?.data

      if (result?.success) {
        useToast().toast({
          title: 'Posted',
          description: result.postUrl ? `Published successfully: ${result.postUrl}` : 'Quote published successfully',
          actions: result.postUrl
            ? [
                {
                  label: 'Open post',
                  btn: 'soft-blue',
                  altText: 'Open social post in a new tab',
                  onClick: () => {
                    if (typeof window !== 'undefined') {
                      window.open(result.postUrl, '_blank', 'noopener,noreferrer')
                    }
                  }
                }
              ]
            : undefined,
          toast: 'outline-success'
        })
      } else if (result?.skipped) {
        useToast().toast({
          title: 'Skipped',
          description: result.reason || 'No item was posted',
          toast: 'outline-warning'
        })
      } else {
        options.showErrorToast('Failed', result?.reason || 'Failed to run autopost now')
      }

      await loadQueue()
    } catch (error) {
      console.error('Failed to run social autopost now:', error)
      options.showErrorToast('Error', 'Failed to run autopost now')
    } finally {
      runNowLoading.value = false
    }
  }

  async function loadQuotePicker() {
    pickerLoading.value = true

    try {
      const response = await $fetch<{ success: boolean, data: PickerQuote[] }>('/api/admin/quotes', {
        query: {
          status: 'approved',
          limit: 10,
          page: 1,
          search: pickerSearch.value || undefined
        }
      })

      pickerQuotes.value = response.data || []
      pickerLoaded.value = true
    } catch (error) {
      console.error('Failed to load quote picker:', error)
      options.showErrorToast('Error', 'Failed to load approved quotes')
    } finally {
      pickerLoading.value = false
    }
  }

  async function addQuoteToQueue(quoteId: number) {
    try {
      await $fetch('/api/admin/social-queue', {
        method: 'POST',
        body: {
          quoteIds: [quoteId],
          platform: selectedPlatform.value
        }
      })

      useToast().toast({
        title: 'Quote added',
        description: 'Quote added to social queue',
        toast: 'outline-success'
      })

      await loadQueue()
    } catch (error) {
      console.error('Failed to add quote:', error)
      options.showErrorToast('Error', 'Failed to add quote to queue')
    }
  }

  async function moveQueueItem(id: number, direction: 'up' | 'down') {
    try {
      await $fetch('/api/admin/social-queue/reorder', {
        method: 'POST',
        body: { id, direction }
      })

      await loadQueue()
    } catch (error) {
      console.error('Failed to reorder queue item:', error)
      options.showErrorToast('Error', 'Failed to reorder queue item')
    }
  }

  async function removeQueueItem(id: number) {
    try {
      await $fetch(`/api/admin/social-queue/${id}`, { method: 'DELETE' })
      await loadQueue()
    } catch (error) {
      console.error('Failed to remove queue item:', error)
      options.showErrorToast('Error', 'Failed to remove queue item')
    }
  }

  async function clearAllQueue() {
    clearingAll.value = true
    try {
      await $fetch('/api/admin/social-queue/clear-all', {
        method: 'POST',
        body: { platform: selectedPlatform.value, confirm: true }
      })
      useToast().toast({
        title: 'Cleared',
        description: 'All queue items removed',
        toast: 'outline-success'
      })
      await loadQueue()
    } catch (error) {
      console.error('Failed to clear queue:', error)
      options.showErrorToast('Error', 'Failed to clear queue')
    } finally {
      clearingAll.value = false
    }
  }

  async function clearFinishedQueue() {
    clearingFinished.value = true
    try {
      await $fetch('/api/admin/social-queue/clear-finished', {
        method: 'POST',
        body: { platform: selectedPlatform.value, confirm: true }
      })
      useToast().toast({
        title: 'Cleared',
        description: 'Finished queue items removed',
        toast: 'outline-success'
      })
      await loadQueue()
    } catch (error) {
      console.error('Failed to clear finished items:', error)
      options.showErrorToast('Error', 'Failed to clear finished items')
    } finally {
      clearingFinished.value = false
    }
  }

  watchDebounced([searchQuery, selectedStatus, selectedPlatform], () => {
    const pageChanged = currentPage.value !== 1
    currentPage.value = 1

    if (!pageChanged) {
      void loadQueue()
    }
  }, {
    debounce: 250,
    immediate: false
  })

  watchDebounced(currentPage, () => {
    void loadQueue()
  }, {
    debounce: 250,
    immediate: false
  })

  return {
    loading,
    randomAdding,
    runNowLoading,
    pickerLoading,
    pickerLoaded,
    clearingAll,
    clearingFinished,
    queueItems,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchQuery,
    selectedStatus,
    statusOptions,
    selectedPlatform,
    platformOptions,
    randomCount,
    pickerSearch,
    pickerQuotes,
    stats,
    loadQueue,
    addRandomQuotes,
    runNow,
    loadQuotePicker,
    addQuoteToQueue,
    moveQueueItem,
    removeQueueItem,
    clearAllQueue,
    clearFinishedQueue
  }
}
