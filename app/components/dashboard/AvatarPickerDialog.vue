<template>
  <ClientOnly>
    <AppDialog
      v-model="isOpen"
      :title="String($t('dialog_avatar_title'))"
      :submit-text="String($t('save_avatar'))"
      :can-submit="Boolean(selectedUrl)"
      :submitting="saving"
      max-width="xl"
      max-height="lg"
      scrollable
      @submit="saveSelectedAvatar"
    >
      <div class="space-y-5">
        <div class="flex items-center gap-4 border-b border-gray-200 pb-5 dark:border-white/10">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="selectedPreset ? String($t('avatar_preview')) : ''"
            width="80"
            height="80"
            class="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-cover dark:border-white/10 dark:bg-white/5"
          />
          <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
            <BrandAvatarFallback />
          </div>
          <div class="min-w-0">
            <p class="font-serif text-lg font-500 text-gray-900 dark:text-gray-100">
              {{ selectedPreset ? styleLabel(selectedPreset.variant) : $t('avatar_current') }}
            </p>
            <p class="mt-1 max-w-lg font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ $t('avatar_picker_helper') }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <section v-for="group in avatarGroups" :key="group.variant" class="min-w-0">
            <h3 class="mb-2 font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
              {{ styleLabel(group.variant) }}
            </h3>
            <div class="grid grid-cols-4 gap-2" role="group" :aria-label="styleLabel(group.variant)">
              <button
                v-for="(avatar, index) in group.avatars"
                :key="avatar.id"
                type="button"
                :aria-label="String($t('avatar_picker_option', { style: styleLabel(group.variant), number: index + 1 }))"
                :aria-pressed="selectedId === avatar.id"
                class="group relative z-0 flex aspect-square min-w-0 items-center justify-center rounded-full transition-[transform,box-shadow] duration-200 hover:z-10 hover:scale-105 active:scale-99 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-[#151515] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                :class="selectedId === avatar.id
                  ? 'ring-2 ring-gray-900 dark:ring-white'
                  : ''"
                @click="selectedId = avatar.id"
              >
                <img
                  :src="avatar.url"
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
                  class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                >
                  <NIcon name="i-ph-check-bold" class="h-3 w-3" />
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
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

const avatarGroups = [
  { variant: 'beam', colors: ['#E07A5F', '#3D405B', '#81B29A', '#F4D06F', '#D8A47F'] },
  { variant: 'pixel', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] },
  { variant: 'sunset', colors: ['#ff6b6b', '#ee5a24', '#f0932b', '#ffbe76', '#badc58'] },
  { variant: 'ring', colors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', '#e17055'] },
  { variant: 'bauhaus', colors: ['#ffe3b3', '#ff9a52', '#ff5252', '#c91e5a', '#3d2922'] },
  { variant: 'marble', colors: ['#5b1d99', '#0074b4', '#00b34c', '#ffd41f', '#fc6e3d'] },
].map(group => ({
  ...group,
  avatars: Array.from({ length: 4 }, (_, index) => {
    const seed = `verbatims-${group.variant}-${index + 1}`
    const params = new URLSearchParams({
      variant: group.variant,
      size: '128',
      colors: group.colors.join(','),
    })

    return {
      id: `${group.variant}-${index + 1}`,
      url: `https://tronche.cc/api/avatar/${seed}?${params.toString()}`,
    }
  }),
}))

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const selectedId = ref('')
const selectedPreset = computed(() => avatarGroups
  .flatMap(group => group.avatars.map(avatar => ({ ...avatar, variant: group.variant })))
  .find(avatar => avatar.id === selectedId.value))
const selectedUrl = computed(() => selectedPreset.value?.url ?? '')
const previewUrl = computed(() => selectedUrl.value || props.currentAvatarUrl)

watch(isOpen, (open) => {
  if (!open) return
  selectedId.value = avatarGroups
    .flatMap(group => group.avatars)
    .find(avatar => avatar.url === props.currentAvatarUrl)?.id ?? ''
})

function styleLabel(variant: string) {
  return variant.charAt(0).toUpperCase() + variant.slice(1)
}

function saveSelectedAvatar() {
  if (selectedUrl.value) emit('save', selectedUrl.value)
}
</script>
