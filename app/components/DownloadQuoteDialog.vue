<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.download_image') as string"
    :submitting="downloading"
    @submit="download"
  >
    <div class="flex flex-col gap-5">
      <div class="flex items-start gap-5 flex-wrap">
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
                {{ $t('components.dialogs.loading_font') }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 min-w-[200px] space-y-4">
          <div>
            <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.theme') }}</label>
            <NSelect v-model="form.theme" :items="themes" item-key="label" value-key="label" />
          </div>

          <div>
            <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.size') }}</label>
            <NSelect v-model="sizeOption" :items="sizes" item-key="label" value-key="label" />
            <p class="mt-1 text-xs text-gray-500">{{ $t('components.dialogs.export_hint') }}</p>
          </div>

          <div>
            <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.background') }}</label>
            <NSelect v-model="form.background" :items="backgrounds" item-key="label" value-key="label" />
          </div>
        </div>
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-blue" :loading="downloading" @click="download">{{ $t('components.dialogs.download') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { toPng } from 'html-to-image'
import QuoteImageCard from './QuoteImageCard.vue'
import { createApp } from 'vue'
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
const previewSize = 360

interface ThemeOption {
  label: string
  value: 'light' | 'dark'
}
interface BgOption { label: string; value: 'solid' | 'transparent' }

const { $t } = useI18n()

const themes: ThemeOption[] = [
  { label: String($t('components.dialogs.light')), value: 'light' },
  { label: String($t('components.dialogs.dark')), value: 'dark' },
]

const backgrounds: BgOption[] = [
  { label: String($t('components.dialogs.solid')), value: 'solid' },
  { label: String($t('components.dialogs.transparent')), value: 'transparent' }
]

const sizes = [
  { label: '1080 x 1080 (recommended)', value: 1080 },
  { label: '2048 x 2048', value: 2048 },
  { label: '800 x 800', value: 800 },
]

const form: { theme: ThemeOption; background: BgOption } = reactive({
  theme: { label: String($t('components.dialogs.light')), value: 'light' },
  background: { label: String($t('components.dialogs.solid')), value: 'solid' }
})
const sizeOption = ref(sizes[0])
const downloading = ref(false)

const renderSize = computed(() => sizeOption.value!.value)
const previewScale = computed(() => Math.max(0.1, Math.min(3, previewSize / renderSize.value)))
const close = () => { isOpen.value = false }
const fontsReady = ref(false)

watch(isOpen, async open => {
  if (open) {
    const saved = loadDownloadImageSettings()
    if (saved) {
      form.theme = saved.theme === 'dark' ? { label: String($t('components.dialogs.dark')), value: 'dark' } : { label: String($t('components.dialogs.light')), value: 'light' }
      form.background = saved.background === 'transparent' ? { label: String($t('components.dialogs.transparent')), value: 'transparent' } : { label: String($t('components.dialogs.solid')), value: 'solid' }
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
      form.theme = saved.theme === 'dark' ? { label: String($t('components.dialogs.dark')), value: 'dark' } : { label: String($t('components.dialogs.light')), value: 'light' }
      form.background = saved.background === 'transparent' ? { label: String($t('components.dialogs.transparent')), value: 'transparent' } : { label: String($t('components.dialogs.solid')), value: 'solid' }
      const found = sizes.find(s => s.value === saved.size)
      if (found) sizeOption.value = found
    }
    await ensurePilcrowFont(); fontsReady.value = true
  }
})

watch(() => [form.theme.value, form.background.value, sizeOption.value!.value] as const, ([theme, background, size]) => {
  saveDownloadImageSettings({ theme, background, size })
})

const download = async () => {
  if (!previewRef.value) return
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

    saveDownloadImageSettings({ theme: form.theme.value, background: form.background.value, size: renderSize.value })

    const rootEl = mount.firstElementChild as HTMLElement
    if (rootEl) await injectPilcrowInlineInto(rootEl)

    const dataUrl = await toPng(mount.firstElementChild as HTMLElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: form.background.value === 'transparent' ? 'transparent' : undefined,
      skipFonts: true,
    })

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
