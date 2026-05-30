<template>
  <NuxtLink
    :to="`/authors/${author.id}`"
    class="group p-4 cursor-pointer flex flex-col no-underline rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 active:scale-[0.99] transition-all duration-200"
  >
    <div class="flex items-start gap-3">
      <NAvatar
        :src="author.image_url || undefined"
        :alt="author.name"
        size="sm"
        :fallback="getAuthorInitials(author.name)"
        class="mt-0.5 shrink-0"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="font-subtitle text-base font-600 text-gray-900 dark:text-white truncate">
            {{ author.name }}
          </h3>
          <NBadge
            v-if="author.is_fictional"
            badge="outline-purple"
            size="xs"
            class="shrink-0"
          >
            Fictional
          </NBadge>
        </div>
        <p v-if="author.job" class="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {{ author.job }}
        </p>
        <p v-else-if="!author.is_fictional && (author.birth_date || author.death_date)" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ formatLifeDates(author.birth_date, author.death_date) }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-3 mt-3 pt-3 text-xs text-gray-400 dark:text-gray-500">
      <span>{{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
      <span>·</span>
      <span>{{ formatNumber(author.views_count || 0) }} views</span>
      <span>·</span>
      <span>{{ formatNumber(author.likes_count || 0) }} likes</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  author: Author
}

defineProps<Props>()

const getAuthorInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatLifeDates = (birthDate?: string | null, deathDate?: string | null): string => {
  if (!birthDate && !deathDate) return ''
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  return `${birth} - ${death}`
}

const formatNumber = (num?: number | null): string => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>
