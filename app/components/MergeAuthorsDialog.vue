<template>
  <AppDialog
    v-model="isOpen"
    title="Merge Authors"
    submit-text="Merge"
    :submitting="submitting"
    :can-submit="!!selectedTarget && !!sourceAuthor"
    :max-width="'lg'"
    :scrollable="true"
    @submit="confirmMerge"
  >
    <div class="space-y-5">
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
        <div class="text-sm text-amber-800 dark:text-amber-300">
          <p class="font-medium">This action merges two authors into one and cannot be undone.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-gray-50/50 dark:bg-gray-900/20">
          <h4 class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Source (will be removed)</h4>
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <div v-if="sourceAuthor?.image_url" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img :src="sourceAuthor.image_url" :alt="sourceAuthor.name" class="w-full h-full object-cover grayscale" />
              </div>
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <NIcon name="i-ph-user" class="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ sourceAuthor?.name }}</p>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ sourceQuotesCount }} quote{{ sourceQuotesCount !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <div v-if="sourceAuthor?.job" class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">{{ sourceAuthor.job }}</div>
        </div>

        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4">
          <h4 class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Target (will be kept)</h4>
          <div v-if="selectedTarget" class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <div v-if="selectedTarget.image_url" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img :src="selectedTarget.image_url" :alt="selectedTarget.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <NIcon name="i-ph-user" class="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ selectedTarget.name }}</p>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ targetQuotesCount }} quote{{ targetQuotesCount !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <div v-else class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-arrow-bend-right-down" class="w-4 h-4" />
            <span class="font-sans text-xs">Search and select an author below</span>
          </div>
          <div v-if="selectedTarget?.job" class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedTarget.job }}</div>
        </div>
      </div>

      <div>
        <label class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">Search target author</label>
        <div :class="['relative', { 'min-h-42': searchResults.length > 0 }]">
          <NInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Type to search authors..."
            leading="i-ph-magnifying-glass"
            input="outline-gray"
            @input="onSearchInput"
            @focus="showSuggestions = true"
            @keydown="handleKeydown"
          />
          <div
            v-if="showSuggestions && searchQuery.length >= 1"
            ref="suggestionsRef"
            class="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-48 overflow-auto rounded-sm"
            tabindex="-1"
          >
            <div
              v-for="(author, idx) in searchResults"
              :key="author.id"
              :class="['flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors', idx === activeSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50']"
              @click="selectTarget(author)"
              @mouseenter="activeSuggestionIndex = idx"
            >
              <div class="flex-shrink-0">
                <div v-if="author.image_url" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <NIcon name="i-ph-user" class="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ author.name }}</p>
                <p v-if="author.job" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ author.job }}</p>
              </div>
              <span v-if="author.is_fictional" class="font-sans text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 flex-shrink-0">Fictional</span>
            </div>
            <div v-if="searchResults.length === 0" class="px-3 py-4 text-center font-sans text-xs text-gray-400 dark:text-gray-500">
              No authors found
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedTarget && sourceAuthor">
        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Field</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Source</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Target</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td class="px-3 py-2 font-sans text-xs text-gray-700 dark:text-gray-300">Name</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100">{{ sourceAuthor.name }}</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100">{{ selectedTarget.name }}</td>
                <td class="px-3 py-2 font-sans text-xs text-blue-600 dark:text-blue-400">Keep target</td>
              </tr>
              <tr v-for="field in diffFields" :key="field.name">
                <td class="px-3 py-2 font-sans text-xs text-gray-700 dark:text-gray-300 capitalize">{{ field.label }}</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100">{{ field.sourceValue || '—' }}</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100">{{ field.targetValue || '—' }}</td>
                <td class="px-3 py-2">
                  <span v-if="field.sourceValue && !field.targetValue" class="font-sans text-xs text-amber-600 dark:text-amber-400">Will be copied</span>
                  <span v-else-if="field.sourceValue && field.targetValue && field.sourceValue !== field.targetValue" class="font-sans text-xs text-gray-500 dark:text-gray-400">Keep target</span>
                  <span v-else class="font-sans text-xs text-gray-400 dark:text-gray-500">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">
          <strong>{{ sourceQuotesCount }}</strong> quote{{ sourceQuotesCount !== 1 ? 's' : '' }} will be reassigned from <strong>{{ sourceAuthor.name }}</strong> to <strong>{{ selectedTarget.name }}</strong>.
          View, like, and share counts will be summed.
        </p>
      </div>
    </div>

    <template #submit>
      <PrimaryButton
        :loading="submitting"
        :disabled="!selectedTarget"
        class="px-6"
        @click="confirmMerge"
        >
          <span class="ml-2">Merge Authors</span>
          <NIcon name="i-tabler-arrow-merge-right" class="ml-2" />
        </PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { Author } from '#shared/types/author'

interface Props {
  modelValue: boolean
  sourceAuthor?: Author | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'authors-merged'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { showErrorToast } = useErrorToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const submitting = ref(false)
const searchQuery = ref('')
const searchResults = ref<Author[]>([])
const selectedTarget = ref<Author | null>(null)
const showSuggestions = ref(false)
const activeSuggestionIndex = ref(-1)
const suggestionsRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<any>(null)

const sourceQuotesCount = computed(() => props.sourceAuthor?.quotes_count ?? 0)
const targetQuotesCount = computed(() => selectedTarget.value?.quotes_count ?? 0)

const diffFields = computed(() => {
  if (!props.sourceAuthor || !selectedTarget.value) return []
  const source = props.sourceAuthor
  const target = selectedTarget.value
  const fields: { name: string; label: string; sourceValue: string | null; targetValue: string | null }[] = [
    { name: 'job', label: 'Job', sourceValue: source.job ?? null, targetValue: target.job ?? null },
    { name: 'description', label: 'Description', sourceValue: source.description ?? null, targetValue: target.description ?? null },
    { name: 'birth_date', label: 'Birth date', sourceValue: source.birth_date ?? null, targetValue: target.birth_date ?? null },
    { name: 'birth_location', label: 'Birth location', sourceValue: source.birth_location ?? null, targetValue: target.birth_location ?? null },
    { name: 'death_date', label: 'Death date', sourceValue: source.death_date ?? null, targetValue: target.death_date ?? null },
    { name: 'death_location', label: 'Death location', sourceValue: source.death_location ?? null, targetValue: target.death_location ?? null },
    { name: 'is_fictional', label: 'Fictional', sourceValue: source.is_fictional ? 'Yes' : 'No', targetValue: target.is_fictional ? 'Yes' : 'No' },
  ]
  return fields.filter(f => f.sourceValue !== null || f.targetValue !== null)
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadSearchResults, 200)
}

const loadSearchResults = async () => {
  const q = searchQuery.value.trim()
  if (q.length < 1) {
    searchResults.value = []
    return
  }
  try {
    const res: any = await $fetch('/api/admin/authors', {
      query: { search: q, limit: 10, sort_by: 'quotes', sort_order: 'DESC' },
    })
    searchResults.value = (res.data || []).filter(
      (a: Author) => a.id !== props.sourceAuthor?.id
    )
    activeSuggestionIndex.value = -1
  } catch {
    searchResults.value = []
  }
}

const scrollActiveIntoView = async () => {
  await nextTick()
  const container = suggestionsRef.value
  if (!container) return
  const el = container.children[activeSuggestionIndex.value] as HTMLElement | undefined
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const handleKeydown = (e: KeyboardEvent) => {
  const last = searchResults.value.length - 1
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeSuggestionIndex.value = activeSuggestionIndex.value >= last ? 0 : activeSuggestionIndex.value + 1
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIndex.value = activeSuggestionIndex.value <= 0 ? last : activeSuggestionIndex.value - 1
    scrollActiveIntoView()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeSuggestionIndex.value >= 0 && activeSuggestionIndex.value < searchResults.value.length) {
      selectTarget(searchResults.value[activeSuggestionIndex.value])
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

const selectTarget = (author: Author) => {
  selectedTarget.value = author
  searchQuery.value = author.name
  showSuggestions.value = false
}

const confirmMerge = async () => {
  if (!props.sourceAuthor || !selectedTarget.value) return
  submitting.value = true
  try {
    await $fetch('/api/admin/authors/merge', {
      method: 'POST',
      body: {
        source_id: props.sourceAuthor.id,
        target_id: selectedTarget.value.id,
      },
    })

    useToast().toast({
      toast: 'soft-success',
      title: 'Authors merged',
      description: `${props.sourceAuthor.name} → ${selectedTarget.value.name}. ${sourceQuotesCount.value} quote(s) reassigned.`,
    })

    emit('authors-merged')
    isOpen.value = false
  } catch (error: any) {
    showErrorToast(error, { title: 'Error', fallback: 'Failed to merge authors' })
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    selectedTarget.value = null
    searchQuery.value = ''
    searchResults.value = []
    showSuggestions.value = false
    activeSuggestionIndex.value = -1
    await nextTick()
    const input = searchInputRef.value
    if (typeof input?.focus === 'function') {
      input.focus()
    } else {
      input?.$el?.querySelector?.('input')?.focus()
    }
  }
})
</script>
