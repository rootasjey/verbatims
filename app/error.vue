<template>
  <div class="min-h-screen bg-[#F7F5EF] text-gray-900 dark:bg-[#0C0A09] dark:text-gray-100">
    <AppMastheadBar surface="warm" />
    <header class="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-[#F7F5EF] px-4 py-3 dark:bg-[#0C0A09] md:hidden">
      <NuxtLink to="/" class="rounded-sm px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C82F6]" :aria-label="String(t('error_page.home'))">
        <span class="font-subtitle text-xl font-700 italic tracking-[0.1rem]">verbatims</span>
      </NuxtLink>
      <NButton icon btn="ghost-gray" label="i-ph-list" size="sm" class="min-h-11 min-w-11" :aria-label="String(t('nav.menu'))" :aria-expanded="showMobileMenu" @click="showMobileMenu = true" />
    </header>
    <div class="h-16 md:hidden" aria-hidden="true" />

    <ClientOnly>
      <NDrawer
        v-model:open="showMobileMenu"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'rounded-t-2xl bg-[#F7F5EF] dark:bg-[#1C1917]', drawerOverlay: 'bg-black/45' }"
      >
        <template #body>
          <div class="px-6 pb-8 pt-5">
            <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div class="flex items-center justify-between">
              <h2 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ t('nav.menu') }}</h2>
              <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String(t('common.close'))" @click="showMobileMenu = false" />
            </div>
            <nav class="mt-5 grid gap-1" :aria-label="String(t('nav.menu'))">
              <NuxtLink v-for="item in mobileMenuItems" :key="item.to" :to="item.to" class="flex min-h-12 items-center border-b border-black/10 px-1 font-sans text-lg text-gray-800 last:border-0 dark:border-white/10 dark:text-gray-200" @click="showMobileMenu = false">
                {{ item.label }}
              </NuxtLink>
            </nav>
          </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <main class="relative isolate mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
      <TransitionGroup v-if="statusCode === 404" name="archive-bubble" tag="div" class="mb-8 flex h-16 items-center justify-center gap-3 xl:hidden">
        <div
          v-for="(bubble, index) in archiveBubbles.slice(0, 3)"
          :key="bubble.key"
          class="relative block shrink-0 overflow-visible rounded-full grayscale"
          :class="mobileImageSizes[index]"
        >
          <NuxtLink :to="bubble.to" :aria-label="bubble.name" class="archive-bubble-link block h-full w-full overflow-hidden rounded-full opacity-[var(--bubble-opacity)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3C82F6]" :style="{ '--bubble-opacity': mobileImageOpacities[index], '--bubble-delay': `${index * 90}ms` }">
            <img :src="bubble.image" alt="" loading="lazy" class="h-full w-full object-cover" @error="removeArchiveBubble(bubble.key)" />
          </NuxtLink>
        </div>
      </TransitionGroup>
      <TransitionGroup v-if="statusCode === 404" name="archive-bubble" tag="div" class="pointer-events-none absolute inset-0 z-10 hidden xl:block">
        <div
          v-for="(bubble, index) in archiveBubbles"
          :key="bubble.key"
          class="group pointer-events-auto absolute overflow-visible rounded-full"
          :class="desktopImagePositions[index]"
          :style="{ '--bubble-delay': `${index * 80}ms` }"
          @pointermove="moveBubbleWithPointer"
          @pointerleave="resetBubblePointer"
        >
          <NuxtLink :to="bubble.to" :aria-label="bubble.name" class="archive-bubble-link block h-full w-full overflow-hidden rounded-full opacity-[var(--bubble-opacity)] shadow-sm transition-[opacity,filter] duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3C82F6]" :style="{ '--bubble-opacity': desktopImageOpacities[index], '--bubble-halo': bubbleHaloColors[bubble.halo] }">
            <img :src="bubble.image" alt="" loading="lazy" class="h-full w-full object-cover grayscale brightness-75 transition-[filter] duration-300 group-hover:grayscale-0 group-hover:brightness-110 group-focus-within:grayscale-0 group-focus-within:brightness-110" @error="removeArchiveBubble(bubble.key)" />
          </NuxtLink>
          <span class="bubble-label pointer-events-none absolute left-1/2 top-1/2 z-20 aspect-square w-[max(235%,280px)] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true">
            <svg class="h-full w-full overflow-visible" viewBox="0 0 300 300">
              <defs>
                <path :id="`bubble-name-curve-${index}`" :d="bubbleNameCurve(index)" />
              </defs>
              <text stroke-linejoin="round" stroke-width="5" letter-spacing="0.4" paint-order="stroke" class="fill-gray-950 stroke-[#FAFAF9] font-sans dark:fill-gray-100 dark:stroke-[#0C0A09]" :style="{ fontSize: `${bubbleLabelFontSize(index)}px`, fontWeight: 400 }">
                <textPath :href="`#bubble-name-curve-${index}`" startOffset="50%" text-anchor="middle">{{ getBubbleLabel(bubble.name, index) }}</textPath>
              </text>
            </svg>
          </span>
        </div>
      </TransitionGroup>

      <div class="error-copy flex w-full flex-col items-center">
      <div
        class="select-none font-serif text-[clamp(8rem,25vw,13rem)] font-500 leading-[0.78] tracking-[-0.08em] text-gray-900 dark:text-gray-100"
        aria-hidden="true"
      >
        {{ statusCode === 404 ? '404' : statusCode }}
      </div>

      <h1 class="mt-8 font-serif text-3xl leading-tight tracking-[-0.02em] text-gray-950 dark:text-gray-50 sm:text-4xl">
        {{ statusCode === 404 ? t('error_page.title_404') : t('error_page.title_error') }}
      </h1>
      <p class="mt-4 max-w-md font-sans text-base leading-7 text-gray-600 dark:text-gray-400">
        {{ statusCode === 404 ? t('error_page.description_404') : message }}
      </p>

      <nav class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" :aria-label="String(t('error_page.navigation'))">
        <NuxtLink to="/" class="home-action inline-flex min-h-11 items-center rounded-sm bg-gray-950 px-5 font-sans text-sm font-600 text-white transition-[transform,background-color] duration-200 ease-out hover:scale-[1.03] active:scale-[0.97] hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#3C82F6] dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white">
          {{ t('error_page.home') }}
        </NuxtLink>
        <NuxtLink to="/quotes" class="group inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-sm font-sans text-sm font-600 text-gray-800 transition-colors hover:text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3C82F6] dark:text-gray-200 dark:hover:text-white">
          <span>{{ t('error_page.explore') }}</span>
          <svg class="h-2 w-18 overflow-hidden text-gray-500 transition-colors group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300" viewBox="0 0 108 12" fill="none" aria-hidden="true">
            <g class="explore-wave-flow">
              <path d="M3 6 C8 2 15 2 20 6 C25 10 32 10 37 6 C42 2 49 2 54 6 C59 10 66 10 71 6 C76 2 83 2 88 6 C93 10 100 10 105 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M3 6 C8 2 15 2 20 6 C25 10 32 10 37 6 C42 2 49 2 54 6 C59 10 66 10 71 6 C76 2 83 2 88 6 C93 10 100 10 105 6" transform="translate(102 0)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </g>
          </svg>
        </NuxtLink>
      </nav>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const showMobileMenu = ref(false)
const mobileMenuItems = computed(() => [
  { to: '/quotes', label: t('nav.quotes') },
  { to: '/authors', label: t('nav.authors') },
  { to: '/references', label: t('nav.references') }
])
const { error: errorProp } = defineProps<{ error?: any }>()
const nuxtError = useError()
interface ArchiveBubble {
  key: string
  image: string
  name: string
  to: string
  halo: 'real' | 'fictional' | 'neutral'
}

const archiveBubbles = ref<ArchiveBubble[]>([])
const bubbleLabelCanvasContext = import.meta.client ? document.createElement('canvas').getContext('2d') : null
const bubbleLabelCache = new Map<string, string>()
const mobileImageSizes = ['h-12 w-12', 'h-10 w-10', 'h-14 w-14']
const mobileImageOpacities = [0.36, 0.28, 0.32]
const desktopBubbleDiameters = [128, 96, 80, 112, 64, 56]
const desktopBubbleLabelRadii = desktopBubbleDiameters.map(diameter => Math.round(diameter * 0.7))
const desktopImageOpacities = [0.35, 0.28, 0.32, 0.3, 0.28, 0.32]
const bubbleHaloColors: Record<ArchiveBubble['halo'], string> = {
  real: 'rgba(60, 130, 246, 0.3)',
  fictional: 'rgba(147, 51, 234, 0.3)',
  neutral: 'rgba(120, 113, 108, 0.28)'
}
const desktopImagePositions = [
  'left-[8%] top-[28%] h-32 w-32',
  'right-[11%] top-[31%] h-24 w-24',
  'left-[21%] bottom-[22%] h-20 w-20',
  'right-[8%] bottom-[16%] h-28 w-28',
  'left-[4%] top-[55%] h-16 w-16',
  'right-[4%] top-[54%] h-14 w-14'
]
const statusCode = computed(() => Number(
  (errorProp as any)?.statusCode ?? (errorProp as any)?.status ??
  (nuxtError.value as any)?.statusCode ?? (nuxtError.value as any)?.status ??
  500
))
const message = computed(() => (errorProp as any)?.message ?? (nuxtError.value as any)?.message ?? t('error_page.generic_message'))

onMounted(async () => {
  if (statusCode.value !== 404) return

  try {
    const response = await $fetch<{
      data?: Array<{
        attributions?: Array<{
          is_primary?: boolean
          author?: { id?: number; name?: string | null; image_url?: string | null; is_fictional?: boolean | null }
          reference?: { id?: number; name?: string | null; image_url?: string | null; primary_type?: string | null }
        }>
      }>
    }>('/api/quotes/random?count=24')

    for (const quote of response.data ?? []) {
      const attributions = quote.attributions ?? []
      const attribution = attributions.find(item => item.is_primary) ?? attributions[0]
      const entities: Array<ArchiveBubble | null> = [
        attribution?.author?.id && attribution.author.name && attribution.author.image_url
          ? {
              key: `author-${attribution.author.id}`,
              image: attribution.author.image_url,
              name: attribution.author.name,
              to: `/authors/${attribution.author.id}`,
              halo: attribution.author.is_fictional === true ? 'fictional' : attribution.author.is_fictional === false ? 'real' : 'neutral'
            }
          : null,
        attribution?.reference?.id && attribution.reference.name && attribution.reference.image_url
          ? {
              key: `reference-${attribution.reference.id}`,
              image: attribution.reference.image_url,
              name: attribution.reference.name,
              to: `/references/${attribution.reference.id}`,
              halo: 'neutral'
            }
          : null
      ]

      for (const entity of entities) {
        if (!entity || archiveBubbles.value.some(bubble => bubble.image === entity.image)) continue
        archiveBubbles.value.push(entity)
        if (archiveBubbles.value.length === desktopImagePositions.length) return
      }
    }
  }
  catch {
    // Decorative imagery should never affect the error page.
  }
})

function removeArchiveBubble(key: string) {
  archiveBubbles.value = archiveBubbles.value.filter(bubble => bubble.key !== key)
}

function bubbleNameCurve(index: number) {
  const radius = desktopBubbleLabelRadii[index] ?? 90
  const horizontalOffset = Math.cos(Math.PI / 6) * radius
  const verticalOffset = radius / 2
  return `M ${150 - horizontalOffset} ${160 + verticalOffset} A ${radius} ${radius} 0 1 1 ${150 + horizontalOffset} ${160 + verticalOffset}`
}

function bubbleLabelFontSize(index: number) {
  const diameter = desktopBubbleDiameters[index] ?? 128
  const sizeRatio = Math.max(0, Math.min(1, (diameter - 56) / 72))
  return Math.round(18 + sizeRatio * 4)
}

function getBubbleLabel(name: string, index: number) {
  if (!bubbleLabelCanvasContext) return name

  const cacheKey = `${index}:${name}`
  const cachedLabel = bubbleLabelCache.get(cacheKey)
  if (cachedLabel) return cachedLabel

  const fontSize = bubbleLabelFontSize(index)
  bubbleLabelCanvasContext.font = `400 ${fontSize}px "IBM Plex Sans", sans-serif`
  const radius = desktopBubbleLabelRadii[index] ?? 90
  const maxWidth = (Math.PI * radius * 4) / 3
  const measureLabel = (label: string) => {
    const characterCount = Array.from(label).length
    return bubbleLabelCanvasContext!.measureText(label).width + Math.max(0, characterCount - 1) * 0.4
  }

  if (measureLabel(name) <= maxWidth) {
    bubbleLabelCache.set(cacheKey, name)
    return name
  }

  const characters = Array.from(name)
  while (characters.length > 1 && measureLabel(`${characters.join('')}…`) > maxWidth) {
    characters.pop()
  }

  const label = `${characters.join('').trimEnd()}…`
  bubbleLabelCache.set(cacheKey, label)
  return label
}

function moveBubbleWithPointer(event: PointerEvent) {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return

  const bubble = event.currentTarget as HTMLElement
  const bounds = bubble.getBoundingClientRect()
  const offsetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8
  const offsetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8

  bubble.style.setProperty('--bubble-x', `${offsetX}px`)
  bubble.style.setProperty('--bubble-y', `${offsetY}px`)
}

function resetBubblePointer(event: PointerEvent) {
  const bubble = event.currentTarget as HTMLElement
  bubble.style.removeProperty('--bubble-x')
  bubble.style.removeProperty('--bubble-y')
}
</script>

<style scoped>
@keyframes error-copy-enter {
  from {
    opacity: 0;
    filter: blur(7px);
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

.error-copy {
  animation: error-copy-enter 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.explore-wave-flow {
  transform: none;
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .explore-wave-flow {
    animation: explore-wave-flow 4.8s linear infinite;
  }
}

@keyframes explore-wave-flow {
  to {
    transform: translateX(-102px);
  }
}

.archive-bubble-enter-active {
  transition: opacity 480ms ease-out, transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--bubble-delay, 0ms);
}

.archive-bubble-enter-from {
  opacity: 0;
  transform: translate3d(0, 10px, 0) scale(0.94);
}

.archive-bubble-link {
  transform: translate3d(var(--bubble-x, 0), var(--bubble-y, 0), 0) scale(1);
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out, filter 300ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .archive-bubble-link:hover,
  .group:focus-within .archive-bubble-link {
    transform: translate3d(var(--bubble-x, 0), var(--bubble-y, 0), 0) scale(1.07);
  }
}

.archive-bubble-link:active {
  transform: translate3d(var(--bubble-x, 0), var(--bubble-y, 0), 0) scale(0.96);
}

.group:hover .archive-bubble-link:active,
.group:focus-within .archive-bubble-link:active {
  transform: translate3d(var(--bubble-x, 0), var(--bubble-y, 0), 0) scale(0.96);
}

@keyframes bubble-label-arrive {
  from {
    opacity: 0;
    transform: rotate(-22deg) scale(0.96);
  }

  to {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
}

.group:hover .bubble-label svg,
.group:focus-within .bubble-label svg {
  animation: bubble-label-arrive 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: center;
}

.group:hover > a,
.group:focus-within > a {
  filter: drop-shadow(0 4px 14px var(--bubble-halo));
}

@media (prefers-reduced-motion: reduce) {
  .group:hover .explore-wave-flow {
    animation: none;
  }

  .home-action {
    transition: none;
  }

  .home-action:hover,
  .home-action:active {
    transform: none;
  }

  .error-copy {
    animation: none;
  }

  .archive-bubble-enter-active {
    transition: none;
  }

  .archive-bubble-enter-from {
    opacity: 1;
    transform: none;
  }

  .group:hover .bubble-label svg,
  .group:focus-within .bubble-label svg {
    animation: none;
  }

  .bubble-label,
  .archive-bubble-link,
  .group img {
    transition: none;
  }

  .archive-bubble-link:hover,
  .archive-bubble-link:active,
  .group:focus-within .archive-bubble-link {
    transform: none;
  }

  .archive-bubble-link:active {
    opacity: 0.75;
  }
}
</style>
