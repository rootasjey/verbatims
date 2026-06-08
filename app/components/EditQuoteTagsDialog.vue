<template>
  <AppDialog
    v-model="isOpen"
    title="Edit Tags"
    hide-footer
    @close="closeDialog"
  >
    <div class="space-y-6">
      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Add Tag</label>

        <div class="flex gap-2">
          <div ref="suggestionAreaRef" class="flex-1 relative">
            <NInput
              ref="tagInputRef"
              v-model="tagQuery"
              placeholder="Type to search or create a tag…"
              :disabled="submitting"
              class="bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ inputTrailingWrapper: 'pr-1.5' }"
              @input="searchTags"
              @focus="handleInputFocus"
              @keydown="handleKeydown"
            >
              <template #trailing>
                <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Search</NBadge>
              </template>
            </NInput>
            <div
              v-if="showSuggestions && (safeSuggestions.length > 0 || tagQuery)"
              ref="suggestionsRef"
              class="mt-2 flex flex-wrap gap-2"
              tabindex="-1"
              @keydown="handleKeydown"
            >
              <div
                v-for="(tag, index) in safeSuggestions"
                :key="tag.id"
                :class="[
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer border',
                  selectedIndex === index
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="addExistingTag(tag)"
                @mouseenter="selectedIndex = index"
              >
                <span class="inline-block w-3 h-3 rounded" :style="{ backgroundColor: tag.color }" />
                <span class="text-sm">#{{ tag.name }}</span>
                <NTooltip v-if="tag.reason === 'popular'" content="Popular tag" :_tooltip-content="{ side: 'top', sideOffset: 4 }">
                  <NIcon name="i-ph-shooting-star" class="w-4 h-4 text-yellow-500" />
                </NTooltip>
                <NTooltip v-else-if="tag.reason === 'keyword'" content="Keyword match" :_tooltip-content="{ side: 'top', sideOffset: 4 }">
                  <NIcon name="i-ph-stack-simple-duotone" class="w-4 h-4 text-green-500" />
                </NTooltip>
              </div>
              <div
                v-if="tagQuery && !safeSuggestions.some(s => s.name.toLowerCase() === tagQuery.toLowerCase())"
                :class="[
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer border',
                  selectedIndex === safeSuggestions.length
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="createAndAddTag()"
                @mouseenter="selectedIndex = safeSuggestions.length"
              >
                <span class="text-sm font-medium text-blue-600 dark:text-blue-400">Create "{{ tagQuery }}"</span>
                <span class="inline-block w-3 h-3 rounded" :style="{ backgroundColor: defaultColor }" />
              </div>
            </div>
          </div>
          <NButton
            btn="soft-blue"
            size="sm"
            label="i-ph-check"
            icon
            :disabled="!tagQuery.trim() || submitting"
            @click="quickAddOrCreate"
          />
        </div>

        <div class="mt-2 flex items-center gap-2">
          <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Current Tags</label>
        <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
        <div v-else>
          <div v-if="safeQuoteTags.length" class="flex flex-wrap gap-2">
            <div
              v-for="t in safeQuoteTags"
              :key="t.id"
              class="inline-flex items-center gap-1"
            >
              <NBadge
                badge="solid"
                size="sm"
                rounded="2"
                class="pl-4"
                :style="{ backgroundColor: t.color + '22', color: t.color }">
                <span class="text-sm">{{ t.name }}</span>
                <NButton
                  rounded="full"
                  size="2"
                  btn="ghost-gray"
                  icon
                  class="p-0 m-0 min-w-0 min-h-0"
                  label="i-ph-x"
                  :aria-label="`Remove ${t.name}`"
                  @click="removeTag(t)"
                />
              </NBadge>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">No tags yet.</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <NButton btn="link-gray" @click="closeDialog" :disabled="submitting">Close</NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  quoteId: number
  quoteText?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'tags-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const loading = ref(true)
const submitting = ref(false)
const error = ref('')

type TagLite = Pick<Tag, 'id' | 'name' | 'color'> & Partial<{ reason: 'popular' | 'keyword' }>

const quoteTags = ref<TagLite[]>([])
const safeQuoteTags = computed(() => Array.isArray(quoteTags.value) ? quoteTags.value : [])

const tagQuery = ref('')
const tagSuggestions = ref<TagLite[]>([])
const safeSuggestions = computed(() => Array.isArray(tagSuggestions.value) ? tagSuggestions.value : [])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

const tagInputRef = ref()
const suggestionsRef = ref()
const suggestionAreaRef = ref<HTMLElement | null>(null)

const defaultColor = '#687FE5'
const FEW_TAGS_THRESHOLD = 2
const SUGGESTION_LIMIT = 5
const MIN_QUERY_LENGTH = 2

const parseTagsPayload = (res: any): TagLite[] => {
  const raw = res && (res.data || res.results) || []
  return Array.isArray(raw) ? raw : []
}

const filterOutExistingTags = (tags: TagLite[]): TagLite[] => {
  const existingIds = new Set(safeQuoteTags.value.map(tag => tag.id))
  return tags.filter(tag => !existingIds.has(tag.id))
}

const dedupeTags = (tags: TagLite[]): TagLite[] => {
  const seen = new Set<number>()
  const result: TagLite[] = []
  for (const tag of tags) {
    if (seen.has(tag.id)) continue
    seen.add(tag.id)
    result.push(tag)
    if (result.length >= SUGGESTION_LIMIT) break
  }
  return result
}

const fetchTags = async (query: Record<string, string | number>) => {
  const res: any = await $fetch('/api/tags', { query })
  return parseTagsPayload(res)
}

const loadInitialSuggestions = async () => {
  if (safeQuoteTags.value.length > FEW_TAGS_THRESHOLD) {
    tagSuggestions.value = []
    return
  }

  try {
    const res: any = await $fetch('/api/tags/suggest' as string, {
      method: 'POST',
      body: {
        quoteText: props.quoteText || '',
        quoteId: props.quoteId,
        limit: SUGGESTION_LIMIT
      }
    })

    const suggested = parseTagsPayload(res)
    tagSuggestions.value = dedupeTags(filterOutExistingTags(suggested))
  } catch (error) {
    try {
      const popular = await fetchTags({
        limit: SUGGESTION_LIMIT,
        sort_by: 'quotes_count',
        sort_order: 'DESC'
      })
      tagSuggestions.value = dedupeTags(filterOutExistingTags(popular))
    } catch {
      tagSuggestions.value = []
    }
  }
}

const loadQuoteTags = async () => {
  loading.value = true
  try {
    const res: any = await $fetch(`/api/quotes/${props.quoteId}/tags`)
    const payload = res?.data?.results ?? res?.results ?? res?.data ?? []
    quoteTags.value = Array.isArray(payload) ? payload : []
  } catch (e) {
    console.error('Failed to load quote tags', e)
  } finally {
    loading.value = false
  }
}

const searchTags = useDebounceFn(async () => {
  const query = tagQuery.value.trim()

  if (!query || query.length < MIN_QUERY_LENGTH) {
    await loadInitialSuggestions()
    return
  }

  try {
    const results = await fetchTags({ search: query, limit: SUGGESTION_LIMIT })
    tagSuggestions.value = dedupeTags(filterOutExistingTags(results))
  } catch (e) {
    tagSuggestions.value = []
  }
}, 250)

const handleInputFocus = async () => {
  showSuggestions.value = true
  selectedIndex.value = -1

  if (tagQuery.value.trim()) {
    searchTags()
    return
  }

  await loadInitialSuggestions()
}

const scrollToSelected = () => {
  nextTick(() => {
    if (selectedIndex.value >= 0 && suggestionsRef.value) {
      const items = suggestionsRef.value.children
      const el = items[selectedIndex.value]
      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value) return
  const suggestionsArray = Array.isArray(tagSuggestions.value) ? tagSuggestions.value : []
  const total = suggestionsArray.length + (tagQuery.value && !suggestionsArray.some(s => s.name.toLowerCase() === tagQuery.value.toLowerCase()) ? 1 : 0)
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value < total - 1 ? selectedIndex.value + 1 : 0
      scrollToSelected()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : total - 1
      scrollToSelected()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        if (selectedIndex.value < suggestionsArray.length) addExistingTag(suggestionsArray[selectedIndex.value])
        else createAndAddTag()
      }
      break
    case 'Escape':
      event.preventDefault()
      showSuggestions.value = false
      selectedIndex.value = -1
      tagInputRef.value?.$el?.focus()
      break
  }
}

const addExistingTag = async (tag: Pick<Tag, 'id' | 'name' | 'color'>) => {
  if (!tag) return
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`/api/quotes/${props.quoteId}/tags`, {
      method: 'POST',
      body: { tagId: tag.id }
    })
    if (!Array.isArray(quoteTags.value)) {
      quoteTags.value = [tag]
    } else if (!quoteTags.value.some(t => t.id === tag.id)) {
      quoteTags.value.push(tag)
    }
    emit('tags-updated')
    tagQuery.value = ''
    await loadInitialSuggestions()
  } catch (e: any) {
    console.error('Failed to add tag', e)
    error.value = e?.statusMessage || 'Failed to add tag'
  } finally {
    submitting.value = false
  }
}

const createAndAddTag = async () => {
  const name = tagQuery.value.trim()
  if (!name) return
  submitting.value = true
  error.value = ''
  try {
    const res: any = await $fetch(`/api/quotes/${props.quoteId}/tags`, {
      method: 'POST',
      body: { name, color: defaultColor }
    })
    const tag = (res && res.data) as any
    if (tag && typeof tag.id === 'number') {
      if (!Array.isArray(quoteTags.value)) {
        quoteTags.value = [{ id: tag.id, name: tag.name, color: tag.color }]
      } else if (!quoteTags.value.some(t => t.id === tag.id)) {
        quoteTags.value.push({ id: tag.id, name: tag.name, color: tag.color })
      }
    }
    emit('tags-updated')
    tagQuery.value = ''
    await loadInitialSuggestions()
  } catch (e: any) {
    console.error('Failed to create/add tag', e)
    error.value = e?.statusMessage || 'Failed to create tag'
  } finally {
    submitting.value = false
  }
}

const quickAddOrCreate = () => {
  const suggestionsArray2 = Array.isArray(tagSuggestions.value) ? tagSuggestions.value : []
  const exact = suggestionsArray2.find(s => s.name.toLowerCase() === tagQuery.value.trim().toLowerCase())
  if (exact) addExistingTag(exact)
  else createAndAddTag()
}

const removeTag = async (tag: Pick<Tag, 'id' | 'name' | 'color'>) => {
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`/api/quotes/${props.quoteId}/tags/${tag.id}`, { method: 'DELETE' })
    if (Array.isArray(quoteTags.value)) {
      quoteTags.value = quoteTags.value.filter(t => t.id !== tag.id)
    } else {
      quoteTags.value = []
    }
    emit('tags-updated')

    if (safeQuoteTags.value.length <= FEW_TAGS_THRESHOLD) {
      await loadInitialSuggestions()
      showSuggestions.value = !!tagSuggestions.value.length
    }
  } catch (e: any) {
    console.error('Failed to remove tag', e)
    error.value = e?.statusMessage || 'Failed to remove tag'
  } finally {
    submitting.value = false
  }
}

const closeDialog = () => {
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    showSuggestions.value = false
    selectedIndex.value = -1
    return
  }

  void (async () => {
    await loadQuoteTags()
    await loadInitialSuggestions()
    showSuggestions.value = safeSuggestions.value.length > 0 || !!tagQuery.value.trim()
  })()
})

onMounted(() => {
  if (isOpen.value) {
    void (async () => {
      await loadQuoteTags()
      await loadInitialSuggestions()
      showSuggestions.value = safeSuggestions.value.length > 0 || !!tagQuery.value.trim()
    })()
  }
  document.addEventListener('click', onGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onGlobalClick)
})

const onGlobalClick = (event: Event) => {
  if (!isOpen.value) return

  const target = event.target as HTMLElement
  if (suggestionAreaRef.value?.contains(target)) return

  if (showSuggestions.value) {
    showSuggestions.value = false
    selectedIndex.value = -1
  }
}
</script>
