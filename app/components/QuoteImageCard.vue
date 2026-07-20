<template>
  <!-- Fixed-size square card meant for image export -->
  <div
    :style="containerStyle"
    :class="[
      'relative select-none overflow-hidden rounded-[36px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
      'flex flex-col items-center justify-between',
      borderClass,
      themeClasses.container,
    ]"
  >
    <!-- Background image layer -->
    <img v-if="isPhotoBackground && bgImageUrl" :src="bgImageUrl" class="absolute inset-0 w-full h-full object-cover" crossorigin="anonymous" />

    <!-- Dark gradient (bottom-to-top for text readability) -->
    <div v-if="isPhotoBackground && bgImageUrl" class="absolute inset-0" :style="{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.1) 100%)' }" />

    <!-- Inner padding wrapper -->
    <div :class="['w-full flex-1 flex flex-col items-center justify-center px-[72px] pt-[84px] pb-[48px] text-center', isPhotoBackground ? 'relative z-10' : '']">
      <!-- Quote text -->
      <blockquote
        :class="[
          'font-serif font-400 leading-tight tracking-tight',
          // keep sizes readable across various quote lengths
          textSizeClass,
          themeClasses.quote,
        ]"
        style="font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;"
      >
        {{ quote.name }}
      </blockquote>

      <!-- Author and Reference -->
      <div class="mt-[56px] flex flex-col items-center">
        <div v-if="authorImage && props.background !== 'author-image'" class="w-[120px] h-[120px] rounded-full overflow-hidden border-4" :class="themeClasses.avatarBorder" :style="{ borderColor: accentColor }">
          <img
            :src="authorImage"
            :alt="String($t('components.dialogs.author_label'))"
            class="w-full h-full object-cover"
            crossorigin="anonymous"
          />
        </div>

        <div class="mt-5 text-center">
          <div :class="['font-subtitle tracking-widest text-2xl font-600', themeClasses.author]" style="font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;">
            {{ authorName }}
          </div>
          <div v-if="referenceName"
            :class="['font-subtitle tracking-widest text-xl border-t-2 mt-2 pt-2', isPhotoBackground ? 'border-white/20' : 'border-gray-300 dark:border-gray-600', themeClasses.reference]"
            style="font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;">
            {{ referenceName }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { getRandomTagBorderColor } from '~~/shared/constants/tag'

const { $t } = useI18n()

interface Props {
  quote: QuoteWithRelations
  theme?: 'light' | 'dark'
  size?: { width: number; height: number }
  background?: 'solid' | 'transparent' | 'author-image' | 'reference-image'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  size: () => ({ width: 1080, height: 1080 }),
  background: 'solid'
})

const authorName = computed(() => props.quote.author?.name || 'Unknown')
const referenceName = computed(() => props.quote.reference?.name || '')
const authorImage = computed(() => props.quote.author?.image_url || '')
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase())
const accentColor = computed(() => getRandomTagBorderColor(props.quote.tags))

const isPhotoBackground = computed(() =>
  props.background === 'author-image' || props.background === 'reference-image'
)

const bgImageUrl = computed(() => {
  if (props.background === 'author-image') return props.quote.author?.image_url || ''
  if (props.background === 'reference-image') return props.quote.reference?.image_url || ''
  return ''
})

const borderClass = computed(() =>
  isPhotoBackground.value ? 'border-0' : 'border-[18px]'
)

const containerStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${props.size.width}px`,
    height: `${props.size.height}px`,
  }
  if (isPhotoBackground.value) {
    style.borderColor = 'transparent'
  } else {
    style.borderColor = accentColor.value
  }
  return style
})

// Adjust quote text size depending on length a bit to avoid overflow
const textSizeClass = computed(() => {
  const len = props.quote.name?.length || 0
  if (len > 240) return 'text-4xl'
  if (len > 180) return 'text-5xl'
  if (len > 120) return 'text-6xl'
  if (len > 80) return 'text-7xl'
  return 'text-8xl'
})

const themeClasses = computed(() => {
  const photo = isPhotoBackground.value
  if (props.theme === 'dark' || photo) {
    return {
      container: [props.background === 'transparent' ? 'bg-transparent' : 'bg-[#0C0A09]'].join(' '),
      quote: 'text-white',
      author: 'text-white',
      reference: 'text-gray-300',
      avatarBorder: 'bg-[#111111]',
      avatarFallback: 'text-white bg-[#111111]',
    }
  }
  return {
    container: [props.background === 'transparent' ? 'bg-transparent' : 'bg-[#F3F4F6]'].join(' '),
    quote: 'text-gray-900',
    author: 'text-gray-900',
    reference: 'text-gray-700',
    avatarBorder: 'bg-white',
    avatarFallback: 'text-gray-800 bg-white',
  }
})
</script>
