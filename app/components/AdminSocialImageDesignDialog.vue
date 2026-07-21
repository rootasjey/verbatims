<template>
  <AppDialog
    v-model="isOpen"
    :submitting="saving"
    max-width="lg"
    @submit="$emit('save')"
  >
    <template #header-title>
      <div>
        <h3 class="font-title uppercase text-size-4 font-600">
          {{ $t('admin_social.image_design_title') }}
        </h3>
        <p class="font-sans text-sm text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
          {{ $t('admin_social.image_design_desc') }}
        </p>
      </div>
    </template>

    <div class="mt-2 space-y-8">
      <!-- Background palette -->
      <div>
        <label class="block font-sans text-xs font-600 tracking-wider text-gray-900 dark:text-white uppercase mb-4">
          {{ $t('admin_social.image_background') }}
        </label>

        <div class="flex gap-3 flex-wrap">
          <button
            v-for="opt in backgroundOptions"
            :key="opt.value"
            :class="[
              'flex flex-col items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all w-[100px]',
              form.background === opt.value
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent bg-gray-100/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900'
            ]"
            @click="form.background = opt.value"
          >
            <!-- Stamp -->
            <div
              class="w-full aspect-square rounded-lg overflow-hidden relative"
              :class="form.background === opt.value ? 'ring-blue-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#0C0A09]' : ''"
              :style="opt.isPhoto ? { borderRadius: '8px' } : opt.previewStyle"
            >
              <!-- CSS gradient fallback (bottom layer) -->
              <div v-if="opt.isPhoto" class="absolute inset-0" :style="opt.previewStyle" />
              <!-- Photo image -->
              <img v-if="opt.isPhoto && opt.exampleImage" :src="opt.exampleImage" alt="" class="absolute inset-0 w-full h-full object-cover" crossorigin="anonymous" />
              <!-- Dark overlay gradient (top layer) -->
              <div v-if="opt.isPhoto" class="absolute inset-0" :style="{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)' }" />

              <!-- Quote text hint (thin lines) -->
              <div v-if="!opt.isPhoto" class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
                <div class="w-4/5 h-1 rounded-full" :class="form.background === opt.value ? 'bg-blue-300/60' : 'bg-gray-300/60 dark:bg-gray-600/60'" />
                <div class="w-3/5 h-1 rounded-full" :class="form.background === opt.value ? 'bg-blue-300/40' : 'bg-gray-300/40 dark:bg-gray-600/40'" />
              </div>

              <!-- Author label hint for photo stamps -->
              <div v-if="opt.isPhoto" class="absolute bottom-2 left-0 right-0 text-center">
                <div v-if="opt.value === 'reference-image'" class="inline-block w-3 h-3 rounded-full mx-auto mb-1 border border-white/40" />
                <div class="w-8 h-0.5 rounded-full bg-white/50 mx-auto" />
              </div>
            </div>

            <span class="font-sans text-xs font-500 text-gray-700 dark:text-gray-300 leading-tight text-center">
              {{ opt.label }}
            </span>
          </button>
        </div>

        <p class="mt-3 font-sans text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
          :class="{
            'opacity-0': form.background !== 'author-image' && form.background !== 'reference-image',
            'animate-fade-in': form.background === 'author-image' || form.background === 'reference-image',
          }">
          <NIcon name="i-ph-warning" class="w-3.5 h-3.5 shrink-0" />
          <span >{{ $t('admin_social.image_photo_hint') }}</span>
        </p>
      </div>

      <!-- Theme -->
      <div>
        <label class="block font-sans text-xs font-600 tracking-wider text-gray-900 dark:text-white uppercase mb-4">
          {{ $t('admin_social.image_theme') }}
        </label>

        <div class="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-500 transition-all',
              form.theme === opt.value
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            ]"
            @click="form.theme = opt.value"
          >
            <NIcon :name="opt.icon" class="text-base" />
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div v-if="state.updatedAt" class="font-sans text-xs text-gray-400 dark:text-gray-500">
        {{ $t('admin_social.last_updated', { date: formatDate(state.updatedAt) }) }}
      </div>
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
    previewStyle: { backgroundColor: '#FAFAF9', border: '3px solid #3C82F6', borderRadius: '8px', background: '' }
  },
  {
    label: String($t('admin_social.background_transparent')),
    value: 'transparent',
    isPhoto: false,
    previewStyle: { border: '2px dashed #3C82F6', borderRadius: '8px', background: '', backgroundColor: '' }
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
      ]) {
        try {
          const res = await $fetch<{ success: boolean; data: any }>(url)
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
