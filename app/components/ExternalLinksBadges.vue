<template>
  <div v-if="entries.length" class="text-center pt-4 border-t b-dashed border-gray-200 dark:border-gray-700" :class="$attrs.class">
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

const defaultBadgeClasses = 'bg-transparent border border-gray-200 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'
const badgeColors: Record<string, string> = {
  netflix: 'hover:border-[#E50914] hover:text-[#E50914] hover:bg-[#E50914]/5',
  imdb: 'hover:border-[#F5C518] hover:text-[#F5C518] hover:bg-[#F5C518]/5',
  instagram: 'hover:border-[#C32AA3] hover:text-[#C32AA3] hover:bg-[#C32AA3]/5',
  twitter: 'hover:border-[#1DA1F2] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/5',
  youtube: 'hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#FF0000]/5',
  facebook: 'hover:border-[#1877F2] hover:text-[#1877F2] hover:bg-[#1877F2]/5',
  twitch: 'hover:border-[#9146FF] hover:text-[#9146FF] hover:bg-[#9146FF]/5',
  website: 'hover:border-[#0046FF] hover:text-[#0046FF] hover:bg-[#0046FF]/5',
  wikipedia: 'hover:border-[#4B4B4B] hover:text-[#4B4B4B] hover:bg-[#4B4B4B]/5',
  prime_video: 'hover:border-[#00A859] hover:text-[#00A859] hover:bg-[#00A859]/5',
  linkedin: 'hover:border-[#0A66C2] hover:text-[#0A66C2] hover:bg-[#0A66C2]/5',
}

// Normalize input to [key,url][] and keep only known labels for consistency
const entries = computed(() => {
  const raw = props.links
  if (!raw) return [] as Array<[string, string]>

  // Normalize to an entries array regardless of input shape
  const toPairs = (src: Record<string, any>): Array<[string, string]> =>
    Object.entries(src)
      .map(([k, v]) => [String(k).toLowerCase().trim(), String(v ?? '')] as [string, string])
      .filter(([k, v]) => !!k && !!v)

  let pairs: Array<[string, string]> = []

  if (Array.isArray(raw)) {
    pairs = raw
      .map((it) => [String(it.key || it.platform || '').toLowerCase().trim(), String(it.url || '')] as [string, string])
      .filter(([k, v]) => !!k && !!v)
  } else if (typeof raw === 'object') {
    pairs = toPairs(raw)
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null) {
        pairs = toPairs(parsed)
      }
    } catch {}
  }

  const excludedKeys = new Set(['image', 'imageName', 'official'])
  return pairs.filter(([k]) => Object.hasOwn(linkLabels, k) && !excludedKeys.has(k))
})
</script>
