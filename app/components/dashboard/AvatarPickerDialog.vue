<template>
  <ClientOnly>
    <AppDialog
      v-model="isOpen"
      :title="String($t(isCustomizing ? 'avatar_customizer_title' : 'dialog_avatar_title'))"
      :submit-text="String($t('save_avatar'))"
      :can-submit="Boolean(selectedUrl)"
      :submitting="saving"
      max-width="xl"
      max-height="lg"
      scrollable
      scrollable-content-class="-m-2 p-2"
      @submit="saveSelectedAvatar"
    >
      <div class="space-y-5">
        <div class="flex items-center gap-4 border-b border-gray-200 pb-5 dark:border-white/10">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="selectedUrl ? String($t('avatar_preview')) : ''"
            width="80"
            height="80"
            class="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-cover dark:border-white/10 dark:bg-white/5"
          />
          <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
            <BrandAvatarFallback />
          </div>
          <div class="min-w-0">
            <p class="font-serif text-lg font-500 text-gray-900 dark:text-gray-100">
              {{ selectedAppearance ? styleLabel(selectedAppearance.variant) : selectedExternalUrl ? $t('avatar_custom_label') : $t('avatar_current') }}
            </p>
            <p class="mt-1 max-w-lg font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ $t(isCustomizing ? 'avatar_customizer_helper' : 'avatar_picker_helper') }}
            </p>
          </div>
        </div>

        <p v-if="!isCustomizing" class="font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {{ $t('avatar_actions_hint') }}
        </p>

        <section v-if="!isCustomizing" class="space-y-3 rounded-xl bg-gray-50/80 p-4 dark:bg-white/5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
                {{ $t('avatar_import_title') }}
              </p>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {{ $t('avatar_import_helper') }}
              </p>
            </div>
            <a
              :href="playgroundUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 font-sans text-sm font-600 text-gray-700 transition-colors hover:bg-gray-200/70 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C82F6] dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {{ $t('avatar_open_playground') }}
              <NIcon name="i-ph-arrow-square-out" class="h-4 w-4" />
            </a>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <label for="tronche-avatar-url" class="sr-only">{{ $t('avatar_import_label') }}</label>
            <input
              id="tronche-avatar-url"
              v-model="avatarUrlInput"
              type="text"
              inputmode="url"
              autocomplete="off"
              maxlength="2048"
              :placeholder="String($t('avatar_import_placeholder'))"
              :aria-invalid="avatarUrlError"
              aria-describedby="tronche-avatar-help"
              class="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 font-sans text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#3C82F6] aria-[invalid=true]:border-red-500 dark:border-neutral-700 dark:bg-[#1D1D1D] dark:text-gray-100 dark:placeholder:text-gray-500"
              @input="avatarUrlError = false"
              @keydown.enter.prevent="applyTroncheUrl"
            />
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-sans text-sm font-600 text-white transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C82F6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:ring-offset-[#151515]"
              :disabled="!avatarUrlInput.trim()"
              @click="applyTroncheUrl"
            >
              {{ $t('avatar_import_action') }}
            </button>
          </div>
          <p
            id="tronche-avatar-help"
            aria-live="polite"
            class="font-sans text-xs leading-relaxed"
            :class="avatarUrlError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'"
          >
            {{ $t(avatarUrlError ? 'avatar_import_invalid' : 'avatar_import_format') }}
          </p>
        </section>

        <section v-if="isCustomizing" class="space-y-5" :aria-label="String($t('avatar_customizer_title'))">
          <div class="flex items-center justify-between gap-4">
            <label for="avatar-style" class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
              {{ $t('avatar_shape') }}
            </label>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 font-sans text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C82F6] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              @click="returnToGallery"
            >
              <NIcon name="i-ph-arrow-left" class="h-4 w-4" />
              {{ $t('avatar_back_to_gallery') }}
            </button>
          </div>
          <select
            id="avatar-style"
            v-model="draftVariant"
            class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-sans text-base text-gray-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#3C82F6] dark:border-neutral-700 dark:bg-[#1D1D1D] dark:text-gray-100"
          >
            <option v-for="variant in avatarVariants" :key="variant" :value="variant">
              {{ styleLabel(variant) }}
            </option>
          </select>

          <fieldset class="space-y-3">
            <legend class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
              {{ $t('avatar_colors') }}
            </legend>
            <div class="grid grid-cols-5 gap-3">
              <label
                v-for="(color, index) in draftColors"
                :key="index"
                class="flex min-w-0 flex-col items-center gap-2"
              >
                <span class="sr-only">{{ $t('avatar_color_number', { number: index + 1 }) }}</span>
                <input
                  v-model="draftColors[index]"
                  type="color"
                  class="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C82F6] dark:border-neutral-700 dark:bg-[#1D1D1D]"
                  :aria-label="String($t('avatar_color_number', { number: index + 1 }))"
                />
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ color.toUpperCase() }}</span>
              </label>
            </div>
          </fieldset>
        </section>

        <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <section v-for="group in avatarGroups" :key="group.variant" class="min-w-0">
            <h3 class="mb-2 font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
              {{ styleLabel(group.variant) }}
            </h3>
            <div class="grid grid-cols-4 gap-2" role="group" :aria-label="styleLabel(group.variant)">
              <div v-for="(avatar, index) in group.avatars" :key="avatar.id" class="group relative aspect-square">
                <ContextMenu
                  as-child
                  :items="avatarMenuItems(avatar)"
                  content-class="min-w-48"
                >
                  <button
                    type="button"
                    :aria-label="String($t('avatar_picker_option', { style: styleLabel(group.variant), number: index + 1 }))"
                    :aria-pressed="selectedId === avatar.id"
                    class="relative flex h-full w-full items-center justify-center rounded-full transition-[transform,box-shadow] duration-200 hover:z-10 hover:scale-105 active:scale-99 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-[#151515] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                    :class="selectedId === avatar.id
                      ? 'ring-2 ring-gray-900 dark:ring-white'
                      : ''"
                    @click="chooseAvatar(avatar)"
                  >
                    <img
                      :src="avatarUrl(avatar)"
                      alt=""
                      width="72"
                      height="72"
                      loading="lazy"
                      decoding="async"
                      class="h-full w-full rounded-full object-cover"
                    />
                    <span
                      v-if="selectedId === avatar.id"
                      aria-hidden="true"
                    class="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    >
                      <NIcon name="i-ph-check-bold" class="h-3 w-3" />
                    </span>
                  </button>
                </ContextMenu>

                <NDropdownMenu :items="avatarMenuItems(avatar)" :modal="false">
                  <button
                    type="button"
                    :aria-label="String($t('avatar_options', { style: styleLabel(group.variant), number: index + 1 }))"
                    class="avatar-menu-trigger absolute right-0 top-0 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-[#FAFAF9] text-gray-700 opacity-0 shadow-sm transition-[opacity,transform,background-color] duration-150 hover:scale-105 hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C82F6] dark:border-neutral-700 dark:bg-[#1D1D1D] dark:text-gray-200 dark:hover:bg-neutral-800"
                    @click.stop
                  >
                    <NIcon name="i-ph-dots-three-vertical" class="h-4 w-4" />
                  </button>
                </NDropdownMenu>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
type AvatarVariant = 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus' | 'marble'

interface AvatarAppearance {
  variant: AvatarVariant
  colors: string[]
}

interface AvatarPreset extends AvatarAppearance {
  id: string
  seed: string
  url: string
}

interface AvatarGroup extends AvatarAppearance {
  avatars: AvatarPreset[]
}

interface Props {
  modelValue: boolean
  currentAvatarUrl?: string
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentAvatarUrl: '',
  saving: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [avatarUrl: string]
}>()

const { $t } = useI18n()

const avatarVariants: AvatarVariant[] = ['beam', 'pixel', 'sunset', 'ring', 'bauhaus', 'marble']
const avatarGroupPresets: AvatarAppearance[] = [
  { variant: 'beam', colors: ['#E07A5F', '#3D405B', '#81B29A', '#F4D06F', '#D8A47F'] },
  { variant: 'pixel', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] },
  { variant: 'sunset', colors: ['#ff6b6b', '#ee5a24', '#f0932b', '#ffbe76', '#badc58'] },
  { variant: 'ring', colors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', '#e17055'] },
  { variant: 'bauhaus', colors: ['#ffe3b3', '#ff9a52', '#ff5252', '#c91e5a', '#3d2922'] },
  { variant: 'marble', colors: ['#5b1d99', '#0074b4', '#00b34c', '#ffd41f', '#fc6e3d'] },
]
const avatarGroups: AvatarGroup[] = avatarGroupPresets.map((group) => {
  const avatars: AvatarPreset[] = Array.from({ length: 4 }, (_, index) => {
    const seed = `verbatims-${group.variant}-${index + 1}`

    return {
      ...group,
      id: `${group.variant}-${index + 1}`,
      seed,
      url: buildAvatarUrl(seed, group),
    }
  })

  return { ...group, avatars }
})

const allAvatars = avatarGroups.flatMap(group => group.avatars)

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const selectedId = ref('')
const customizedAvatars = ref<Record<string, AvatarAppearance>>({})
const editorAvatarId = ref<string | null>(null)
const draftVariant = ref<AvatarVariant>('beam')
const draftColors = ref<string[]>([])
const isCustomizing = computed(() => editorAvatarId.value !== null)
const selectedPreset = computed(() => allAvatars.find(avatar => avatar.id === selectedId.value))
const selectedAppearance = computed(() => {
  const preset = selectedPreset.value
  if (!preset) return null

  if (isCustomizing.value && editorAvatarId.value === preset.id) {
    return { variant: draftVariant.value, colors: draftColors.value }
  }

  return customizedAvatars.value[preset.id] ?? preset
})
const selectedUrl = computed(() => {
  if (isCustomizing.value) {
    const preset = selectedPreset.value
    const appearance = selectedAppearance.value
    return preset && appearance ? buildAvatarUrl(preset.seed, appearance) : ''
  }

  if (selectedExternalUrl.value) return selectedExternalUrl.value

  const preset = selectedPreset.value
  const appearance = selectedAppearance.value
  return preset && appearance ? buildAvatarUrl(preset.seed, appearance) : ''
})
const previewUrl = computed(() => selectedUrl.value || props.currentAvatarUrl)
const avatarUrlInput = ref('')
const avatarUrlError = ref(false)
const selectedExternalUrl = ref('')
const playgroundUrl = computed(() => buildPlaygroundUrl(selectedUrl.value || props.currentAvatarUrl))

watch(isOpen, (open) => {
  if (open) initializeSelection()
  else editorAvatarId.value = null
})

function buildAvatarUrl(seed: string, appearance: AvatarAppearance) {
  const params = new URLSearchParams({
    variant: appearance.variant,
    size: '128',
    colors: appearance.colors.join(','),
  })

  return `https://tronche.cc/api/avatar/${seed}?${params.toString()}`
}

function normalizedTroncheAvatarUrl(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue) return null

  try {
    const parsedUrl = trimmedValue.startsWith('/api/avatar/')
      ? new URL(trimmedValue, 'https://tronche.cc')
      : new URL(trimmedValue)
    const seedMatch = parsedUrl.pathname.match(/^\/api\/avatar\/([^/]+)$/)

    if (
      parsedUrl.origin !== 'https://tronche.cc'
      || parsedUrl.protocol !== 'https:'
      || parsedUrl.username
      || parsedUrl.password
      || parsedUrl.hash
      || !seedMatch
      || trimmedValue.length > 2048
    ) return null

    const seed = decodeURIComponent(seedMatch[1] ?? '')
    if (!seed.trim() || seed === '.' || seed === '..' || seed.includes('/')) return null

    const variants = parsedUrl.searchParams.getAll('variant')
    if (variants.length > 1 || (variants.length === 1 && !isAvatarVariant(variants[0] ?? null))) return null

    return parsedUrl.toString()
  }
  catch {
    return null
  }
}

function buildPlaygroundUrl(avatarUrl: string) {
  const normalizedUrl = normalizedTroncheAvatarUrl(avatarUrl)
  if (!normalizedUrl) return 'https://tronche.cc/playground'

  const avatar = new URL(normalizedUrl)
  const encodedSeed = avatar.pathname.match(/^\/api\/avatar\/([^/]+)$/)?.[1] ?? ''
  const seed = decodeURIComponent(encodedSeed)
  const params = new URLSearchParams({
    name: seed,
    variant: avatar.searchParams.get('variant') || 'marble',
    size: avatar.searchParams.get('size') || '128',
  })
  const square = avatar.searchParams.get('square')
  const colors = avatar.searchParams.get('colors')

  if (square === 'true') params.set('square', 'true')
  if (colors) params.set('colors', colors)

  return `https://tronche.cc/playground?${params.toString()}`
}

function avatarUrl(avatar: AvatarPreset) {
  const appearance = editorAvatarId.value === avatar.id
    ? { variant: draftVariant.value, colors: draftColors.value }
    : customizedAvatars.value[avatar.id] ?? avatar

  return buildAvatarUrl(avatar.seed, appearance)
}

function initializeSelection() {
  selectedId.value = ''
  customizedAvatars.value = {}
  editorAvatarId.value = null
  avatarUrlError.value = false
  avatarUrlInput.value = ''
  selectedExternalUrl.value = ''

  const currentUrl = normalizedTroncheAvatarUrl(props.currentAvatarUrl)
  if (!currentUrl) return

  try {
    const parsedUrl = new URL(currentUrl)
    const seed = decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).at(-1) ?? '')
    const preset = allAvatars.find(avatar => avatar.seed === seed)
    selectedExternalUrl.value = currentUrl
    avatarUrlInput.value = currentUrl
    if (!preset) return

    selectedId.value = preset.id
    const variant = parsedUrl.searchParams.get('variant')
    const colors = parsedUrl.searchParams.get('colors')?.split(',')
    if (isAvatarVariant(variant) && colors?.length === 5 && colors.every(isHexColor)) {
      if (variant !== preset.variant || colors.some((color, index) => color.toLowerCase() !== preset.colors[index]?.toLowerCase())) {
        customizedAvatars.value[preset.id] = { variant, colors }
      }
    }
  }
  catch {
    // Keep the current avatar preview when its URL is not one of the preset URLs.
  }
}

function isAvatarVariant(variant: string | null): variant is AvatarVariant {
  return avatarVariants.includes(variant as AvatarVariant)
}

function isHexColor(color: string) {
  return /^#[\da-f]{6}$/i.test(color)
}

function styleLabel(variant: string) {
  return variant.charAt(0).toUpperCase() + variant.slice(1)
}

function chooseAvatar(avatar: AvatarPreset) {
  selectedId.value = avatar.id
  selectedExternalUrl.value = ''
  avatarUrlInput.value = ''
  avatarUrlError.value = false
}

function applyTroncheUrl() {
  const normalizedUrl = normalizedTroncheAvatarUrl(avatarUrlInput.value)
  if (!normalizedUrl) {
    avatarUrlError.value = true
    return
  }

  const parsedUrl = new URL(normalizedUrl)
  const seed = decodeURIComponent(parsedUrl.pathname.match(/^\/api\/avatar\/([^/]+)$/)?.[1] ?? '')
  const preset = allAvatars.find(avatar => avatar.seed === seed)

  selectedId.value = preset?.id ?? ''
  selectedExternalUrl.value = normalizedUrl
  avatarUrlInput.value = normalizedUrl
  avatarUrlError.value = false

  if (!preset) return

  const variant = parsedUrl.searchParams.get('variant')
  const colors = parsedUrl.searchParams.get('colors')?.split(',')
  const nextCustomizations = { ...customizedAvatars.value }
  if (isAvatarVariant(variant) && colors?.length === 5 && colors.every(isHexColor)) {
    nextCustomizations[preset.id] = { variant, colors }
  }
  else delete nextCustomizations[preset.id]
  customizedAvatars.value = nextCustomizations
}

function clearExternalSelection() {
  selectedExternalUrl.value = ''
  avatarUrlInput.value = ''
  avatarUrlError.value = false
}

function avatarMenuItems(avatar: AvatarPreset) {
  return [
    {
      label: String($t('avatar_choose_this')),
      leading: 'i-ph-check',
      onclick: () => chooseAvatar(avatar),
    },
    {
      label: String($t('avatar_customize_this')),
      leading: 'i-ph-pencil-simple',
      onclick: () => customizeAvatar(avatar),
    },
  ]
}

function customizeAvatar(avatar: AvatarPreset) {
  selectedId.value = avatar.id
  clearExternalSelection()
  const appearance = customizedAvatars.value[avatar.id] ?? avatar
  draftVariant.value = appearance.variant
  draftColors.value = [...appearance.colors]
  editorAvatarId.value = avatar.id
}

function returnToGallery() {
  const avatarId = editorAvatarId.value
  if (avatarId) {
    customizedAvatars.value = {
      ...customizedAvatars.value,
      [avatarId]: { variant: draftVariant.value, colors: [...draftColors.value] },
    }
  }
  editorAvatarId.value = null
}

function saveSelectedAvatar() {
  if (selectedUrl.value) emit('save', selectedUrl.value)
}
</script>

<style scoped>
@media (hover: none), (pointer: coarse) {
  .avatar-menu-trigger {
    opacity: 1;
  }
}
</style>
