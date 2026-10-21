<template>
  <!-- Sticky Top Header: compact title + actions -->
  <Transition name="reference-context-bar">
  <div v-if="visible" class="sticky top-[60px] z-2 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: compact author title and context -->
        <div @click.stop="$emit('scroll-to-top')" class="min-w-0 flex items-center gap-3">
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

          <img
            v-if="author.image_url"
            :src="author.image_url"
            :alt="author.name"
            class="h-6 w-6 shrink-0 rounded object-cover"
          />

          <div class="truncate">
            <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
            <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <template v-if="author.job">
                <span class="truncate">{{ author.job }}</span>
              </template>
              <template v-else-if="author.birth_year || author.birth_date || author.death_year || author.death_date">
                <span class="truncate">{{ formatLifeDates(author) }}</span>
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

interface HeaderMenuItem {
  label: string
  leading?: string
  onclick: () => void
}

interface HeaderUser {
  id: number
  name: string
  role: 'admin' | 'moderator' | 'user'
}

interface Props {
  author: AuthorWithSocials
  headerTitle: string
  visible?: boolean
  headerMenuItems: HeaderMenuItem[]
  sharePending: boolean
  likePending: boolean
  isLiked: boolean
  user: HeaderUser | null
  copyState: 'idle' | 'copying' | 'copied'
  // Functions passed from parent
  formatLifeDates: (author: Pick<Author, 'birth_date' | 'birth_year' | 'birth_era' | 'birth_month' | 'birth_day' | 'birth_is_approximate' | 'birth_calendar' | 'death_date' | 'death_year' | 'death_era' | 'death_month' | 'death_day' | 'death_is_approximate' | 'death_calendar'>) => string
  formatNumber: (num?: number | null) => string
}

interface Emits {
  (e: 'navigate-back'): void
  (e: 'scroll-to-top'): void
  (e: 'share-author'): void
  (e: 'toggle-like'): void
  (e: 'copy-link'): void
  (e: 'scroll-to-quotes'): void
}

withDefaults(defineProps<Props>(), {
  visible: false
})
defineEmits<Emits>()
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
