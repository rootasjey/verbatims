<template>
  <NuxtLink
    :to="`/authors/${author.id}`"
    class="flex items-center justify-between gap-3 p-3 rounded-2 border border-gray-100 dark:border-dark-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
  >
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="truncate text-sm font-600 text-gray-900 dark:text-white">
          {{ author.name }}
        </span>
        <NTooltip v-if="author.is_fictional">
          <template #default>
            <NIcon name="i-ph-asterisk-bold" size="xs" class="text-primary hover:animate-spin" />
          </template>
          <template #content>
            <div class="text-sm">
              This author is fictional
            </div>
          </template>
        </NTooltip>
      </div>
      <p
        v-if="author.is_fictional && author.origin_reference_name"
        class="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5"
      >
        from {{ author.origin_reference_name }}
      </p>
      <p v-else-if="author.job" class="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {{ author.job }}
      </p>
    </div>
    <NIcon name="i-ph-caret-right" class="w-4 h-4 text-gray-400 flex-shrink-0" />
  </NuxtLink>
</template>
          <template #content>
            <div class="text-sm">
              This author is fictional
            </div>
          </template>
        </NTooltip>
      </div>
      <p
        v-if="author.is_fictional && author.origin_reference_name"
        class="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5"
      >
        from {{ author.origin_reference_name }}
      </p>
      <p v-else-if="author.job" class="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {{ author.job }}
      </p>
    </div>
    <NIcon name="i-ph-caret-right" class="w-4 h-4 text-gray-400 flex-shrink-0" />
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Author } from '~/types'

interface Props {
  author: Author
}

defineProps<Props>()
</script>
