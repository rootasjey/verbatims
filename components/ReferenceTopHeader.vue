<template>
  <div class="sticky top-[60px] md:top-[68px] z-2 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: compact reference title and context -->
        <div @click.stop="$emit('scroll-top')" class="min-w-0 flex items-center gap-3">
          <NTooltip content="Back to references list" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              icon
              btn="ghost-gray"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto p-1 rounded-full"
              @click.stop="$emit('navigate-back')"
            >
              <NIcon name="i-ph-arrow-left-bold" />
            </NButton>
          </NTooltip>

          <NIcon name="i-ph-book" class="w-5 h-5 text-gray-400" />
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

        <!-- Middle: stats chips -->
        <div class="hidden md:flex items-center gap-2">
          <NTooltip content="View count" :_tooltip-content="{ side: 'bottom' }">
            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
              <NIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
              <span class="font-medium">{{ formatNumber(reference.views_count || 0) }}</span>
            </div>
          </NTooltip>

          <NTooltip content="Share count" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              btn="~"
              size="xs"
              :disabled="sharePending"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
              @click="$emit('share')"
            >
              <NIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
              <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(reference.shares_count || 0) }}</span>
            </NButton>
          </NTooltip>

          <NTooltip content="Like count" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              btn="~"
              size="xs"
              :disabled="!hasUser || likePending"
              :class="[
                'min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full',
                isLiked
                  ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                  : 'text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-900/20',
                !hasUser && 'cursor-not-allowed opacity-50'
              ]"
              @click="$emit('toggle-like')"
            >
              <NIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'" :class="['w-3.5 h-3.5 mr-1', likePending && 'animate-pulse']" />
              <span>{{ formatNumber(reference.likes_count || 0) }}</span>
            </NButton>
          </NTooltip>
        </div>

        <!-- Right: quick actions -->
        <div class="flex items-center gap-2">
          <NTooltip content="Copy link to reference" :_tooltip-content="{ side: 'bottom' }">
            <NButton
              :btn="copyState === 'copied' ? 'soft-green' : 'soft-gray'"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              @click="$emit('copy-link')"
            >
              <NIcon :name="copyState === 'copied' ? 'i-ph-check' : 'i-ph-link'" class="w-3.5 h-3.5 mr-1" />
              <span class="hidden sm:inline">{{ copyState === 'copied' ? 'Copied' : 'Copy' }}</span>
            </NButton>
          </NTooltip>

          <NDropdownMenu :items="headerMenuItems" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
            <NButton
              icon
              btn="ghost-gray"
              label="i-ph-dots-three-vertical-bold"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              title="More actions"
            />
          </NDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { QuoteReference } from '~/types'

interface Props {
  headerTitle: string
  reference: QuoteReference
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
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
</style>
