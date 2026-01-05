<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3 border-b b-dashed border-gray-200 dark:border-gray-700 pb-3">
        <h3 class="font-title uppercase text-size-4 font-600">Edit Tags</h3>
      </div>

      <div class="space-y-6">
        <!-- Add tag input with suggestions -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Add Tag
          </label>

          <div class="flex gap-2">
            <div class="flex-1 relative">
              <NInput
                ref="tagInputRef"
                v-model="tagQuery"
                input="outline-amber"
                placeholder="Type to search or create a tag…"
                :disabled="submitting"
                @input="searchTags"
                @focus="handleInputFocus"
                @blur="handleInputBlur"
                @keydown="handleKeydown"
              />
              <!-- Suggestions -->
              <div
                v-if="showSuggestions && (safeSuggestions.length > 0 || tagQuery)"
                ref="suggestionsRef"
                class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto"
                tabindex="-1"
                @blur="handleSuggestionsBlur"
                @keydown="handleKeydown"
              >
                <div
                  v-for="(tag, index) in safeSuggestions"
                  :key="tag.id"
                  :class="[
                    'px-3 py-2 cursor-pointer flex items-center justify-between',
                    selectedIndex === index
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="addExistingTag(tag)"
                  @mouseenter="selectedIndex = index"
                >
                  <span class="text-sm">#{{ tag.name }}</span>
                  <span class="inline-block w-3 h-3 rounded" :style="{ backgroundColor: tag.color }" />
                </div>
                <div
                  v-if="tagQuery && !safeSuggestions.some(s => s.name.toLowerCase() === tagQuery.toLowerCase())"
                  :class="[
                    'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700 flex items-center justify-between',
                    selectedIndex === safeSuggestions.length
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                  @click="createAndAddTag()"
                  @mouseenter="selectedIndex = safeSuggestions.length"
                >
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">Create new tag: "{{ tagQuery }}"</span>
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

        <!-- Existing tags on the quote -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Current Tags
          </label>
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

        <div class="mt-2 flex justify-end gap-3">
          <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">Close</NButton>
        </div>
      </div>
    </div>
  </NDialog>
  </template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  quoteId: number
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

const quoteTags = ref<Array<Pick<Tag, 'id' | 'name' | 'color'>>>([])
// Template-safe wrapper — always an array
const safeQuoteTags = computed(() => Array.isArray(quoteTags.value) ? quoteTags.value : [])

// Suggestion state
const tagQuery = ref('')
const tagSuggestions = ref<Array<Pick<Tag, 'id' | 'name' | 'color'>>>([])
// Template-safe wrapper — always an array
const safeSuggestions = computed(() => Array.isArray(tagSuggestions.value) ? tagSuggestions.value : [])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

const tagInputRef = ref()
const suggestionsRef = ref()

const defaultColor = '#687FE5'

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
  if (!tagQuery.value.trim() || tagQuery.value.trim().length < 2) {
    tagSuggestions.value = []
    return
  }
  try {
    const res: any = await $fetch('/api/tags', { query: { search: tagQuery.value.trim(), limit: 5 } })
    // Ensure that we always expose an array to the template & logic. Some endpoints
    // return an envelope ({ success: true, data: [] }) while others may vary.
    const raw = res && (res.data || res.results) || []
    tagSuggestions.value = Array.isArray(raw) ? raw : []
  } catch (e) {
    tagSuggestions.value = []
  }
}, 250)

const handleInputFocus = () => {
  showSuggestions.value = true
  selectedIndex.value = -1
}

const handleInputBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && suggestionsRef.value?.contains(relatedTarget)) return
  setTimeout(() => { showSuggestions.value = false; selectedIndex.value = -1 }, 150)
}

const handleSuggestionsBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && tagInputRef.value?.$el?.contains(relatedTarget)) return
  setTimeout(() => { showSuggestions.value = false; selectedIndex.value = -1 }, 150)
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
  // Defensive guards: ensure we're operating on an array here to avoid
  // runtime TypeError when an unexpected shape arrives.
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
    // Optimistically update — be defensive when `quoteTags.value` isn't an array
    if (!Array.isArray(quoteTags.value)) {
      quoteTags.value = [tag]
    } else if (!quoteTags.value.some(t => t.id === tag.id)) {
      quoteTags.value.push(tag)
    }
    emit('tags-updated')
    tagQuery.value = ''
    tagSuggestions.value = []
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
    tagSuggestions.value = []
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
    // Ensure .filter is only called on arrays
    if (Array.isArray(quoteTags.value)) {
      quoteTags.value = quoteTags.value.filter(t => t.id !== tag.id)
    } else {
      quoteTags.value = []
    }
    emit('tags-updated')
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
  if (open) loadQuoteTags()
})

onMounted(() => {
  if (isOpen.value) loadQuoteTags()
  document.addEventListener('click', onGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onGlobalClick)
})

const onGlobalClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showSuggestions.value = false
    selectedIndex.value = -1
  }
}
</script>
