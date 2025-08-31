<template>
  <UDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">Edit Tags</h3>
      </div>

      <div class="space-y-6">
        <!-- Existing tags on the quote -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Current Tags
          </label>
          <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
          <div v-else>
            <div v-if="quoteTags.length" class="flex flex-wrap gap-2">
              <div
                v-for="t in quoteTags"
                :key="t.id"
                class="inline-flex items-center gap-1"
              >
                <UBadge variant="soft" size="sm" :style="{ backgroundColor: t.color + '22', color: t.color }">#{{ t.name }}</UBadge>
                <UButton size="xs" btn="ghost" icon label="i-ph-x" :aria-label="`Remove ${t.name}`" @click="removeTag(t)" />
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">No tags yet.</div>
          </div>
        </div>

        <!-- Add tag input with suggestions -->
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Add Tag
          </label>
          <div class="relative">
            <UInput
              ref="tagInputRef"
              v-model="tagQuery"
              placeholder="Type to search or create a tag…"
              :disabled="submitting"
              @input="searchTags"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
              @keydown="handleKeydown"
            />
            <!-- Suggestions -->
            <div
              v-if="showSuggestions && (tagSuggestions.length > 0 || tagQuery)"
              ref="suggestionsRef"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto"
              tabindex="-1"
              @blur="handleSuggestionsBlur"
              @keydown="handleKeydown"
            >
              <div
                v-for="(tag, index) in tagSuggestions"
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
                v-if="tagQuery && !tagSuggestions.some(s => s.name.toLowerCase() === tagQuery.toLowerCase())"
                :class="[
                  'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700 flex items-center justify-between',
                  selectedIndex === tagSuggestions.length
                    ? 'bg-blue-100 dark:bg-blue-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="createAndAddTag()"
                @mouseenter="selectedIndex = tagSuggestions.length"
              >
                <span class="text-sm font-medium text-blue-600 dark:text-blue-400">Create new tag: "{{ tagQuery }}"</span>
                <span class="inline-block w-3 h-3 rounded" :style="{ backgroundColor: defaultColor }" />
              </div>
            </div>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <UButton btn="soft-blue" size="sm" :disabled="!tagQuery.trim() || submitting" @click="quickAddOrCreate">
              Add
            </UButton>
            <span v-if="error" class="text-xs text-red-500">{{ error }}</span>
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-3">
          <UButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">Close</UButton>
        </div>
      </div>
    </div>
  </UDialog>
  </template>

<script setup lang="ts">
import type { Tag } from '~/types/tag'

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

// Suggestion state
const tagQuery = ref('')
const tagSuggestions = ref<Array<Pick<Tag, 'id' | 'name' | 'color'>>>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

const tagInputRef = ref()
const suggestionsRef = ref()

const defaultColor = '#687FE5'

const loadQuoteTags = async () => {
  loading.value = true
  try {
  const res: any = await $fetch(`/api/quotes/${props.quoteId}/tags`)
  quoteTags.value = (res && (res.data || res.results)) || []
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
    tagSuggestions.value = (res && (res.data || res.results)) || []
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
  const total = tagSuggestions.value.length + (tagQuery.value && !tagSuggestions.value.some(s => s.name.toLowerCase() === tagQuery.value.toLowerCase()) ? 1 : 0)
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
        if (selectedIndex.value < tagSuggestions.value.length) addExistingTag(tagSuggestions.value[selectedIndex.value])
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
    // Optimistically update
    if (!quoteTags.value.some(t => t.id === tag.id)) quoteTags.value.push(tag)
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
    if (tag && typeof tag.id === 'number' && !quoteTags.value.some(t => t.id === tag.id)) {
      quoteTags.value.push({ id: tag.id, name: tag.name, color: tag.color })
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
  const exact = tagSuggestions.value.find(s => s.name.toLowerCase() === tagQuery.value.trim().toLowerCase())
  if (exact) addExistingTag(exact)
  else createAndAddTag()
}

const removeTag = async (tag: Pick<Tag, 'id' | 'name' | 'color'>) => {
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`/api/quotes/${props.quoteId}/tags/${tag.id}`, { method: 'DELETE' })
    quoteTags.value = quoteTags.value.filter(t => t.id !== tag.id)
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
