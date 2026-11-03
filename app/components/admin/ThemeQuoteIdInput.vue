<template>
  <label class="block min-w-0 space-y-1 text-sm text-gray-700 dark:text-gray-300">
    <span>{{ label }}</span>
    <div ref="inputContainer" class="relative">
      <NInput
        :model-value="query"
        :placeholder="placeholder"
        :loading="loading"
        :disabled="disabled"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen && results.length > 0"
        :aria-controls="isOpen && results.length ? listboxId : undefined"
        :aria-activedescendant="highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined"
        @update:model-value="onQueryUpdate"
        @focus="onFocus"
        @keydown="onKeydown"
        @blur="hideSuggestions"
      />
      <div
        v-if="isOpen && results.length"
        ref="suggestionListbox"
        :id="listboxId"
        role="listbox"
        class="absolute left-0 right-0 z-50 overflow-y-auto rounded-xl border border-gray-200 bg-[#FAFAF9] shadow-xl dark:border-neutral-700 dark:bg-[#151515]"
        :class="placement === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'"
        :style="{ maxHeight: `${suggestionMaxHeight}px` }"
      >
        <div
          v-for="(suggestion, index) in results"
          :id="optionId(index)"
          :key="suggestion.value"
          role="option"
          :aria-selected="index === highlightedIndex"
          class="flex cursor-pointer items-start justify-between gap-3 px-4 py-2.5 text-sm transition-colors"
          :class="index === highlightedIndex ? 'bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'"
          @mousedown.prevent="selectSuggestion(suggestion)"
          @mouseenter="highlightedIndex = index"
        >
          <span class="min-w-0 whitespace-normal">{{ suggestion.label }}</span>
          <span class="shrink-0 font-mono text-xs text-gray-500">#{{ suggestion.value }}</span>
        </div>
      </div>
    </div>
    <span v-if="selectedId" class="block font-mono text-xs text-gray-500 dark:text-gray-400">
      #{{ selectedId }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useAdaptiveSuggestionPlacement } from '~/composables/useAdaptiveSuggestionPlacement'

type QuoteSuggestion = { label: string; value: string }

const props = withDefaults(defineProps<{
  modelValue: number | string | null
  language: 'en' | 'fr'
  label: string
  placeholder: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const id = useId()
const listboxId = `theme-quote-id-listbox-${id}`
const query = ref('')
const inputContainer = ref<HTMLElement | null>(null)
const suggestionListbox = ref<HTMLElement | null>(null)
const results = ref<QuoteSuggestion[]>([])
const isOpen = ref(false)
const isEditing = ref(false)
const loading = ref(false)
const highlightedIndex = ref(-1)
let searchTimeout: ReturnType<typeof setTimeout> | undefined
let hideTimeout: ReturnType<typeof setTimeout> | undefined

const { placement, maxHeight: suggestionMaxHeight, updatePlacement } = useAdaptiveSuggestionPlacement(
  inputContainer,
  suggestionListbox,
  isOpen,
)

const selectedId = computed(() => {
  const value = typeof props.modelValue === 'string' ? Number(props.modelValue) : props.modelValue
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null
})

function optionId(index: number): string {
  return `${listboxId}-option-${index}`
}

function clearSearchTimeout(): void {
  if (searchTimeout) clearTimeout(searchTimeout)
}

function closeSuggestions(): void {
  results.value = []
  isOpen.value = false
  highlightedIndex.value = -1
  loading.value = false
}

async function searchQuotes(searchQuery: string): Promise<void> {
  const q = searchQuery.trim()
  if (!q || /^\d+$/u.test(q)) {
    closeSuggestions()
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{ data?: QuoteSuggestion[] }>('/api/admin/themes/filter-suggestions', {
      query: { q, type: 'featured_quote', language: props.language },
    })
    if (query.value !== searchQuery) return
    results.value = response.data || []
    isOpen.value = results.value.length > 0
    highlightedIndex.value = -1
    if (isOpen.value) nextTick(updatePlacement)
  } catch {
    if (query.value === searchQuery) closeSuggestions()
  } finally {
    if (query.value === searchQuery) loading.value = false
  }
}

function scheduleSearch(searchQuery: string): void {
  clearSearchTimeout()
  highlightedIndex.value = -1

  const trimmedQuery = searchQuery.trim()
  if (/^[1-9]\d*$/u.test(trimmedQuery)) {
    const directId = Number(trimmedQuery)
    emit('update:modelValue', Number.isSafeInteger(directId) ? directId : null)
    closeSuggestions()
    return
  }

  emit('update:modelValue', null)
  if (!trimmedQuery) {
    closeSuggestions()
    return
  }

  searchTimeout = setTimeout(() => void searchQuotes(searchQuery), 200)
}

function onQueryUpdate(value: string | number | null | undefined): void {
  const nextQuery = String(value ?? '')
  query.value = nextQuery
  isEditing.value = true
  scheduleSearch(nextQuery)
}

function onFocus(): void {
  if (hideTimeout) clearTimeout(hideTimeout)
  isEditing.value = true
  if (query.value.trim() && !/^\d+$/u.test(query.value.trim())) {
    clearSearchTimeout()
    void searchQuotes(query.value)
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    if (event.metaKey || event.ctrlKey) return
    event.preventDefault()
    const selected = results.value[highlightedIndex.value]
    if (isOpen.value && selected) selectSuggestion(selected)
    return
  }

  if (!isOpen.value || !results.value.length) {
    if (event.key === 'Escape') closeSuggestions()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = (highlightedIndex.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = highlightedIndex.value <= 0
      ? results.value.length - 1
      : highlightedIndex.value - 1
  } else if (event.key === 'Escape') {
    closeSuggestions()
  }
}

function selectSuggestion(suggestion: QuoteSuggestion): void {
  clearSearchTimeout()
  query.value = suggestion.label
  emit('update:modelValue', Number(suggestion.value))
  closeSuggestions()
}

function hideSuggestions(): void {
  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => {
    isEditing.value = false
    closeSuggestions()
  }, 150)
}

watch(highlightedIndex, (index) => {
  if (index < 0 || !import.meta.client) return
  nextTick(() => document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' }))
})

watch(selectedId, async (id) => {
  if (isEditing.value) return
  if (!id) {
    query.value = ''
    return
  }

  query.value = `#${id}`
  try {
    const response = await $fetch<{ data?: { name?: string } }>(`/api/quotes/${id}`)
    if (!isEditing.value && selectedId.value === id && response.data?.name) {
      query.value = response.data.name
    }
  } catch {
    // Keep the ID visible when the quote can no longer be resolved.
  }
}, { immediate: true })

onBeforeUnmount(() => {
  clearSearchTimeout()
  if (hideTimeout) clearTimeout(hideTimeout)
})
</script>
