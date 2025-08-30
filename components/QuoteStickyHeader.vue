<template>
  <!-- Sticky Top Header: compact title + stats/actions -->
  <div v-if="quote" class="sticky top-[60px] md:top-[68px] z-30 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: compact quote title and context -->
        <div class="min-w-0 flex items-center gap-3">
          <UIcon name="i-ph-quotes" class="w-5 h-5 text-gray-400" />
          <div class="truncate">
            <div class="text-sm font-serif text-gray-900 dark:text-white truncate">"{{ headerTitle }}"</div>
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
                  <UIcon :name="getReferenceIcon(quote.reference.primary_type)" class="w-3 h-3 mr-1 text-gray-400" />
                  <span class="truncate">{{ quote.reference.name }}</span>
                </NuxtLink>
              </template>
              <span v-else>{{ getLanguageName(quote.language) }}</span>
            </div>
          </div>
        </div>

        <!-- Middle: stats chips -->
        <div class="hidden md:flex items-center gap-2">
          <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
            <UIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
            <span class="font-medium">{{ formatNumber(quote.views_count || 0) }}</span>
          </div>

          <UButton
            btn="~"
            size="xs"
            :disabled="sharePending"
            class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
            @click="$emit('share')"
          >
            <UIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
            <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(quote.shares_count || 0) }}</span>
          </UButton>

          <UButton
            btn="~"
            size="xs"
            :disabled="!user || likePending"
            :class="[
              'min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full',
              isLiked
                ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                : 'text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20',
              !user && 'cursor-not-allowed opacity-50'
            ]"
            @click="$emit('toggle-like')"
          >
            <UIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart-duotone'" :class="['w-3.5 h-3.5 mr-1', likePending && 'animate-pulse']" />
            <span>{{ formatNumber(quote.likes_count || 0) }}</span>
          </UButton>
        </div>

        <!-- Right: quick actions -->
        <div class="flex items-center gap-2">
          <UButton
            :btn="copyState === 'copied' ? 'soft-green' : 'soft-gray'"
            size="xs"
            class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
            @click="$emit('copy-link')"
          >
            <UIcon :name="copyState === 'copied' ? 'i-ph-check' : 'i-ph-link'" class="w-3.5 h-3.5 mr-1" />
            <span class="hidden sm:inline">{{ copyState === 'copied' ? 'Copied' : 'Copy' }}</span>
          </UButton>

          <UButton
            :btn="savedState === 'saved' ? 'soft-green' : 'soft-blue'"
            size="xs"
            :disabled="!user"
            class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
            @click="$emit('add-to-collection')"
          >
            <UIcon :name="savedState === 'saved' ? 'i-ph-check' : 'i-ph-bookmark-simple'" class="w-3.5 h-3.5 mr-1" />
            <span class="hidden sm:inline">{{ savedState === 'saved' ? 'Saved' : 'Save' }}</span>
          </UButton>

          <UDropdownMenu :items="menuItems" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
            <UButton
              icon
              btn="ghost-gray"
              label="i-ph-dots-three-vertical-bold"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              title="More actions"
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  quote: { type: Object, required: true },
  user: { type: Object, default: null },
  isLiked: { type: Boolean, default: false },
  likePending: { type: Boolean, default: false },
  sharePending: { type: Boolean, default: false },
  savedState: { type: String, default: 'idle' },
  copyState: { type: String, default: 'idle' },
  menuItems: { type: Array, default: () => [] }
})

defineEmits(['share', 'toggle-like', 'add-to-collection', 'copy-link'])

const headerTitle = computed(() => {
  const text = props.quote?.name || ''
  return text.length > 80 ? text.slice(0, 80) + '…' : text
})
</script>
