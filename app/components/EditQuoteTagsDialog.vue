<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.edit_tags') as string"
    :una="{ dialogContent: 'transition-[width,height] duration-300 ease-out motion-reduce:transition-none' }"
    hide-footer
    @close="closeDialog"
  >
    <div
      :style="dialogBodyHeight === null ? undefined : { height: `${dialogBodyHeight}px` }"
      class="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
    >
      <div ref="dialogBodyContentRef" class="space-y-6">
      <div>
        <label for="quote-tag-search" class="mb-1.5 block font-sans text-sm font-600 text-stone-800 dark:text-stone-100">
          {{ $t('components.dialogs.add_tag_label') }}
        </label>
        <p id="quote-tag-search-hint" class="mb-3 font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {{ $t('components.dialogs.tag_add_hint') }}
        </p>

        <div class="flex flex-col gap-2 sm:flex-row">
          <div ref="suggestionAreaRef" class="flex-1 relative">
            <NInput
              ref="tagInputRef"
              id="quote-tag-search"
              v-model="tagQuery"
              :placeholder="$t('components.dialogs.tag_search') as string"
              :disabled="submitting"
              role="combobox"
              aria-autocomplete="list"
              :aria-describedby="error ? 'quote-tag-search-hint quote-tag-search-error' : 'quote-tag-search-hint'"
              :aria-controls="showSuggestionList ? 'quote-tag-suggestions' : undefined"
              :aria-expanded="showSuggestionList"
              :aria-activedescendant="activeSuggestionId"
              class="h-10 min-w-0 bg-[#F7F5EF] shadow-none dark:bg-[#0C0A09]"
              :una="{ input: 'border-stone-300 text-stone-900 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:border-stone-400 dark:border-stone-700 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus-visible:ring-stone-500/60 dark:focus-visible:border-stone-500' }"
              @input="handleTagInput"
              @focus="handleInputFocus"
              @keydown="handleKeydown"
            />
            <div
              v-if="showSuggestionList"
              id="quote-tag-suggestions"
              ref="suggestionsRef"
              role="listbox"
              :aria-label="String($t('components.dialogs.tag_suggestions'))"
              class="mt-2 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-[#F7F5EF] p-1.5 shadow-sm dark:border-stone-700 dark:bg-[#171513]"
            >
              <button
                type="button"
                v-for="(tag, index) in safeSuggestions"
                :key="tag.id"
                :id="tagSuggestionId(index)"
                role="option"
                :aria-selected="selectedIndex === index"
                :tabindex="-1"
                :class="[
                  'flex min-h-10 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/70 dark:focus-visible:ring-stone-500/70',
                  selectedIndex === index
                    ? 'border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-white/[0.08]'
                    : 'border-transparent hover:bg-stone-100/80 dark:hover:bg-white/[0.05]'
                ]"
                @mousedown.prevent
                @click="addExistingTag(tag)"
                @mouseenter="selectedIndex = index"
              >
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color }" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate text-sm font-500 text-stone-800 dark:text-stone-100">{{ tag.name }}</span>
                <NBadge v-if="tag.reason" size="xs" badge="soft-gray" class="shrink-0">
                  {{ $t(tag.reason === 'popular' ? 'components.dialogs.tag_popular' : 'components.dialogs.tag_keyword') }}
                </NBadge>
              </button>
            </div>
          </div>
          <NButton
            btn="solid-black"
            size="sm"
            :disabled="!tagQuery.trim() || submitting"
            :loading="submitting"
            class="min-h-10 shrink-0 px-4"
            @click="quickAddOrCreate"
          >
            <NIcon name="i-ph-plus" class="h-4 w-4" aria-hidden="true" />
            {{ $t(exactSuggestion ? 'components.dialogs.tag_add_action' : 'components.dialogs.tag_create_action') }}
          </NButton>
        </div>

        <div v-if="undoableTag" class="mt-2 flex justify-end">
          <NButton
            type="button"
            btn="link-gray"
            size="sm"
            :disabled="submitting"
            @click="undoLastTagRemoval"
          >
            <NIcon name="i-ph-arrow-u-up-left" class="h-4 w-4" aria-hidden="true" />
            {{ $t('components.dialogs.tag_undo_action', { name: undoableTag.name }) }}
            <kbd class="ml-1 rounded border border-stone-300 px-1.5 py-0.5 font-mono text-[11px] leading-none dark:border-stone-600">
              {{ $t('components.dialogs.tag_undo_shortcut') }}
            </kbd>
            <span
              role="timer"
              :aria-label="String($t('components.dialogs.tag_undo_expires', { seconds: undoSecondsRemaining }))"
              class="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600 dark:bg-white/10 dark:text-stone-300"
            >
              {{ $t('components.dialogs.tag_undo_countdown', { seconds: undoSecondsRemaining }) }}
            </span>
          </NButton>
        </div>

        <p v-if="error" id="quote-tag-search-error" role="alert" class="font-sans text-sm leading-relaxed text-red-700 dark:text-red-300">{{ error }}</p>
        <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ statusMessage }}</p>
      </div>

      <div>
        <h3 class="mb-2 font-sans text-sm font-600 text-stone-800 dark:text-stone-100">{{ $t('components.dialogs.tag_current') }}</h3>
        <div v-if="loading" role="status" class="font-sans text-sm text-stone-500 dark:text-stone-400">{{ $t('components.dialogs.tag_loading') }}</div>
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
                  :aria-label="$t('components.dialogs.tag_remove', { name: t.name })"
                  :disabled="submitting"
                  @click="removeTag(t)"
                />
              </NBadge>
            </div>
          </div>
          <div v-else class="font-sans text-sm text-stone-500 dark:text-stone-400">{{ $t('components.dialogs.tag_empty') }}</div>
        </div>
      </div>
    </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <NButton btn="link-gray" @click="closeDialog" :disabled="submitting">{{ $t('common.close') }}</NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
const { $t } = useI18n()

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
const statusMessage = ref('')
const tagRemovalOrder = ref<number[]>([])
const undoTagStack = ref<TagLite[]>([])
const undoSecondsRemaining = ref(0)
const dialogBodyContentRef = ref<HTMLElement | null>(null)
const dialogBodyHeight = ref<number | null>(null)

const tagInputRef = ref()
const suggestionsRef = ref()
const suggestionAreaRef = ref<HTMLElement | null>(null)

const defaultColor = '#687FE5'
const FEW_TAGS_THRESHOLD = 2
const SUGGESTION_LIMIT = 5
const MIN_QUERY_LENGTH = 2
const UNDO_TAG_REMOVAL_DURATION_MS = 5000
const normalizedQuery = computed(() => tagQuery.value.trim().toLowerCase())
const exactSuggestion = computed(() => safeSuggestions.value.find(tag => tag.name.toLowerCase() === normalizedQuery.value))
const showSuggestionList = computed(() => showSuggestions.value && safeSuggestions.value.length > 0)
const tagSuggestionId = (index: number) => `quote-tag-option-${safeSuggestions.value[index]?.id}`

const activeSuggestionId = computed(() => {
  if (!showSuggestionList.value || selectedIndex.value < 0 || selectedIndex.value >= safeSuggestions.value.length) return undefined
  return tagSuggestionId(selectedIndex.value)
})
const undoableTag = computed(() => undoTagStack.value.at(-1))
let undoExpiryTimeout: ReturnType<typeof setTimeout> | undefined
let undoCountdownInterval: ReturnType<typeof setInterval> | undefined
let dialogBodyResizeObserver: ResizeObserver | undefined

const clearUndoHistory = () => {
  if (undoExpiryTimeout) clearTimeout(undoExpiryTimeout)
  if (undoCountdownInterval) clearInterval(undoCountdownInterval)
  undoExpiryTimeout = undefined
  undoCountdownInterval = undefined
  undoTagStack.value = []
  undoSecondsRemaining.value = 0
}

const scheduleUndoExpiry = () => {
  if (undoExpiryTimeout) clearTimeout(undoExpiryTimeout)
  if (undoCountdownInterval) clearInterval(undoCountdownInterval)
  const expiresAt = Date.now() + UNDO_TAG_REMOVAL_DURATION_MS
  undoSecondsRemaining.value = Math.ceil(UNDO_TAG_REMOVAL_DURATION_MS / 1000)
  undoCountdownInterval = setInterval(() => {
    undoSecondsRemaining.value = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  }, 250)
  undoExpiryTimeout = setTimeout(clearUndoHistory, UNDO_TAG_REMOVAL_DURATION_MS)
}

const updateDialogBodyHeight = () => {
  if (!isOpen.value || !dialogBodyContentRef.value) return
  dialogBodyHeight.value = Math.ceil(dialogBodyContentRef.value.getBoundingClientRect().height)
}

const observeDialogBody = () => {
  const content = dialogBodyContentRef.value
  if (!content || !dialogBodyResizeObserver) return
  dialogBodyResizeObserver.disconnect()
  dialogBodyResizeObserver.observe(content)
  updateDialogBodyHeight()
}

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
    const res: any = await $fetch<any, '/api/tags/suggest'>('/api/tags/suggest', {
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
    const quoteTagsPath = `/api/quotes/${props.quoteId}/tags` as '/api/quotes/:id/tags'
    const res: any = await $fetch<any, '/api/quotes/:id/tags'>(quoteTagsPath)
    const payload = res?.data?.results ?? res?.results ?? res?.data ?? []
    quoteTags.value = Array.isArray(payload) ? payload : []
    tagRemovalOrder.value = quoteTags.value.map(tag => tag.id)
  } catch (e) {
    console.error('Failed to load quote tags', e)
  } finally {
    loading.value = false
  }
}

const focusTagInput = () => {
  document.getElementById('quote-tag-search')?.focus()
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

  if (safeSuggestions.value.length) return

  await loadInitialSuggestions()
}

const resetTagSearch = async () => {
  tagQuery.value = ''
  selectedIndex.value = -1
  tagSuggestions.value = filterOutExistingTags(safeSuggestions.value)
  if (!safeSuggestions.value.length) await loadInitialSuggestions()
  showSuggestions.value = safeSuggestions.value.length > 0
}

const handleTagInput = () => {
  showSuggestions.value = true
  selectedIndex.value = -1
  error.value = ''
  searchTags()
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
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z' && !tagQuery.value && undoTagStack.value.length) {
    event.preventDefault()
    undoLastTagRemoval()
    return
  }

  if (event.key === 'Backspace' && !tagQuery.value && tagRemovalOrder.value.length) {
    event.preventDefault()
    while (tagRemovalOrder.value.length) {
      const lastTagId = tagRemovalOrder.value.at(-1)!
      const lastTag = safeQuoteTags.value.find(tag => tag.id === lastTagId)
      if (lastTag) {
        removeTag(lastTag)
        break
      }
      tagRemovalOrder.value.pop()
    }
    return
  }

  if (!showSuggestions.value) return
  const suggestionsArray = Array.isArray(tagSuggestions.value) ? tagSuggestions.value : []
  const total = suggestionsArray.length
  switch (event.key) {
    case 'ArrowDown':
      if (!total) return
      event.preventDefault()
      selectedIndex.value = selectedIndex.value < total - 1 ? selectedIndex.value + 1 : 0
      scrollToSelected()
      break
    case 'ArrowUp':
      if (!total) return
      event.preventDefault()
      selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : total - 1
      scrollToSelected()
      break
    case 'Enter':
      if (selectedIndex.value < 0) {
        if (exactSuggestion.value) {
          event.preventDefault()
          addExistingTag(exactSuggestion.value)
        } else if (normalizedQuery.value) {
          event.preventDefault()
          createAndAddTag()
        }
        return
      }

      event.preventDefault()
      if (suggestionsArray[selectedIndex.value]) addExistingTag(suggestionsArray[selectedIndex.value]!)
      break
    case 'Escape':
      event.preventDefault()
      showSuggestions.value = false
      selectedIndex.value = -1
      focusTagInput()
      break
  }
}

const addExistingTag = async (tag: Pick<Tag, 'id' | 'name' | 'color'>) => {
  if (!tag) return
  submitting.value = true
  error.value = ''
  try {
    const quoteTagsPath = `/api/quotes/${props.quoteId}/tags` as '/api/quotes/:id/tags'
    await $fetch<{ success: boolean }, '/api/quotes/:id/tags'>(quoteTagsPath, {
      method: 'POST',
      body: { tagId: tag.id }
    })
    let added = false
    if (!Array.isArray(quoteTags.value)) {
      quoteTags.value = [tag]
      tagRemovalOrder.value.push(tag.id)
      added = true
    } else if (!quoteTags.value.some(t => t.id === tag.id)) {
      quoteTags.value.push(tag)
      tagRemovalOrder.value.push(tag.id)
      added = true
    }
    if (added) clearUndoHistory()
    statusMessage.value = String($t('components.dialogs.tag_added', { name: tag.name }))
    emit('tags-updated')
    await resetTagSearch()
  } catch (e: any) {
    console.error('Failed to add tag', e)
    error.value = e?.statusMessage || $t('components.dialogs.toast_error')
  } finally {
    submitting.value = false
    await nextTick()
    focusTagInput()
  }
}

const createAndAddTag = async () => {
  const name = tagQuery.value.trim()
  if (!name) return
  submitting.value = true
  error.value = ''
  try {
    const quoteTagsPath = `/api/quotes/${props.quoteId}/tags` as '/api/quotes/:id/tags'
    const res: any = await $fetch<any, '/api/quotes/:id/tags'>(quoteTagsPath, {
      method: 'POST',
      body: { name, color: defaultColor }
    })
    const tag = (res && res.data) as any
    if (tag && typeof tag.id === 'number') {
      let added = false
      if (!Array.isArray(quoteTags.value)) {
        quoteTags.value = [{ id: tag.id, name: tag.name, color: tag.color }]
        tagRemovalOrder.value.push(tag.id)
        added = true
      } else if (!quoteTags.value.some(t => t.id === tag.id)) {
        quoteTags.value.push({ id: tag.id, name: tag.name, color: tag.color })
        tagRemovalOrder.value.push(tag.id)
        added = true
      }
      if (added) clearUndoHistory()
    }
    statusMessage.value = String($t('components.dialogs.tag_added', { name: tag?.name || name }))
    emit('tags-updated')
    await resetTagSearch()
  } catch (e: any) {
    console.error('Failed to create/add tag', e)
    error.value = e?.statusMessage || $t('components.dialogs.toast_error')
  } finally {
    submitting.value = false
    await nextTick()
    focusTagInput()
  }
}

const quickAddOrCreate = () => {
  if (exactSuggestion.value) addExistingTag(exactSuggestion.value)
  else createAndAddTag()
}

const removeTag = async (tag: Pick<Tag, 'id' | 'name' | 'color'>) => {
  submitting.value = true
  error.value = ''
  try {
    const quoteTagPath = `/api/quotes/${props.quoteId}/tags/${tag.id}` as '/api/quotes/:id/tags/:tagId'
    await $fetch<{ success: boolean }, '/api/quotes/:id/tags/:tagId'>(quoteTagPath, { method: 'DELETE' })
    if (Array.isArray(quoteTags.value)) {
      quoteTags.value = quoteTags.value.filter(t => t.id !== tag.id)
    } else {
      quoteTags.value = []
    }
    tagRemovalOrder.value = tagRemovalOrder.value.filter(id => id !== tag.id)
    undoTagStack.value = undoTagStack.value.filter(removedTag => removedTag.id !== tag.id)
    undoTagStack.value.push({ id: tag.id, name: tag.name, color: tag.color })
    scheduleUndoExpiry()
    statusMessage.value = String($t('components.dialogs.tag_removed', { name: tag.name }))
    emit('tags-updated')

    if (safeQuoteTags.value.length <= FEW_TAGS_THRESHOLD) {
      await loadInitialSuggestions()
      showSuggestions.value = !!tagSuggestions.value.length
    }
  } catch (e: any) {
    console.error('Failed to remove tag', e)
    error.value = e?.statusMessage || $t('components.dialogs.toast_error')
  } finally {
    submitting.value = false
    await nextTick()
    if (isOpen.value) focusTagInput()
  }
}

const undoLastTagRemoval = async () => {
  const tag = undoableTag.value
  if (!tag) return

  submitting.value = true
  error.value = ''
  try {
    const quoteTagsPath = `/api/quotes/${props.quoteId}/tags` as '/api/quotes/:id/tags'
    await $fetch<{ success: boolean }, '/api/quotes/:id/tags'>(quoteTagsPath, {
      method: 'POST',
      body: { tagId: tag.id }
    })
    if (!safeQuoteTags.value.some(currentTag => currentTag.id === tag.id)) {
      quoteTags.value.push(tag)
      tagRemovalOrder.value.push(tag.id)
    }
    undoTagStack.value.pop()
    if (undoTagStack.value.length) scheduleUndoExpiry()
    else clearUndoHistory()
    statusMessage.value = String($t('components.dialogs.tag_restored', { name: tag.name }))
    emit('tags-updated')
    await resetTagSearch()
  } catch (e: any) {
    console.error('Failed to restore tag', e)
    error.value = e?.statusMessage || $t('components.dialogs.toast_error')
  } finally {
    submitting.value = false
    await nextTick()
    focusTagInput()
  }
}

const closeDialog = () => {
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    tagRemovalOrder.value = []
    clearUndoHistory()
    showSuggestions.value = false
    selectedIndex.value = -1
    statusMessage.value = ''
    return
  }

  tagRemovalOrder.value = []
  clearUndoHistory()
  void (async () => {
    await loadQuoteTags()
    await loadInitialSuggestions()
    showSuggestions.value = safeSuggestions.value.length > 0 || !!tagQuery.value.trim()
    await nextTick()
    observeDialogBody()
  })()
})

onMounted(() => {
  dialogBodyResizeObserver = new ResizeObserver(updateDialogBodyHeight)
  observeDialogBody()
  if (isOpen.value) {
    void (async () => {
      await loadQuoteTags()
      await loadInitialSuggestions()
      showSuggestions.value = safeSuggestions.value.length > 0 || !!tagQuery.value.trim()
      await nextTick()
      observeDialogBody()
    })()
  }
  document.addEventListener('click', onGlobalClick)
})

onUnmounted(() => {
  clearUndoHistory()
  dialogBodyResizeObserver?.disconnect()
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
