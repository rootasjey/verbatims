<template>
  <!-- Fixed-size square card meant for image export -->
  <div
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="[
      'relative select-none overflow-hidden rounded-[36px] border-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
      'flex flex-col items-center justify-between',
      themeClasses.container,
    ]"
  >
    <!-- Inner padding wrapper -->
    <div class="w-full flex-1 flex flex-col items-center justify-center px-[72px] pt-[84px] pb-[48px] text-center">
      <!-- Quote text -->
      <blockquote
        :class="[
          'font-serif leading-tight tracking-tight',
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
        <div v-if="authorImage" class="w-[120px] h-[120px] rounded-full overflow-hidden border-4" :class="themeClasses.avatarBorder">
          <img
            :src="authorImage"
            alt="author"
            class="w-full h-full object-cover"
            crossorigin="anonymous"
          />
        </div>

        <div class="mt-5 text-center">
          <div :class="['font-subtitle text-2xl font-600', themeClasses.author]" style="font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;">
            {{ authorName }}
          </div>
          <div v-if="referenceName" 
            :class="['font-subtitle text-xl border-t-2 border-gray-300 dark:border-gray-600 mt-2 pt-2', themeClasses.reference]" 
            style="font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;">
            {{ referenceName }}
          </div>
        </div>
      </div>
    </div>

    <!-- Accent border overlay to mimic thick rim -->
    <div class="pointer-events-none absolute inset-0 rounded-[30px]" :class="themeClasses.rim"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  quote: QuoteWithRelations
  theme?: 'light' | 'dark'
  size?: number // square px size (default 1080)
  background?: 'solid' | 'transparent'
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  size: 1080,
  background: 'solid'
})

const authorName = computed(() => props.quote.author?.name || 'Unknown')
const referenceName = computed(() => props.quote.reference?.name || '')
const authorImage = computed(() => props.quote.author?.image_url || '')
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase())

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
  if (props.theme === 'dark') {
    return {
      container: [props.background === 'transparent' ? 'bg-transparent' : 'bg-[#0C0A09]', 'border-[#0BA6DF]'].join(' '),
      quote: 'text-white',
      author: 'text-white',
      reference: 'text-gray-300',
      avatarBorder: 'border-[#0BA6DF] bg-[#111111]',
      avatarFallback: 'text-white bg-[#111111]',
      rim: 'ring-0',
    }
  }
  return {
    container: [props.background === 'transparent' ? 'bg-transparent' : 'bg-[#F3F4F6]', 'border-[#0BA6DF]'].join(' '),
    quote: 'text-gray-900',
    author: 'text-gray-900',
    reference: 'text-gray-700',
    avatarBorder: 'border-[#0BA6DF] bg-white',
    avatarFallback: 'text-gray-800 bg-white',
    rim: 'ring-0',
  }
})
</script>
