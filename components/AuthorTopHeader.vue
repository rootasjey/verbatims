<template>
  <!-- Sticky Top Header: compact title + stats/actions -->
  <div class="sticky top-[60px] md:top-[68px] z-2 border-y border-dashed border-gray-200/80 dark:border-gray-800/80 bg-[#FAFAF9] dark:bg-[#0C0A09]/70 backdrop-blur supports-backdrop-blur:backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: compact author title and context -->
        <div @click.stop="scrollToTop" class="min-w-0 flex items-center gap-3">
          <UIcon name="i-ph-person-simple-hike-duotone" class="w-5 h-5 text-gray-400" />
          <div class="truncate">
            <div class="text-sm font-serif text-gray-900 dark:text-white truncate">{{ headerTitle }}</div>
            <div class="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <template v-if="author.job">
                <span class="truncate">{{ author.job }}</span>
              </template>
              <template v-else-if="author.birth_date || author.death_date">
                <span class="truncate">{{ formatLifeDates(author.birth_date, author.death_date) }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Middle: stats chips -->
        <div class="hidden md:flex items-center gap-2">
          <UTooltip content="View count" :_tooltip-content="{ side: 'bottom' }">
            <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-xs sm:text-xs text-gray-600 dark:text-gray-300">
              <UIcon name="i-ph-eye-duotone" class="w-3.5 h-3.5" />
              <span class="font-medium">{{ formatNumber(author.views_count || 0) }}</span>
            </div>
          </UTooltip>

          <UTooltip content="Share count" :_tooltip-content="{ side: 'bottom' }">
            <UButton
              btn="~"
              size="xs"
              :disabled="sharePending"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
              @click="shareAuthor"
            >
              <UIcon name="i-ph-share-network-duotone" class="w-3.5 h-3.5 mr-1" />
              <span :class="[sharePending && 'animate-pulse']">{{ formatNumber(author.shares_count || 0) }}</span>
            </UButton>
          </UTooltip>

          <UTooltip content="Like count" :_tooltip-content="{ side: 'bottom' }">
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
              @click="toggleLike"
            >
              <UIcon :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-hand-heart-duotone'" :class="['w-3.5 h-3.5 mr-1', likePending && 'animate-pulse']" />
              <span>{{ formatNumber(author.likes_count || 0) }}</span>
            </UButton>
          </UTooltip>
        </div>

        <!-- Right: quick actions -->
        <div class="flex items-center gap-2">
          <UTooltip content="Copy link to author" :_tooltip-content="{ side: 'bottom' }">
            <UButton
              :btn="copyState === 'copied' ? 'soft-green' : 'soft-gray'"
              size="xs"
              class="min-w-0 min-h-0 h-auto w-auto px-2.5 py-1 rounded-full"
              @click="copyLink"
            >
              <UIcon :name="copyState === 'copied' ? 'i-ph-check' : 'i-ph-link'" class="w-3.5 h-3.5 mr-1" />
              <span class="hidden sm:inline">{{ copyState === 'copied' ? 'Copied' : 'Copy' }}</span>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="headerMenuItems" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
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

<script lang="ts" setup>
import type { AuthorWithSocials } from '~/types/author'

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
  headerMenuItems: HeaderMenuItem[]
  sharePending: boolean
  likePending: boolean
  isLiked: boolean
  user: HeaderUser | null
  copyState: 'idle' | 'copying' | 'copied'
  // Functions passed from parent
  formatLifeDates: (birthDate?: string | null, deathDate?: string | null) => string
  formatNumber: (num?: number | null) => string
  scrollToTop: () => void
  shareAuthor: () => void
  toggleLike: () => void
  copyLink: () => void
}

defineProps<Props>()
</script>
