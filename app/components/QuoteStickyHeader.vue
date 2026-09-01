<template>
  <!-- Sticky Top Header: compact title + stats/actions -->
  <Transition name="quote-context-bar">
  <div v-if="quote && visible" class="sticky top-[60px] md:top-[60px] z-1 bg-[#F7F5EF]/95 dark:bg-[#0C0A09]/95 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex flex-wrap items-center justify-between gap-1.5 md:gap-3">
        <!-- Left: compact quote title and context (hidden on mobile — visible in hero below) -->
        <div class="hidden md:flex min-w-0 items-center gap-3">
            <NTooltip :content="String($t('components.quote_sticky.back'))" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              icon
              btn="ghost-gray"
              size="xs"
              class="hidden sm:inline min-w-0 min-h-0 h-auto w-auto p-1 rounded-full"
              @click.stop="$emit('navigate-back')"
            >
              <NIcon name="i-ph-arrow-left-bold" />
            </NButton>
          </NTooltip>
          <div class="truncate">
            <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
            <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <template v-if="quote.author || quote.reference">
                <NuxtLink
                  v-if="quote.author"
                  :to="`/authors/${quote.author.id}`"
                  class="truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {{ quote.author.name }}
                </NuxtLink>
                <span v-if="quote.author && quote.reference" aria-hidden="true" class="mx-1">•</span>
                <NuxtLink
                  v-if="quote.reference"
                  :to="`/references/${quote.reference.id}`"
                  class="inline-flex items-center truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <NIcon :name="getReferenceIcon(quote.reference.primary_type)" class="w-3 h-3 mr-1 text-gray-400" />
                  <span class="truncate">{{ quote.reference.name }}</span>
                </NuxtLink>
              </template>
              <span v-else>{{ getLanguageName(quote.language) }}</span>
            </div>
          </div>
        </div>

        <!-- Mobile back control -->
        <div class="flex items-center md:hidden">
          <NTooltip :content="String($t('components.quote_sticky.back'))" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              icon
              btn="soft-gray"
              size="xs"
              label="i-lucide-chevron-left"
              class="md:hidden min-w-0 min-h-0 p-1 h-auto w-auto rounded-full"
              @click.stop="$emit('navigate-back')"
            />
          </NTooltip>

      </div>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps({
  quote: { type: Object, required: true },
  user: { type: Object, default: null },
  isLiked: { type: Boolean, default: false },
  likePending: { type: Boolean, default: false },
  sharePending: { type: Boolean, default: false },
  savedState: { type: String, default: 'idle' },
  copyState: { type: String, default: 'idle' },
  menuItems: { type: Array, default: () => [] },
  visible: { type: Boolean, default: false }
})

const { $t } = useI18n()

defineEmits(['share', 'toggle-like', 'add-to-collection', 'copy-link', 'navigate-back'])

const headerTitle = computed(() => {
  const text = props.quote?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})
</script>
