<template>
  <Transition name="reference-context-bar">
  <div v-if="visible" class="sticky top-[60px] z-2 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: compact reference title and context -->
        <div @click.stop="$emit('scroll-top')" class="min-w-0 flex items-center gap-3">
          <NTooltip :content="$t('components.quote_sticky.back') as string" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              icon
              btn="ghost-gray"
              size="xs"
              class="flex min-w-0 min-h-0 h-auto w-auto p-1 rounded-full"
              @click.stop="$emit('navigate-back')"
            >
              <NIcon name="i-lucide-chevron-left" />
            </NButton>
          </NTooltip>

          <!-- optional poster thumbnail -->
          <template v-if="props.posterUrl">
            <NTooltip :content="$t('components.dialogs.poster_preview') as string" :_tooltip-content="{ side: 'bottom' }">
              <img
                ref="posterEl"
                role="button"
                tabindex="0"
                :aria-label="`${$t('components.dialogs.poster_preview')}`"
                :src="props.posterUrl"
                :alt="props.posterAlt || ''"
                class="w-6 h-6 object-cover rounded cursor-pointer
                  hover:scale-105 hover:shadow-xl
                  active:scale-99 active:shadow-none
                  transition-transform duration-200"
                @click.stop="emit('open-poster')"
                @keyup.enter.prevent="emit('open-poster')"
                @keyup.space.prevent="emit('open-poster')"
              />
            </NTooltip>
          </template>

          <div class="truncate">
            <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
            <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <template v-if="reference.secondary_type">
                <span class="truncate">{{ reference.secondary_type }}</span>
              </template>
              <template v-else-if="reference.primary_type || reference.release_date">
                <span class="truncate">
                  {{ formatType(reference.primary_type) }}
                  <template v-if="reference.release_date"> • {{ formatReleaseDate(reference.release_date) }}</template>
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- Right: quick actions -->
        <div class="flex items-center gap-2">
          <NTooltip :content="$t('components.quote_sticky.copy_link') as string" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              :btn="copyState === 'copied' ? 'soft-green' : 'soft-gray'"
              size="xs"
              class="hidden md:flex min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              @click="$emit('copy-link')"
            >
              <NIcon :name="copyState === 'copied' ? 'i-ph-check' : 'i-ph-link'" class="w-3.5 h-3.5 mr-1" />
              <span class="hidden sm:inline">{{ copyState === 'copied' ? $t('components.quote_sticky.copied') : $t('components.quote_sticky.copy') }}</span>
            </NButton>
          </NTooltip>

          <NButton
            size="xs"
            btn="soft-gray"
            class="md:hidden min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
            @click="$emit('scroll-to-quotes')"
          >
            <NIcon name="i-ph-quotes" class="w-3.5 h-3.5 mr-1" />
            <span class="hidden sm:inline">{{ $t('common.quote_plural') }}</span>
          </NButton>

          <NDropdownMenu :items="headerMenuItems" :modal="false" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
            <NButton
              icon
              btn="ghost-gray"
              label="i-ph-dots-three-vertical-bold"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              :title="$t('components.quote_sticky.more') as string"
            />
          </NDropdownMenu>
        </div>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script lang="ts" setup>
const { $t } = useI18n()

interface Props {
  headerTitle: string
  reference: QuoteReference
  // optional poster thumbnail shown before the title
  posterUrl?: string
  posterAlt?: string
  visible?: boolean
  sharePending?: boolean
  likePending?: boolean
  isLiked?: boolean
  hasUser?: boolean
  copyState?: 'idle' | 'copied' | 'error'
  headerMenuItems?: Array<{
    label?: string
    leading?: string
    onclick?: () => void
  }>
  // formatters passed down from parent to keep behavior identical
  formatNumber: (num: number) => string
  formatType: (type: string) => string
  formatReleaseDate: (dateStr: string) => string
}

interface Emits {
  (e: 'share'): void
  (e: 'toggle-like'): void
  (e: 'copy-link'): void
  (e: 'scroll-top'): void
  (e: 'navigate-back'): void
  (e: 'open-poster'): void
  (e: 'scroll-to-quotes'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})
const emit = defineEmits<Emits>()

// expose internal element so parents can restore focus when needed
const posterEl = ref<HTMLElement | null>(null)
defineExpose({ posterEl })
</script>

<style scoped>
.reference-context-bar-enter-active,
.reference-context-bar-leave-active {
  transition: opacity 220ms ease-out, transform 220ms ease-out;
}

.reference-context-bar-enter-from,
.reference-context-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
