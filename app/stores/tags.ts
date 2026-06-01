import { defineStore } from 'pinia'
import { StorageSerializers, useSessionStorage } from '@vueuse/core'

const TAGS_SNAPSHOT_STORAGE_KEY = 'verbatims.tags.snapshot'
const TAGS_RESTORE_STORAGE_KEY = 'verbatims.tags.should-restore'

export interface TagsListSnapshot {
  tags: TagListItem[]
  allFetchedTags: TagListItem[]
  currentPage: number
  hasMore: boolean
  totalTags: number
  searchQuery: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  scrollY: number
}

interface TagListItem {
  id: number
  name: string
  description?: string | null
  category?: string | null
  color?: string | null
  created_at?: string
  quotes_count?: number
}

export const useTagsListStore = defineStore('tagsList', () => {
  const snapshot = useSessionStorage<TagsListSnapshot | null>(TAGS_SNAPSHOT_STORAGE_KEY, null, {
    serializer: StorageSerializers.object,
  })
  const shouldRestore = useSessionStorage<boolean>(TAGS_RESTORE_STORAGE_KEY, false, {
    serializer: StorageSerializers.boolean,
  })

  function saveSnapshot(nextSnapshot: TagsListSnapshot) {
    snapshot.value = {
      ...nextSnapshot,
      tags: [...nextSnapshot.tags],
      allFetchedTags: [...nextSnapshot.allFetchedTags]
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
