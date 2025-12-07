<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-3xl' }">
    <div class="flex flex-col gap-5">
      <div class="flex items-start gap-5">
        <!-- Live Preview -->
        <div class="shrink-0">
          <div
            class="bg-transparent"
            :style="{
              width: previewSize + 'px',
              height: previewSize + 'px',
              overflow: 'hidden',
            }"
          >
            <div
              ref="previewRef"
              :style="{
                width: renderSize + 'px',
                height: renderSize + 'px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left'
              }"
            >
              <div v-if="fontsReady">
                <QuoteImageCard
                  :quote="quote"
                  :theme="form.theme.value"
                  :background="form.background.value"
                  :size="renderSize"
                />
              </div>
              <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-500 tracking-wide">
                Loading font…
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="flex-1">
          <h3 class="font-title uppercase text-size-4 font-600">Download as image</h3>

          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Theme</label>
              <NSelect v-model="form.theme" :items="themes" item-key="label" value-key="label" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Size</label>
              <NSelect v-model="sizeOption" :items="sizes" item-key="label" value-key="label" />
              <p class="mt-1 text-xs text-gray-500">Export is always square; 1080px is good for most socials.</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Background</label>
              <NSelect v-model="form.background" :items="backgrounds" item-key="label" value-key="label" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <NButton btn="light:soft dark:soft-white" @click="close" :disabled="downloading">Cancel</NButton>
        <NButton btn="soft-blue" :loading="downloading" @click="download">Download</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'
import { toPng } from 'html-to-image'
import QuoteImageCard from './QuoteImageCard.vue'
import { createApp, onMounted } from 'vue'
import { ensurePilcrowFont, injectPilcrowInlineInto } from '~/utils/pilcrowFont'
import { loadDownloadImageSettings, saveDownloadImageSettings } from '~/utils/downloadImageSettings'

interface Props {
  modelValue: boolean
  quote: QuoteWithRelations
}
interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'downloaded'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const previewRef = ref<HTMLElement | null>(null)
const previewSize = 360 // visible preview bounds

interface ThemeOption {
  label: string
  value: 'light' | 'dark'
}
interface BgOption { label: string; value: 'solid' | 'transparent' }

const themes: ThemeOption[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const backgrounds: BgOption[] = [
  { label: 'Solid', value: 'solid' },
  { label: 'Transparent', value: 'transparent' }
]

const sizes = [
  { label: '1080 x 1080 (recommended)', value: 1080 },
  { label: '2048 x 2048', value: 2048 },
  { label: '800 x 800', value: 800 },
]

const form: { theme: ThemeOption; background: BgOption } = reactive({
  theme: { label: 'Light', value: 'light' },
  background: { label: 'Solid', value: 'solid' }
})
const sizeOption = ref(sizes[0])
const downloading = ref(false)

const renderSize = computed(() => sizeOption.value.value)
const previewScale = computed(() => Math.max(0.1, Math.min(3, previewSize / renderSize.value)))
const close = () => { isOpen.value = false }
// Inline @font-face + FontFace API ensuring capture by html-to-image
const fontsReady = ref(false)

watch(isOpen, async open => {
  if (open) {
    const saved = loadDownloadImageSettings()
    if (saved) {
      form.theme = saved.theme === 'dark' ? { label: 'Dark', value: 'dark' } : { label: 'Light', value: 'light' }
      form.background = saved.background === 'transparent' ? { label: 'Transparent', value: 'transparent' } : { label: 'Solid', value: 'solid' }
      const found = sizes.find(s => s.value === saved.size)
      if (found) sizeOption.value = found
    }
    await ensurePilcrowFont(); fontsReady.value = true
  }
})

onMounted(async () => {
  if (isOpen.value) {
    const saved = loadDownloadImageSettings()
    if (saved) {
      form.theme = saved.theme === 'dark' ? { label: 'Dark', value: 'dark' } : { label: 'Light', value: 'light' }
      form.background = saved.background === 'transparent' ? { label: 'Transparent', value: 'transparent' } : { label: 'Solid', value: 'solid' }
      const found = sizes.find(s => s.value === saved.size)
      if (found) sizeOption.value = found
    }
    await ensurePilcrowFont(); fontsReady.value = true
  }
})

// Persist changes as user tweaks controls
watch(() => [form.theme.value, form.background.value, sizeOption.value.value] as const, ([theme, background, size]) => {
  saveDownloadImageSettings({ theme, background, size })
})

const download = async () => {
  if (!previewRef.value) return
  try {
    downloading.value = true
    await ensurePilcrowFont()
    // Render an offscreen full-size card for best quality
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)

    const mount = document.createElement('div')
    container.appendChild(mount)

    const app = createApp(QuoteImageCard, {
      quote: props.quote,
      theme: form.theme.value,
      background: form.background.value,
      size: renderSize.value
    })
    app.mount(mount)

    // Wait next frame for render
    await new Promise(r => requestAnimationFrame(() => r(null)))

    // Save settings on download as well (redundant safety)
    saveDownloadImageSettings({ theme: form.theme.value, background: form.background.value, size: renderSize.value })

    // Prepend inline @font-face inside the rendered root so html-to-image captures it without scanning external CSS
    const rootEl = mount.firstElementChild as HTMLElement
    if (rootEl) await injectPilcrowInlineInto(rootEl)

    const dataUrl = await toPng(mount.firstElementChild as HTMLElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: form.background.value === 'transparent' ? 'transparent' : undefined,
      // Avoid scanning cross-origin stylesheets; use FontFace-loaded font instead
      skipFonts: true,
    })

    // Cleanup
    app.unmount()
    container.remove()

    const link = document.createElement('a')
    const safeAuthor = props.quote.author?.name?.replaceAll('/', '-') || 'verbatims'
    link.download = `quote-${safeAuthor}-${props.quote.id}.png`
    link.href = dataUrl
    link.click()
    emit('downloaded')
  } catch (e) {
    console.error('download error', e)
  } finally {
    downloading.value = false
  }
}
</script>
