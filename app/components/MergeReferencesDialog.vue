<template>
  <AppDialog
    v-model="isOpen"
    title="Merge References"
    submit-text="Merge"
    :submitting="submitting"
    :can-submit="!!selectedTarget && !!localSourceReference"
    :max-width="'lg'"
    :scrollable="true"
    @submit="confirmMerge"
  >
    <div class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-gray-50/50 dark:bg-gray-900/20 overflow-hidden min-w-0">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <div v-if="localSourceReference?.image_url" class="w-10 h-12 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-sm">
                <img :src="localSourceReference.image_url" :alt="localSourceReference.name" class="w-full h-full object-cover grayscale" />
              </div>
              <div v-else class="w-10 h-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-sm">
                <NIcon :name="getTypeIcon(localSourceReference?.primary_type)" class="w-5 h-5 text-gray-500" />
              </div>
            </div>
            <div class="min-w-0">
              <NTooltip v-if="localSourceReference?.name" :content="localSourceReference.name">
                <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ localSourceReference?.name }}</p>
              </NTooltip>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize">{{ localSourceReference?.primary_type?.replace('_', ' ') }} &middot; {{ sourceQuotesCount }} quote{{ sourceQuotesCount !== 1 ? 's' : '' }}</p>

              <NTooltip content="Source will be removed">
                <div class="flex items-center gap-2 mt-1 rounded-4 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                   <NIcon name="i-tabler-trash-x" size="xs" class="text-red-600" />
                   <h4 class="font-sans text-xs font-500 lowercase tracking-wider text-red-600 dark:text-gray-400">Source</h4>
                </div>
              </NTooltip>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-1">
          <NIcon name="i-tabler-arrow-iteration" size="2xl" class="text-gray-400 dark:text-gray-500" />
          <button
            v-if="selectedTarget"
            class="font-sans text-xs font-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline decoration-dashed underline-offset-2"
            @click="swapReferences"
          >Switch</button>
        </div>

        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4 overflow-hidden min-w-0">
          <div v-if="selectedTarget" class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <div v-if="selectedTarget.image_url" class="w-10 h-12 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-sm">
                <img :src="selectedTarget.image_url" :alt="selectedTarget.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-10 h-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-sm">
                <NIcon :name="getTypeIcon(selectedTarget.primary_type)" class="w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div class="min-w-0">
              <NTooltip v-if="selectedTarget.name" :content="selectedTarget.name">
                <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ selectedTarget.name }}</p>
              </NTooltip>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize">{{ selectedTarget.primary_type.replace('_', ' ') }} &middot; {{ targetQuotesCount }} quote{{ targetQuotesCount !== 1 ? 's' : '' }}</p>

              <NTooltip content="Target will be kept">
                <div class="flex items-center gap-2 mt-1 rounded-4 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <NIcon name="i-tabler-heart-handshake" size="xs" class="text-blue-600" />
                  <h4 class="font-sans text-xs font-500 lowercase tracking-wider text-blue-600 dark:text-gray-400">Target</h4>
                </div>
              </NTooltip>
            </div>
          </div>
          <div v-else class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
            <NIcon name="i-ph-arrow-bend-right-down" class="w-4 h-4" />
            <span class="font-sans text-xs">Search and select a reference below</span>
          </div>
        </div>
      </div>

      <div>
        <label class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">Search target reference</label>
        <div :class="['relative', { 'min-h-14': searchResults.length > 0 }]">
          <NInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Type to search references..."
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
              v-for="(ref, idx) in searchResults"
              :key="ref.id"
              :class="['flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors', idx === activeSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50']"
              @click="selectTarget(ref)"
              @mouseenter="activeSuggestionIndex = idx"
            >
              <div class="flex-shrink-0">
                <div v-if="ref.image_url" class="w-7 h-9 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-sm">
                  <img :src="ref.image_url" :alt="ref.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-7 h-9 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-sm">
                  <NIcon :name="getTypeIcon(ref.primary_type)" class="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ ref.name }}</p>
                <p class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize">{{ ref.primary_type.replace('_', ' ') }}</p>
              </div>
            </div>
            <div v-if="searchResults.length === 0" class="px-3 py-4 text-center font-sans text-xs text-gray-400 dark:text-gray-500">
              No references found
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedTarget && localSourceReference">
        <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
          <table class="w-full text-sm table-fixed">
            <thead>
              <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 w-1/4">Field</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 max-w-0">Source</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 max-w-0">Target</th>
                <th class="px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 w-1/5">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td class="px-3 py-2 font-sans text-xs text-gray-700 dark:text-gray-300">Name</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" @click="openExpanded('Name', 'source', localSourceReference.name, 'Will be dropped', $event)">{{ localSourceReference.name }}</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" @click="openExpanded('Name', 'target', selectedTarget.name, 'Will be kept', $event)">{{ selectedTarget.name }}</td>
                <td class="px-3 py-2 font-sans text-xs text-blue-600 dark:text-blue-400">Keep target</td>
              </tr>
              <tr v-for="field in diffFields" :key="field.name">
                <td class="px-3 py-2 font-sans text-xs text-gray-700 dark:text-gray-300 capitalize">{{ field.label }}</td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100 truncate" :class="field.sourceValue ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''" @click="field.sourceValue && openExpanded(field.label, 'source', field.sourceValue, getActionText(field, 'source'), $event)">
                  <span v-if="field.sourceValue">{{ field.sourceValue }}</span>
                  <span v-else>—</span>
                </td>
                <td class="px-3 py-2 font-sans text-xs text-gray-900 dark:text-gray-100 truncate" :class="field.targetValue ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''" @click="field.targetValue && openExpanded(field.label, 'target', field.targetValue, getActionText(field, 'target'), $event)">
                  <span v-if="field.targetValue">{{ field.targetValue }}</span>
                  <span v-else>—</span>
                </td>
                <td class="px-3 py-2">
                  <span v-if="field.sourceValue && !field.targetValue" class="font-sans text-xs text-lime-600 dark:text-lime-400">Will be copied</span>
                  <span v-else-if="field.sourceValue && field.targetValue && field.sourceValue !== field.targetValue" class="font-sans text-xs text-gray-500 dark:text-gray-400">Keep target</span>
                  <span v-else class="font-sans text-xs text-gray-400 dark:text-gray-500">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-for="cell in expandedCells"
          :key="cell.key"
          tabindex="-1"
          class="fixed w-96 border border-gray-200 dark:border-gray-700 rounded-sm shadow-xl bg-white dark:bg-gray-900 z-50 outline-none"
          :style="{ left: `${cell.x}px`, top: `${cell.y}px` }"
          @keydown.escape.prevent.stop="closeExpanded(cell.key)"
          @mousedown.stop="startDrag(cell.key, $event)"
        >
          <div
            class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none"
          >
            <div class="flex items-center gap-2 min-w-0">
              <NIcon name="i-ph-dots-six" class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span class="font-sans text-xs font-500 text-gray-900 dark:text-gray-100">{{ cell.label }}</span>
              <span class="font-sans text-xs text-gray-400 dark:text-gray-500">&middot;</span>
              <span class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize">{{ cell.entity }}</span>
              <span class="font-sans text-xs text-gray-400 dark:text-gray-500">&middot;</span>
              <span :class="['font-sans text-xs', cell.action === 'Will be kept' ? 'text-blue-600 dark:text-blue-400' : cell.action === 'Will be copied' ? 'text-lime-600 dark:text-lime-400' : 'text-red-600 dark:text-red-400']">{{ cell.action }}</span>
            </div>
            <button class="flex-shrink-0 p-0.5 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="closeExpanded(cell.key)">
              <NIcon name="i-ph-x" class="w-4 h-4" />
            </button>
          </div>
          <div class="p-3 max-h-48 overflow-auto font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-normal break-words">
            {{ cell.value }}
          </div>
        </div>

        <div class="mt-2 p-3 flex items-center gap-2 bg-amber-50 dark:bg-pink-900/20 border border-amber-200 dark:border-pink-800">
          <NIcon name="i-ph-warning" class="text-amber-500 dark:text-pink-600 flex-shrink-0" />
          <div class="text-xs text-amber-500 dark:text-pink-300">
            <p class="font-medium">This action merges two references into one and cannot be undone.</p>
          </div>
        </div>

        <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">
          <strong>{{ sourceQuotesCount }}</strong> quote{{ sourceQuotesCount !== 1 ? 's' : '' }} will be reassigned from <strong>{{ localSourceReference.name }}</strong> to <strong>{{ selectedTarget.name }}</strong>.
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
          <span class="ml-2">Merge References</span>
          <NIcon name="i-tabler-arrow-merge-right" class="ml-2" />
        </PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { QuoteReferencePrimaryType } from '#shared/types/quote-reference'

interface ReferenceWithQuotes {
  id: number; name: string; primary_type: QuoteReferencePrimaryType
  secondary_type?: string | null; release_date?: string | null
  original_language?: string; description?: string | null
  image_url?: string; urls: string | Record<string, any>; quotes_count?: number
  views_count: number; likes_count: number; shares_count: number
  created_at: string; updated_at: string
}

interface Props {
  modelValue: boolean
  sourceReference?: ReferenceWithQuotes | null
  initialTargetReference?: ReferenceWithQuotes | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'references-merged'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { showErrorToast } = useErrorToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const localSourceReference = ref<ReferenceWithQuotes | null>(null)
const submitting = ref(false)
const searchQuery = ref('')
const searchResults = ref<ReferenceWithQuotes[]>([])
const selectedTarget = ref<ReferenceWithQuotes | null>(null)
const showSuggestions = ref(false)
const activeSuggestionIndex = ref(-1)
const suggestionsRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<any>(null)

interface ExpandedCell {
  key: string; label: string; entity: 'source' | 'target'; value: string; action: string; x: number; y: number
}

const expandedCells = ref<ExpandedCell[]>([])
const draggingKey = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

const onEscapeCapture = (ke: KeyboardEvent) => {
  if (ke.key === 'Escape') {
    ke.stopPropagation()
    if (expandedCells.value.length > 0) {
      closeExpanded(expandedCells.value[expandedCells.value.length - 1].key)
    }
  }
}

const openExpanded = (label: string, entity: 'source' | 'target', value: string, action: string, e?: MouseEvent) => {
  const key = `${label}-${entity}`
  const existing = expandedCells.value.find(c => c.key === key)
  if (existing) {
    closeExpanded(key)
    return
  }
  let x = 0; let y = 0
  if (e) {
    const el = e.target as HTMLElement
    const dialog = el.closest('[role="dialog"]')
    const dialogRect = dialog?.getBoundingClientRect()
    const offsetX = dialogRect?.left ?? 0; const offsetY = dialogRect?.top ?? 0
    const maxX = (dialogRect?.width ?? window.innerWidth) - 384; const maxY = (dialogRect?.height ?? window.innerHeight) - 300
    x = Math.min(Math.max(0, e.clientX - offsetX + 8), maxX)
    y = Math.min(Math.max(0, e.clientY - offsetY + 8), maxY)
  } else {
    x = window.innerWidth / 2 - 192; y = window.innerHeight / 2 - 100
  }
  expandedCells.value = [...expandedCells.value, { key, label, entity, value, action, x, y }]
  document.addEventListener('keydown', onEscapeCapture, { capture: true })
}

const closeExpanded = (key?: string) => {
  if (key) {
    expandedCells.value = expandedCells.value.filter(c => c.key !== key)
  } else {
    expandedCells.value = []
  }
  if (expandedCells.value.length === 0) {
    document.removeEventListener('keydown', onEscapeCapture, { capture: true })
  }
}

const startDrag = (key: string, e: MouseEvent) => {
  const cell = expandedCells.value.find(c => c.key === key)
  if (!cell) return
  draggingKey.value = key
  dragOffset.value = { x: e.clientX - cell.x, y: e.clientY - cell.y }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!draggingKey.value) return
  const cell = expandedCells.value.find(c => c.key === draggingKey.value)
  if (!cell) return
  cell.x = e.clientX - dragOffset.value.x
  cell.y = e.clientY - dragOffset.value.y
}

const stopDrag = () => {
  draggingKey.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const getActionText = (field: { sourceValue: string | null; targetValue: string | null }, entity: 'source' | 'target'): string => {
  if (entity === 'target') return 'Will be kept'
  if (field.sourceValue && !field.targetValue) return 'Will be copied'
  return 'Will be dropped'
}

const sourceQuotesCount = computed(() => (localSourceReference.value as any)?.quotes_count ?? 0)
const targetQuotesCount = computed(() => (selectedTarget.value as any)?.quotes_count ?? 0)

const getTypeIcon = (type: QuoteReferencePrimaryType | undefined): string => {
  const iconMap: Record<string, string> = {
    book: 'i-ph-book', film: 'i-ph-film-strip', tv_series: 'i-ph-television',
    music: 'i-ph-music-note', speech: 'i-ph-microphone', podcast: 'i-ph-microphone-stage',
    interview: 'i-ph-chat-circle', documentary: 'i-ph-video-camera',
    media_stream: 'i-ph-play-circle', writings: 'i-ph-article',
    video_game: 'i-ph-game-controller', other: 'i-ph-file',
  }
  return (type && iconMap[type]) || 'i-ph-file'
}

const diffFields = computed(() => {
  if (!localSourceReference.value || !selectedTarget.value) return []
  const source = localSourceReference.value
  const target = selectedTarget.value
  const fields: { name: string; label: string; sourceValue: string | null; targetValue: string | null }[] = [
    { name: 'primary_type', label: 'Type', sourceValue: source.primary_type?.replace('_', ' ') ?? null, targetValue: target.primary_type?.replace('_', ' ') ?? null },
    { name: 'secondary_type', label: 'Secondary type', sourceValue: source.secondary_type ?? null, targetValue: target.secondary_type ?? null },
    { name: 'release_date', label: 'Release date', sourceValue: source.release_date ?? null, targetValue: target.release_date ?? null },
    { name: 'original_language', label: 'Language', sourceValue: source.original_language ?? null, targetValue: target.original_language ?? null },
    { name: 'description', label: 'Description', sourceValue: source.description ?? null, targetValue: target.description ?? null },
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
    const res: any = await $fetch('/api/admin/references', {
      query: { search: q, limit: 10, sort_by: 'quotes', sort_order: 'DESC' },
    })
    searchResults.value = (res.data || []).filter(
      (r: ReferenceWithQuotes) => r.id !== localSourceReference.value?.id
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

const selectTarget = (ref: ReferenceWithQuotes) => {
  selectedTarget.value = ref
  searchQuery.value = ref.name
  showSuggestions.value = false
}

const swapReferences = () => {
  if (!selectedTarget.value || !localSourceReference.value) return
  const tmp = localSourceReference.value
  localSourceReference.value = selectedTarget.value
  selectedTarget.value = tmp
  searchQuery.value = tmp.name
  showSuggestions.value = false
}

const confirmMerge = async () => {
  if (!localSourceReference.value || !selectedTarget.value) return
  submitting.value = true
  try {
    await $fetch('/api/admin/references/merge', {
      method: 'POST',
      body: {
        source_id: localSourceReference.value.id,
        target_id: selectedTarget.value.id,
      },
    })

    useToast().toast({
      toast: 'soft-success',
      title: 'References merged',
      description: `${localSourceReference.value.name} → ${selectedTarget.value.name}. ${sourceQuotesCount.value} quote(s) reassigned.`,
    })

    emit('references-merged')
    isOpen.value = false
  } catch (error: any) {
    showErrorToast(error, { title: 'Error', fallback: 'Failed to merge references' })
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  closeExpanded()
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

watch(() => props.modelValue, async (val) => {
  if (val) {
    localSourceReference.value = props.sourceReference ?? null
    selectedTarget.value = null
    searchQuery.value = ''
    searchResults.value = []
    showSuggestions.value = false
    activeSuggestionIndex.value = -1
    closeExpanded()
    if (props.initialTargetReference && props.initialTargetReference.id !== localSourceReference.value?.id) {
      selectedTarget.value = props.initialTargetReference
      searchQuery.value = props.initialTargetReference.name
    } else {
      await nextTick()
      const input = searchInputRef.value
      if (typeof input?.focus === 'function') {
        input.focus()
      } else {
        input?.$el?.querySelector?.('input')?.focus()
      }
    }
  }
})
</script>
