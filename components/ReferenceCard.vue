<template>
  <div
    class="relative cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-99"
    @click="$emit('click')"
  >
    <div class="relative w-full h-32 rounded-2xl overflow-hidden shadow-lg">
      <div
        class="absolute inset-0 rounded-2xl"
        :style="getCardBackground(reference)"
      />
      <!-- Overlay for better text readability -->
      <div class="absolute rounded-2xl inset-0 opacity-100 group-hover:opacity-20 transition-opacity" :style="{ background: getCardBackgroundColor(reference) }"></div>

      <div class="absolute group-hover:hidden inset-0 p-4 flex flex-col justify-between">
        <h3 class="text-white font-bold text-sm leading-tight line-clamp-2">
          {{ reference.name }}
        </h3>

        <div class="flex items-center justify-between">
          <span class="text-white/90 text-xs">
            {{ getTypeDisplay(reference) }}
          </span>
          <div class="shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <UIcon :name="getTypeIcon(reference.primary_type)" class="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { QuoteReference, QuoteReferencePrimaryType } from '~/types'

interface Props {
  reference: QuoteReference
}

defineProps<Props>()
defineEmits<{ (e: 'click'): void }>()

// Color palette for reference cards (mood-like gradients)
// Expanded to cover all QuoteReferencePrimaryType values
const referenceGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 0 Purple-Blue (book)
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 1 Pink-Red (film)
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // 2 Blue-Cyan (tv_series / game)
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // 3 Green-Teal (music)
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // 4 Pink-Yellow
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // 5 Teal-Pink (podcast)
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // 6 Peach (interview)
  'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)', // 7 Red-Purple (documentary)
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // 8 Pink-Lavender Blue (media_stream)
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // 9 Mint-Blue (writings)
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', // 10 Orange-Yellow (speech)
  'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', // 11 Silver (other)
] as const

const gradientByType: Record<QuoteReferencePrimaryType, string> = {
  book: referenceGradients[0],
  film: referenceGradients[1],
  tv_series: referenceGradients[2],
  music: referenceGradients[3],
  speech: referenceGradients[10],
  podcast: referenceGradients[5],
  interview: referenceGradients[6],
  documentary: referenceGradients[7],
  media_stream: referenceGradients[8],
  writings: referenceGradients[9],
  video_game: referenceGradients[2],
  other: referenceGradients[11],
}

const getCardBackground = (reference: QuoteReference): CSSProperties => {
  if (reference.image_url) {
    return {
      backgroundImage: `url(${reference.image_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  const typeKey = (reference.primary_type || 'other') as QuoteReferencePrimaryType
  if (typeKey in gradientByType) {
    return { background: gradientByType[typeKey] }
  }

  // Fallback: stable hash of type to choose a gradient deterministically
  const fallbackKey = String(typeKey).toLowerCase()
  let hash = 0
  for (let i = 0; i < fallbackKey.length; i++) {
    hash = (hash << 5) - hash + fallbackKey.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % referenceGradients.length
  return { background: referenceGradients[index] }
}

const getCardBackgroundColor = (reference: QuoteReference): string => {
  const typeKey = (reference.primary_type || 'other') as QuoteReferencePrimaryType

  if (typeKey in gradientByType) {
    return gradientByType[typeKey]
  }

  // Fallback: stable hash of type string (future-proof if new types appear)
  const fallbackKey = String(typeKey).toLowerCase()
  let hash = 0
  for (let i = 0; i < fallbackKey.length; i++) {
    hash = (hash << 5) - hash + fallbackKey.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % referenceGradients.length
  return referenceGradients[index]
}

const getTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    book: 'i-ph-book',
    film: 'i-ph-film-strip',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone-stage',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video-camera',
    media_stream: 'i-ph-play-circle',
    writings: 'i-ph-article',
    video_game: 'i-ph-game-controller',
    other: 'i-ph-file',
  }
  return iconMap[type] || 'i-ph-file'
}

const getTypeDisplay = (reference: QuoteReference) => {
  if (reference.secondary_type) {
    return reference.secondary_type
  }

  const typeMap: Record<string, string> = {
    book: 'Book',
    film: 'Film',
    tv_series: 'TV Series',
    music: 'Music',
    speech: 'Speech',
    podcast: 'Podcast',
    interview: 'Interview',
    documentary: 'Documentary',
    media_stream: 'Stream',
    writings: 'Writing',
    video_game: 'Game',
    other: 'Other',
  }
  return typeMap[reference.primary_type] || 'Reference'
}
</script>
