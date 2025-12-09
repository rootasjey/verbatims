<template>
  <div
    class="draft-quote-card group bg-white dark:bg-[#0F0D0B] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer active:scale-98 select-none"
    @click="handleEdit"
    @contextmenu.prevent="actionsOpen = true"
  >
    <div class="p-5 space-y-4">
      <!-- Top Row: Quote Content + Actions Menu -->
      <div class="flex items-start gap-3 mb-1">
        <!-- Quote Content (Main) -->
        <div class="flex-1 min-w-0">
          <blockquote
            class="font-serif text-gray-900 dark:text-gray-100 leading-relaxed"
            :class="{
              'text-md': (quote.name || '').length > 200,
              'text-xl text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
              'text-2xl font-200': (quote.name || '').length <= 100
            }"
          >
            {{ quote.name }}
          </blockquote>
        </div>

        <!-- Actions Dropdown -->
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
      <div class="h-px bg-gradient-to-r from-gray-100 via-gray-100 to-transparent dark:from-gray-800 dark:via-gray-800"></div>

      <!-- Bottom Row: Author and Reference Info -->
      <div v-if="quote.author || quote.author_name" class="flex items-center justify-between gap-3 pt-1">
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
            <div class="text-sm font-600 text-gray-900 dark:text-white truncate">
              {{ quote.author?.name || quote.author_name }}
            </div>
            <div v-if="quote.reference?.name || quote.reference_name" class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ quote.reference?.name || quote.reference_name }}
            </div>
          </div>
        </div>

        <!-- Reference Type Badge -->
        <div v-if="quote.reference || quote.reference_type" class="flex-shrink-0">
          <NBadge
            :color="getReferenceTypeColor(quote.reference?.type || quote.reference_type as string)"
            badge="soft"
            size="xs"
            class="text-xs font-500 rounded-lg"
          >
            {{ formatReferenceType((quote.reference?.type || quote.reference_type) as string) }}
          </NBadge>
        </div>
      </div>

      <!-- Bottom Row: Date (only if no author) -->
      <div v-else class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
        <span>{{ formatDate(quote.created_at) }}</span>
      </div>
    </div>

    <!-- Quick Actions Drawer (opens on long-press) -->
    <QuoteActionsDrawer
      v-model:open="actionsOpen"
      :submitting="submitting"
      status="draft"
      :show-edit="true"
      :show-submit="true"
      :show-delete="true"
      @edit="handleEditFromDrawer"
      @submit="handleSubmitFromDrawer"
      @delete="handleDeleteFromDrawer"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProcessedQuoteResult } from '~/types'

interface Props {
  quote: ProcessedQuoteResult
  showAvatar?: boolean
}

interface Emits {
  (e: 'edit', quote: ProcessedQuoteResult): void
  (e: 'submit', quote: ProcessedQuoteResult): void
  (e: 'delete', quote: ProcessedQuoteResult): void
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
})

const emit = defineEmits<Emits>()

const submitting = ref(false)

// Quick actions state (opened via contextmenu)
const actionsOpen = ref(false)

const handleEdit = () => {
  if (actionsOpen.value) return
  emit('edit', props.quote)
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    emit('submit', props.quote)
  } finally {
    submitting.value = false
  }
}

const handleDelete = () => {
  emit('delete', props.quote)
}

// Actions from drawer
const handleEditFromDrawer = () => {
  actionsOpen.value = false
  emit('edit', props.quote)
}

const handleSubmitFromDrawer = async () => {
  actionsOpen.value = false
  await handleSubmit()
}

const handleDeleteFromDrawer = () => {
  actionsOpen.value = false
  handleDelete()
}

const dropdownActions = computed(() => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => handleEdit()
  },
  {
    label: 'Submit for Review',
    leading: 'i-ph-paper-plane-tilt',
    onclick: () => handleSubmit()
  },
  {}, // Divider
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => handleDelete()
  }
])

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

const formatReferenceType = (type: string) => {
  if (!type) return ''
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInHours < 48) {
    return 'Yesterday'
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
}
</script>

<style scoped>
.draft-quote-card {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
              background-color 0.2s ease-in-out,
              box-shadow 0.2s ease-in-out,
              border-color 0.2s ease-in-out;
}

.draft-quote-card:active {
  animation: pulseOut 0.3s ease-out forwards;
}

@keyframes pulseOut {
  0% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}
</style>
