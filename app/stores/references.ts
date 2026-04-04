import { defineStore } from 'pinia'
import { StorageSerializers, useSessionStorage } from '@vueuse/core'

const REFERENCES_SNAPSHOT_STORAGE_KEY = 'verbatims.references.snapshot'
const REFERENCES_RESTORE_STORAGE_KEY = 'verbatims.references.should-restore'

export interface ReferencesListSnapshot {
  references: QuoteReferenceWithMetadata[]
  allFetchedReferences: QuoteReferenceWithMetadata[]
  currentPage: number
  hasMore: boolean
  totalReferences: number
  searchQuery: string
  primaryType: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  scrollY: number
}

export const useReferencesListStore = defineStore('referencesList', () => {
  const snapshot = useSessionStorage<ReferencesListSnapshot | null>(REFERENCES_SNAPSHOT_STORAGE_KEY, null, {
    serializer: StorageSerializers.object,
  })
  const shouldRestore = useSessionStorage<boolean>(REFERENCES_RESTORE_STORAGE_KEY, false, {
    serializer: StorageSerializers.boolean,
  })

  function saveSnapshot(nextSnapshot: ReferencesListSnapshot) {
    snapshot.value = {
      ...nextSnapshot,
      references: [...nextSnapshot.references],
      allFetchedReferences: [...nextSnapshot.allFetchedReferences]
    }
  }

  function requestRestore() {
    shouldRestore.value = true
  }

  function clearRestoreRequest() {
    shouldRestore.value = false
  }

  function clearSnapshot() {
    snapshot.value = null
  }

  return {
    snapshot,
    shouldRestore,
    saveSnapshot,
    requestRestore,
    clearRestoreRequest,
    clearSnapshot
  }
})