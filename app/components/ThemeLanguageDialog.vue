<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('home.theme_language_dialog_title') as string"
    max-width="md"
    hide-footer
  >
    <div class="space-y-5 pb-1">
      <p class="font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('home.theme_language_dialog_description') }}
      </p>

      <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy="true">
        <div v-for="index in 3" :key="index" class="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800" />
      </div>

      <div v-else-if="loadError" class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-neutral-700">
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('home.theme_language_load_error') }}</p>
        <NButton btn="link-gray" size="sm" @click="loadLanguages">{{ $t('home.theme_language_retry') }}</NButton>
      </div>

      <div v-else-if="languageOptions.length" class="grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" :aria-label="String($t('home.theme_language_dialog_title'))">
        <button
          v-for="option in languageOptions"
          :key="option.language"
          type="button"
          :disabled="option.quote_count === 0 || applyingLanguage"
          :aria-pressed="option.language === activeLanguage"
          class="group relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-center transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
          @click="selectLanguage(option.language)"
        >
          <img v-if="option.image" :src="option.image" alt="" class="h-9 w-9 object-contain" aria-hidden="true">
          <NIcon v-else :name="option.icon" class="h-9 w-9 shrink-0" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ option.display }}</span>
            <span class="mt-1 block font-sans text-xs text-gray-500 dark:text-gray-400">{{ quoteCountLabel(option.quote_count) }}</span>
          </span>
          <NIcon v-if="option.language === activeLanguage" name="i-lucide-check" class="absolute right-3 top-3 h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-5 font-sans text-sm text-gray-600 dark:border-neutral-700 dark:text-gray-400">
        {{ $t('home.theme_language_empty') }}
      </p>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'
import { getLanguageImage } from '~/utils/language'

interface ThemeLanguageCount {
  language: string
  quote_count: number
}

const props = defineProps<{
  modelValue: boolean
  themeSlug: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { $t } = useI18n()
const { locale } = useI18nLocale()
const languageStore = useLanguageStore()
const activeLanguage = computed(() => languageStore.currentLanguageValue === 'all'
  ? locale.value
  : languageStore.currentLanguageValue)
const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loading = ref(false)
const loadError = ref(false)
const applyingLanguage = ref(false)
const languageCounts = ref<ThemeLanguageCount[]>([])

const languageOptions = computed(() => languageStore.availableLanguages
  .filter(language => language.value !== 'all')
  .map((language: LanguageOption) => ({
    language: language.value,
    icon: language.icon,
    image: getLanguageImage(language.value) ?? null,
    display: String($t(`content_language.${language.value}`)),
    quote_count: languageCounts.value.find(item => item.language === language.value)?.quote_count ?? 0,
  })))

watch(isOpen, (open) => {
  if (open) void loadLanguages()
})

async function loadLanguages() {
  loading.value = true
  loadError.value = false
  try {
    const languagePath = `/api/themes/${props.themeSlug}/languages` as '/api/themes/:slug/languages'
    const response = await $fetch<ApiResponse<ThemeLanguageCount[]>, '/api/themes/:slug/languages'>(languagePath)
    languageCounts.value = response.data ?? []
  } catch (error) {
    console.error('Failed to load theme languages:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function quoteCountLabel(count: number) {
  return count === 1
    ? $t('home.theme_language_quote_singular')
    : $t('home.theme_language_quote_plural', { count })
}

async function selectLanguage(languageValue: string) {
  const option = languageOptions.value.find(item => item.language === languageValue)
  if (!option || option.quote_count === 0) return

  applyingLanguage.value = true
  try {
    await languageStore.setLanguage({
      value: option.language,
      display: option.display,
      icon: option.icon,
    })
    isOpen.value = false
  } finally {
    applyingLanguage.value = false
  }
}
</script>
