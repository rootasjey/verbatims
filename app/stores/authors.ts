import { defineStore } from 'pinia'
import { StorageSerializers, useSessionStorage } from '@vueuse/core'

const AUTHORS_SNAPSHOT_STORAGE_KEY = 'verbatims.authors.snapshot'
const AUTHORS_RESTORE_STORAGE_KEY = 'verbatims.authors.should-restore'

export interface AuthorsListSnapshot {
  authors: Author[]
  allFetchedAuthors: Author[]
  currentPage: number
  hasMore: boolean
  totalAuthors: number
  searchQuery: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  scrollY: number
}

export const useAuthorsListStore = defineStore('authorsList', () => {
  const snapshot = useSessionStorage<AuthorsListSnapshot | null>(AUTHORS_SNAPSHOT_STORAGE_KEY, null, {
    serializer: StorageSerializers.object,
  })
  const shouldRestore = useSessionStorage<boolean>(AUTHORS_RESTORE_STORAGE_KEY, false, {
    serializer: StorageSerializers.boolean,
  })

  function saveSnapshot(nextSnapshot: AuthorsListSnapshot) {
    snapshot.value = {
      ...nextSnapshot,
      authors: [...nextSnapshot.authors],
      allFetchedAuthors: [...nextSnapshot.allFetchedAuthors]
    }
  }

  function requestRestore() {
    shouldRestore.value = true
  }

  function clearRestoreRequest() {
    shouldRestore.value = false
  }

  function consumeRestoreRequest() {
    const restore = shouldRestore.value
    shouldRestore.value = false
    return restore
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
    consumeRestoreRequest,
    clearSnapshot
  }
})