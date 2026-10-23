<template>
  <AppDialog
    v-model="isOpen"
    :submitting="saving"
    max-width="lg"
    @submit="$emit('save')"
  >
    <template #header-title>
      <div class="min-w-0 pr-8">
        <h3 class="font-serif text-2xl font-400 tracking-tight text-gray-900 dark:text-gray-100">
          {{ $t('admin_social.image_design_title') }}
        </h3>
        <p class="mt-1 max-w-prose font-sans text-sm leading-6 text-gray-600 dark:text-gray-400">
          {{ $t('admin_social.image_design_desc') }}
        </p>
      </div>
    </template>

    <div class="space-y-7">
      <section aria-labelledby="social-image-background-label">
        <h4 id="social-image-background-label" class="mb-3 font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
          {{ $t('admin_social.image_background') }}
        </h4>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            v-for="opt in backgroundOptions"
            :key="opt.value"
            type="button"
            :aria-pressed="form.background === opt.value"
            :class="[
              'group flex min-h-20 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500',
              form.background === opt.value
                ? 'border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-neutral-900'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900'
            ]"
            @click="form.background = opt.value"
          >
            <div
              class="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
              :style="opt.previewStyle"
            >
              <img v-if="opt.isPhoto && opt.exampleImage" :src="opt.exampleImage" alt="" class="absolute inset-0 h-full w-full object-cover" crossorigin="anonymous" />
              <div v-if="opt.isPhoto" class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div v-if="!opt.isPhoto" class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
                <div class="h-1 w-4/5 rounded-full" :class="opt.value === 'solid' ? 'bg-gray-500/70 dark:bg-gray-300/60' : 'bg-gray-400/50 dark:bg-gray-600/60'" />
                <div class="h-1 w-3/5 rounded-full" :class="opt.value === 'solid' ? 'bg-gray-400/60 dark:bg-gray-400/50' : 'bg-gray-400/35 dark:bg-gray-600/40'" />
              </div>
            </div>

            <span class="min-w-0 flex-1 font-sans text-sm font-500 leading-snug text-gray-800 dark:text-gray-200">{{ opt.label }}</span>
            <NIcon v-if="form.background === opt.value" name="i-ph-check-circle" class="h-5 w-5 shrink-0 text-gray-900 dark:text-gray-100" />
          </button>
        </div>

        <p v-if="form.background === 'author-image' || form.background === 'reference-image'" class="mt-3 flex items-start gap-1.5 font-sans text-xs leading-5 text-amber-700 dark:text-amber-300">
          <NIcon name="i-ph-warning" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ $t('admin_social.image_photo_hint') }}</span>
        </p>
      </section>

      <section aria-labelledby="social-image-theme-label">
        <h4 id="social-image-theme-label" class="mb-3 font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
          {{ $t('admin_social.image_theme') }}
        </h4>

        <div class="grid max-w-sm grid-cols-2 gap-2">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            :aria-pressed="form.theme === opt.value"
            :class="[
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-sans text-sm font-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500',
              form.theme === opt.value
                ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-400 dark:hover:bg-neutral-900'
            ]"
            @click="form.theme = opt.value"
          >
            <NIcon :name="opt.icon" class="text-base" />
            {{ opt.label }}
          </button>
        </div>
      </section>

      <p v-if="state.updatedAt" class="border-t border-gray-200 pt-4 font-sans text-xs leading-5 text-gray-500 dark:border-neutral-800 dark:text-gray-400">
        {{ $t('admin_social.last_updated', { date: formatDate(state.updatedAt) }) }}
      </p>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/time-formatter'

const { $t } = useI18n()

export interface ImageDesignForm {
  background: 'solid' | 'transparent' | 'author-image' | 'reference-image'
  theme: 'light' | 'dark'
}

export interface ImageDesignState {
  background: string
  theme: string
  updatedAt: string | null
}

interface Props {
  open: boolean
  saving: boolean
  form: ImageDesignForm
  state: ImageDesignState
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

interface BgOption {
  label: string
  value: 'solid' | 'transparent' | 'author-image' | 'reference-image'
  isPhoto: boolean
  previewStyle: Record<string, string>
  exampleImage?: string
}

const authorExampleImage = ref('')
const referenceExampleImage = ref('')

const backgroundOptions = computed<BgOption[]>(() => [
  {
    label: String($t('admin_social.background_solid')),
    value: 'solid',
    isPhoto: false,
    previewStyle: { backgroundColor: '#FAFAF9', border: '1px solid #d6d3d1', borderRadius: '8px', background: '' }
  },
  {
    label: String($t('admin_social.background_transparent')),
    value: 'transparent',
    isPhoto: false,
    previewStyle: { border: '1px dashed #a8a29e', borderRadius: '8px', background: '', backgroundColor: '#f5f5f4' }
  },
  {
    label: String($t('admin_social.background_author_image')),
    value: 'author-image',
    isPhoto: true,
    exampleImage: authorExampleImage.value || undefined,
    previewStyle: { background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 30%, #1e1b4b 60%, #09090b 100%)', borderRadius: '8px', border: '', backgroundColor: '' }
  },
  {
    label: String($t('admin_social.background_reference_image')),
    value: 'reference-image',
    isPhoto: true,
    exampleImage: referenceExampleImage.value || undefined,
    previewStyle: { background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 30%, #78350f 60%, #09090b 100%)', borderRadius: '8px', border: '', backgroundColor: '' }
  },
])

interface ThemeOption {
  label: string
  value: 'light' | 'dark'
  icon: string
}

const themeOptions: ThemeOption[] = [
  { label: String($t('admin_social.theme_light')), value: 'light', icon: 'i-ph-sun-dim' },
  { label: String($t('admin_social.theme_dark')), value: 'dark', icon: 'i-ph-moon-stars' },
]

function formatDate(value: string | null): string {
  const formatted = formatDateTime(value)
  return formatted === 'N/A' ? 'Unknown' : formatted
}

watch(isOpen, async (open) => {
  if (open) {
    const loadExampleImages = async () => {
      for (const { url, set } of [
        { url: '/api/authors/184', set: (d: any) => { if (d?.image_url) authorExampleImage.value = d.image_url } },
        { url: '/api/references/82', set: (d: any) => { if (d?.image_url) referenceExampleImage.value = d.image_url } },
      ] as const) {
        try {
          const res = await $fetch<
            { success: boolean; data: any },
            '/api/authors/:id' | '/api/references/:id'
          >(url as '/api/authors/:id' | '/api/references/:id')
          if (res?.data) set(res.data)
        } catch {
          // Fallback to CSS gradients
        }
      }
    }
    loadExampleImages()
  }
})
</script>
