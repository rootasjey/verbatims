<template>
  <div v-if="entries.length" class="text-center" :class="$attrs.class">
    <h3 v-if="title" class="font-serif text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
    <div class="flex flex-wrap justify-center gap-3">
      <NBadge
        v-for="([key, url], i) in entries"
        :key="`${key}-${i}`"
        external
        rounded="full"
        size="sm"
        badge="~"
        class="hover:scale-102 active:scale-99 transition-transform duration-200 ease-in-out cursor-pointer"
        :class="badgeColors[key] || defaultBadgeClasses"
      >
        <NLink :to="url" target="_blank" class="flex items-center gap-2">
          <NIcon :name="linkIcons[key] || 'i-ph-link'" />
          <span>{{ linkLabels[key] || key }}</span>
        </NLink>
      </NBadge>
    </div>
  </div>
  <div v-else class="hidden" />
  <!-- keep root stable even when empty -->
</template>

<script lang="ts" setup>
type LinkItem = { platform?: string; key?: string; url?: string | null | undefined }

interface Props {
  // Accept either a record of key->url (nullable supported) or an array of items with platform/key + url
  links: Record<string, string | null | undefined> | LinkItem[] | null | undefined
  // Optional title displayed above the badges
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined
})

const linkLabels: Record<string, string> = {
  wikipedia: 'Wikipedia',
  imdb: 'IMDb',
  netflix: 'Netflix',
  website: 'Official Site',
  facebook: 'Facebook',
  twitter: 'Twitter',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitch: 'Twitch',
  prime_video: 'Prime Video',
  amazon: 'Amazon',
  linkedin: 'LinkedIn',
}

const linkIcons: Record<string, string> = {
  amazon: 'i-ph-shopping-cart',
  facebook: 'i-ph-facebook-logo',
  image: 'i-ph-image',
  imdb: 'i-ph-film-slate',
  instagram: 'i-ph-instagram-logo',
  linkedin: 'i-ph-linkedin-logo',
  netflix: 'i-tabler-brand-netflix',
  prime_video: 'i-ph-video-camera',
  twitch: 'i-ph-twitch-logo',
  twitter: 'i-ph-twitter-logo',
  website: 'i-ph-globe-hemisphere-west-bold',
  wikipedia: 'i-ph-book-bookmark-duotone',
  youtube: 'i-ph-youtube-logo',
}

const defaultBadgeClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
const badgeColors: Record<string, string> = {
  netflix: 'hover:bg-[#E50914]/100 text-white bg-gray-900',
  imdb: 'hover:bg-[#F5C518]/100 text-white bg-gray-900',
  instagram: 'hover:bg-[#C32AA3]/100 text-white bg-gray-900',
  twitter: 'hover:bg-[#1DA1F2]/100 text-white bg-gray-900',
  youtube: 'hover:bg-[#FF0000]/100 text-white bg-gray-900',
  facebook: 'hover:bg-[#1877F2]/100 text-white bg-gray-900',
  twitch: 'hover:bg-[#9146FF]/100 text-white bg-gray-900',
  website: 'hover:bg-[#0046FF]/100 text-white bg-gray-900',
  wikipedia: 'hover:bg-[#4B4B4B]/100 text-white bg-gray-900',
  prime_video: 'hover:bg-[#00A859]/100 text-white bg-gray-900',
  linkedin: 'hover:bg-[#0A66C2]/100 text-white bg-gray-900',
}

// Normalize input to [key,url][] and keep only known labels for consistency
const entries = computed(() => {
  const src = props.links
  if (!src) return [] as Array<[string, string]>

  let pairs: Array<[string, string]> = []
  if (Array.isArray(src)) {
    pairs = src
      .map((it) => [String(it.key || it.platform || '').toLowerCase().trim(), String(it.url || '')] as [string, string])
      .filter(([k, u]) => !!k && !!u)
  } else if (typeof src === 'object') {
    pairs = Object.entries(src)
      .map(([k, u]) => [String(k).toLowerCase().trim(), String(u || '')] as [string, string])
      .filter(([k, u]) => !!k && !!u)
  }

  // Only keep keys we have labels for, to match design intent
  return pairs.filter(([k]) => k in linkLabels)
})
</script>
