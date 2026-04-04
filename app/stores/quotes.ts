import { defineStore } from 'pinia'
import { StorageSerializers, useSessionStorage } from '@vueuse/core'
import type { ProcessedQuoteResult } from '~~/server/types'

const QUOTES_SNAPSHOT_STORAGE_KEY = 'verbatims.quotes.snapshot'
const QUOTES_RESTORE_STORAGE_KEY = 'verbatims.quotes.should-restore'

type SortMode = 'relevance' | 'recent' | 'popular'

export interface QuoteFeedSnapshot {
  sourcePath: string
  searchQuery: string
  selectedSortBy: { label: string; value: string }
  selectedSortOrder: { label: string; value: 'asc' | 'desc' }
  isAsc: boolean
  currentPage: number
  additionalQuotes: ProcessedQuoteResult[]
  lastSuccessfulQuotes: ProcessedQuoteResult[]
  lastSuccessfulMeta: {
    total: number
    page: number
    limit: number
    offset: number
    pageCount: number
    sort: SortMode
    q: string | undefined
    hasMore: boolean
  }
  initialLoading: boolean
  scrollY: number
}

export const useQuotesFeedStore = defineStore('quotesFeed', () => {
  const snapshot = useSessionStorage<QuoteFeedSnapshot | null>(QUOTES_SNAPSHOT_STORAGE_KEY, null, {
    serializer: StorageSerializers.object,
  })
  const shouldRestore = useSessionStorage<boolean>(QUOTES_RESTORE_STORAGE_KEY, false, {
    serializer: StorageSerializers.boolean,
  })
  const restoreSnapshot = ref<QuoteFeedSnapshot | null>(null)

  function saveSnapshot(nextSnapshot: QuoteFeedSnapshot) {
    snapshot.value = {
      ...nextSnapshot,
      additionalQuotes: [...nextSnapshot.additionalQuotes],
      lastSuccessfulQuotes: [...nextSnapshot.lastSuccessfulQuotes],
      lastSuccessfulMeta: { ...nextSnapshot.lastSuccessfulMeta }
    }
  }

  function requestRestore() {
    shouldRestore.value = true
  }

  function stageRestoreSnapshot(nextSnapshot: QuoteFeedSnapshot) {
    restoreSnapshot.value = {
      ...nextSnapshot,
      additionalQuotes: [...nextSnapshot.additionalQuotes],
      lastSuccessfulQuotes: [...nextSnapshot.lastSuccessfulQuotes],
      lastSuccessfulMeta: { ...nextSnapshot.lastSuccessfulMeta }
    }
  }

  function clearRestoreRequest() {
    shouldRestore.value = false
  }

  function clearRestoreSnapshot() {
    restoreSnapshot.value = null
  }

  function clearSnapshot() {
    snapshot.value = null
  }

  return {
    snapshot,
    restoreSnapshot,
    shouldRestore,
    saveSnapshot,
    stageRestoreSnapshot,
    requestRestore,
    clearRestoreRequest,
    clearRestoreSnapshot,
    clearSnapshot
  }
})