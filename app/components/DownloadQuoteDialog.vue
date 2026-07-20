<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.download_image') as string"
    :submitting="downloading"
    max-width="xl"
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
                width: renderDimensions.width + 'px',
                height: renderDimensions.height + 'px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left'
              }"
            >
              <div v-if="fontsReady">
                <QuoteImageCard
                  :quote="quote"
                  :theme="form.theme.value"
                  :background="form.background.value"
                  :size="renderDimensions"
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
      <PrimaryButton btn="soft-blue" class="px-6" :loading="downloading" @click="download">{{ $t('components.dialogs.download') }}</PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { toPng } from 'html-to-image'
import QuoteImageCard from './QuoteImageCard.vue'
import { createApp } from 'vue'
import { ensurePilcrowFont, injectPilcrowInlineInto } from '~/utils/pilcrowFont'
import { type DownloadImageSettings, loadDownloadImageSettings, saveDownloadImageSettings } from '~/utils/downloadImageSettings'

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
interface BgOption { label: string; value: 'solid' | 'transparent' | 'author-image' | 'reference-image' }
interface SizeOption { label: string; value: { width: number; height: number } }

const { $t } = useI18n()

const themes: ThemeOption[] = [
  { label: String($t('components.dialogs.light')), value: 'light' },
  { label: String($t('components.dialogs.dark')), value: 'dark' },
]

const backgrounds = computed<BgOption[]>(() => {
  const opts: BgOption[] = [
    { label: String($t('components.dialogs.solid')), value: 'solid' },
    { label: String($t('components.dialogs.transparent')), value: 'transparent' },
  ]
  if (props.quote.author?.image_url) {
    opts.push({ label: String($t('components.dialogs.author_image')), value: 'author-image' })
  }
  if (props.quote.reference?.image_url) {
    opts.push({ label: String($t('components.dialogs.reference_image')), value: 'reference-image' })
  }
  return opts
})

const findBgOption = (value: string): BgOption => {
  return backgrounds.value.find(b => b.value === value) || { label: String($t('components.dialogs.solid')), value: 'solid' }
}

const sizes: SizeOption[] = [
  { label: String($t('components.dialogs.size_square')), value: { width: 1080, height: 1080 } },
  { label: String($t('components.dialogs.size_desktop_wallpaper')), value: { width: 1920, height: 1080 } },
  { label: String($t('components.dialogs.size_phone_wallpaper')), value: { width: 1080, height: 1920 } },
]

const form: { theme: ThemeOption; background: BgOption } = reactive({
  theme: { label: String($t('components.dialogs.light')), value: 'light' },
  background: { label: String($t('components.dialogs.solid')), value: 'solid' }
})
const sizeOption = ref(sizes[0])
const downloading = ref(false)

const renderDimensions = computed(() => sizeOption.value!.value)
const previewScale = computed(() => {
  const { width, height } = renderDimensions.value
  return Math.min(1, previewSize / Math.max(width, height))
})
const close = () => { isOpen.value = false }
const fontsReady = ref(false)

const applySavedSettings = (saved: DownloadImageSettings | null) => {
  if (!saved) return
  form.theme = saved.theme === 'dark' ? { label: String($t('components.dialogs.dark')), value: 'dark' } : { label: String($t('components.dialogs.light')), value: 'light' }
  form.background = findBgOption(saved.background)
  const found = sizes.find(s =>
    s.value.width === saved.size.width && s.value.height === saved.size.height
  )
  if (found) sizeOption.value = found
}

watch(isOpen, async open => {
  if (open) {
    applySavedSettings(loadDownloadImageSettings())
    await ensurePilcrowFont(); fontsReady.value = true
  }
})

onMounted(async () => {
  if (isOpen.value) {
    applySavedSettings(loadDownloadImageSettings())
    await ensurePilcrowFont(); fontsReady.value = true
  }
})

watch(() => [form.theme.value, form.background.value, renderDimensions.value] as const, ([theme, background, size]) => {
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
      size: renderDimensions.value
    })
    app.mount(mount)

    await new Promise(r => requestAnimationFrame(() => r(null)))

    saveDownloadImageSettings({ theme: form.theme.value, background: form.background.value, size: renderDimensions.value })

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
