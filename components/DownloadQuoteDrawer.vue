<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-4 overflow-y-auto">
        <div class="relative flex items-center justify-center mb-3">
          <h3 class="font-title uppercase text-size-4 font-600 text-gray-500 black:text-gray-400">Download as image</h3>
          <NButton icon btn="ghost-gray" label="i-ph-x-bold" size="xs" @click="isOpen = false" class="absolute top-0 right-0" />
        </div>

        <!-- Preview -->
        <div class="flex justify-center mb-4">
          <div
            :style="{ width: previewSize + 'px', height: previewSize + 'px', overflow: 'hidden' }"
          >
            <div
              ref="previewRef"
              :style="{ width: renderSize + 'px', height: renderSize + 'px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }"
            >
              <QuoteImageCard :quote="quote" :theme="form.theme.value" :background="form.background.value" :size="renderSize" />
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="grid grid-cols-1 gap-3 border-t b-dashed mt-8 pt-4 mb-8">
          <div>
            <label class="block text-sm font-medium mb-1">Theme</label>
            <NSelect v-model="form.theme" :items="themes" item-key="label" value-key="label" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Size</label>
            <NSelect v-model="sizeOption" :items="sizes" item-key="label" value-key="label" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Background</label>
            <NSelect v-model="form.background" :items="backgrounds" item-key="label" value-key="label" />
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <NButton btn="light:soft dark:soft-white" label="i-ph-x-bold" icon @click="isOpen = false"></NButton>
          <NButton btn="soft-blue" :loading="downloading" class="flex-1" @click="download">Download</NButton>
        </div>
      </div>
    </template>
  </NDrawer>
</template>
  </NDrawer>
</template>

<script setup lang="ts">
import type { QuoteWithRelations } from '~/types/quote'
import QuoteImageCard from './QuoteImageCard.vue'
import { toPng } from 'html-to-image'
import { createApp, onMounted, watch } from 'vue'
import { ensurePilcrowFont, injectPilcrowInlineInto } from '~/utils/pilcrowFont'
import { loadDownloadImageSettings, saveDownloadImageSettings } from '~/utils/downloadImageSettings'

interface Emits {
  (e: 'update:open', v: boolean): void
  (e: 'downloaded'): void
}

const props = defineProps<{ open?: boolean; quote: QuoteWithRelations }>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => !!props.open, set: v => emit('update:open', v) })

interface ThemeOption {
  label: string
  value: 'light' | 'dark'
}
interface BgOption { label: string; value: 'solid' | 'transparent' }

const themes: ThemeOption[] = [ { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' } ]
const backgrounds: BgOption[] = [ { label: 'Solid', value: 'solid' }, { label: 'Transparent', value: 'transparent' } ]
const sizes: { label: string; value: number }[] = [
  { label: '1080 x 1080 (recommended)', value: 1080 },
  { label: '2048 x 2048', value: 2048 },
  { label: '800 x 800', value: 800 },
]

const form: { theme: ThemeOption; background: BgOption } = reactive({
  theme: { label: 'Light', value: 'light' },
  background: { label: 'Solid', value: 'solid' }
})
const sizeOption = ref(sizes[0])
const previewSize = 320
const previewRef = ref<HTMLElement | null>(null)
const downloading = ref(false)

const renderSize = computed(() => sizeOption.value.value)
const previewScale = computed(() => Math.max(0.1, Math.min(3, previewSize / renderSize.value)))
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

watch(() => [form.theme.value, form.background.value, sizeOption.value.value] as const, ([theme, background, size]) => {
  saveDownloadImageSettings({ theme, background, size })
})

const download = async () => {
  try {
    downloading.value = true
    await ensurePilcrowFont()
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
    await new Promise(r => requestAnimationFrame(() => r(null)))

    // Save settings on download as well (ensures persistence even if watchers miss updates)
    saveDownloadImageSettings({ theme: form.theme.value, background: form.background.value, size: renderSize.value })

    const rootEl = mount.firstElementChild as HTMLElement
    if (rootEl) await injectPilcrowInlineInto(rootEl)

    const dataUrl = await toPng(rootEl as HTMLElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: form.background.value === 'transparent' ? 'transparent' : undefined,
      skipFonts: true,
    })
    app.unmount()
    container.remove()

    const a = document.createElement('a')
    const author = props.quote.author?.name?.replaceAll('/', '-') || 'verbatims'
    a.download = `quote-${author}-${props.quote.id}.png`
    a.href = dataUrl
    a.click()
    emit('downloaded')
  } catch (e) {
    console.error('download image error', e)
  } finally {
    downloading.value = false
  }
}
</script>
