<template>
  <div
    class="quote-list-item group bg-white dark:bg-[#0F0D0B] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all duration-200 hover:shadow-md select-none"
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @contextmenu.prevent="actionsOpen = true"
  >
  <div class="flex items-start gap-3 mb-1">
      <!-- Quote Content (Main) -->
      <div class="flex-1 min-w-0">
        <blockquote
          class="font-serif text-gray-900 dark:text-gray-100 leading-relaxed"
          :class="{
            'text-sm': (quote.name || '').length > 200,
            'text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
            'text-lg font-500': (quote.name || '').length <= 100
          }"
        >
          {{ quote.name }}
        </blockquote>
      </div>

      <!-- Actions Dropdown (right) -->
      <div class="flex-shrink-0 -mt-1">
        <NDropdownMenu :items="dropdownActions">
          <NButton
            icon
            btn="ghost"
            size="sm"
            label="i-ph-dots-three-vertical"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop
          />
        </NDropdownMenu>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gradient-to-r from-gray-100 via-gray-100 to-transparent dark:from-gray-800 dark:via-gray-800 mt-3"></div>

    <!-- Bottom Row: Author and Reference Info (moved under the quote) -->
    <div v-if="quote.author || quote.author_name" class="flex items-center justify-between gap-3 pt-3">
      <!-- Author Name with Avatar -->
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <NAvatar
          v-if="showAvatar"
          :src="quote.author?.image_url || quote.author_image_url || undefined"
          :alt="quote.author?.name || quote.author_name || 'Unknown Author'"
          size="sm"
          rounded="full"
          class="flex-shrink-0"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-600 text-gray-900 dark:text-white truncate">{{ quote.author?.name || quote.author_name || 'Unknown Author' }}</div>
          <div v-if="quote.reference?.name || quote.reference_name" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ quote.reference?.name || quote.reference_name }}</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Reference Type Badge (configurable style) -->
        <template v-if="referenceType">
          <!-- text style -->
          <NBadge
            v-if="badge === 'text'"
            :color="getReferenceTypeColor(referenceType)"
            variant="subtle"
            size="xs"
            class="text-xs font-500 rounded-lg"
          >
            {{ formatReferenceType(referenceType) }}
          </NBadge>

          <!-- dot style -->
          <div
            v-else-if="badge === 'dot'"
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: getReferenceTypeHex(referenceType) }"
            :title="formatReferenceType(referenceType)"
            aria-hidden="true"
          />

          <!-- icon style -->
          <div v-else class="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
            <NIcon :name="getReferenceTypeIcon(referenceType)" class="w-4 h-4" :style="{ color: getReferenceTypeHex(referenceType) }" />
          </div>
        </template>

        <!-- Featured Badge (if any) -->
        <NBadge v-if="quote.is_featured" color="yellow" variant="subtle" size="xs">Featured</NBadge>
      </div>
    </div>

    <!-- Bottom alternative: show date when no author/reference -->
    <div v-else class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
      <span>{{ formatDate(quote.created_at) }}</span>
    </div>
    
    <!-- Mobile quick actions drawer triggered by long-press -->
    <QuoteActionsDrawer
      v-model:open="actionsOpen"
      status="approved"
      :actions="drawerActions"
      @edit="emitEdit"
      @delete="emitDelete"
      @share="emitShare"
      @unlike="emitUnlike"
      @add-to-collection="emitAddToCollection"
    />
  </div>
</template>

        <!-- Featured Badge (if any) -->
        <NBadge v-if="quote.is_featured" color="yellow" variant="subtle" size="xs">Featured</NBadge>
      </div>
    </div>

    <!-- Bottom alternative: show date when no author/reference -->
    <div v-else class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
      <span>{{ formatDate(quote.created_at) }}</span>
    </div>
    
    <!-- Mobile quick actions drawer triggered by long-press -->
    <QuoteActionsDrawer
      v-model:open="actionsOpen"
      status="approved"
      :actions="drawerActions"
      @edit="emitEdit"
      @delete="emitDelete"
      @share="emitShare"
      @unlike="emitUnlike"
      @add-to-collection="emitAddToCollection"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProcessedQuoteResult } from '~/types'

interface DropdownAction {
  label: string
  leading?: string
  onclick?: () => void
  divider?: boolean
}

interface Props {
  quote: ProcessedQuoteResult
  showAvatar?: boolean
  badge?: 'text' | 'dot' | 'icon'
  actions?: DropdownAction[]
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  badge: 'text',
})

const isHovered = ref(false)

const emit = defineEmits<{
  (e: 'edit', quote: any): void
  (e: 'delete', quote: any): void
  (e: 'share', quote: any): void
  (e: 'like-toggled', quote: any): void
  (e: 'unlike', quote: any): void
  (e: 'add-to-collection', quote: any): void
}>()

const defaultActions: DropdownAction[] = [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => emit('edit', props.quote)
  },
  {
    label: 'Share',
    leading: 'i-ph-share',
    onclick: () => emit('share', props.quote)
  },
  { divider: true } as DropdownAction,
  {
    label: 'Remove',
    leading: 'i-ph-trash',
    onclick: () => emit('delete', props.quote)
  }
]

const dropdownActions = computed(() => {
  if (props.actions && props.actions.length > 0) {
    return props.actions.map(action => {
      if (action.divider) return {}
      
      // Map common action labels to emit handlers
      const onclick = action.onclick || (() => {
        const label = action.label.toLowerCase()
        if (label === 'edit') emit('edit', props.quote)
        else if (label === 'share') emit('share', props.quote)
        else if (label === 'remove' || label === 'delete') emit('delete', props.quote)
        else if (label === 'unlike') emit('unlike', props.quote)
        else if (label === 'add to collection' || label === 'add to list') emit('add-to-collection', props.quote)
      })
      
      return { ...action, onclick }
    })
  }
  return defaultActions
})

// Drawer actions - convert dropdown actions to drawer format (without dividers)
const drawerActions = computed(() => {
  if (props.actions && props.actions.length > 0) {
    return props.actions
      .filter(action => !action.divider)
      .map(action => ({
        label: action.label,
        leading: action.leading,
        onclick: action.onclick
      }))
  }
  // Default drawer actions
  return [
    { label: 'Edit', leading: 'i-ph-pencil' },
    { label: 'Share', leading: 'i-ph-share' },
    { label: 'Remove', leading: 'i-ph-trash' }
  ]
})

const actionsOpen = ref(false)

// Reference type derived from quote
const referenceType = computed(() => (props.quote.reference?.type || (props.quote.reference_type as any)) as string | undefined)


const navigateToQuote = () => {
  navigateTo(`/quotes/${props.quote.id}`)
}

const getReferenceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'book': 'green',
    'film': 'blue',
    'tv_series': 'purple',
    'video_game': 'orange',
    'music': 'pink',
    'podcast': 'indigo',
    'documentary': 'teal',
    'speech': 'red',
    'other': 'gray'
  }
  return colors[type] || 'gray'
}

// Hex colors for dot/icon styles
const getReferenceTypeHex = (type: string) => {
  const hex: Record<string, string> = {
    book: '#22c55e', // green-500
    film: '#3b82f6', // blue-500
    tv_series: '#a855f7', // purple-500
    video_game: '#f59e0b', // amber-500
    music: '#ec4899', // pink-500
    podcast: '#6366f1', // indigo-500
    documentary: '#14b8a6', // teal-500
    speech: '#ef4444', // red-500
    other: '#9ca3af' // gray-400
  }
  return hex[type] || '#9ca3af'
}

const getReferenceTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    book: 'i-ph-book-open',
    film: 'i-ph-film-strip',
    tv_series: 'i-ph-television',
    video_game: 'i-ph-game-controller',
    music: 'i-ph-music-notes',
    podcast: 'i-ph-microphone',
    documentary: 'i-ph-video-camera',
    speech: 'i-ph-quotes',
    other: 'i-ph-tag'
  }
  return icons[type] || 'i-ph-tag'
}

const formatReferenceType = (type: string) => {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Emit handlers for drawer and dropdown actions

const emitEdit = () => {
  emit('edit', props.quote)
}

const emitDelete = () => {
  emit('delete', props.quote)
}

const emitShare = () => {
  emit('share', props.quote)
}

const emitUnlike = () => {
  emit('unlike', props.quote)
}

const emitAddToCollection = () => {
  emit('add-to-collection', props.quote)
}
</script>

<style scoped>
/* Card layout polish */
.quote-list-item {
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.quote-list-item:active {
  transform: scale(0.995);
}

@media (max-width: 767px) {
  .quote-list-item {
    border-radius: 1rem;
  }
}
</style>
