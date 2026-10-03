<template>
  <span class="inline-flex items-baseline whitespace-nowrap">
    <button
      type="button"
      class="font-medium text-gray-700 underline decoration-gray-400/70 underline-offset-4 transition-colors hover:text-gray-950 hover:decoration-gray-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-200 dark:decoration-gray-500 dark:hover:text-white dark:hover:decoration-gray-300"
      @click="selectLanguage('all')"
    >
      {{ $t('common.all_languages') }}
    </button>
    <NDropdownMenu
      :items="languageItems"
      :modal="false"
      :_dropdown-menu-content="{ side: 'bottom', align: 'start' }"
    >
      <button
        type="button"
        class="ml-0.5 inline-flex h-5 w-5 translate-y-0.5 items-center justify-center rounded-sm text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-400 dark:hover:text-white"
        :aria-label="String($t('common.select_language'))"
      >
        <NIcon name="i-lucide-chevron-down" class="h-3.5 w-3.5" />
      </button>
    </NDropdownMenu>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  onLanguageChanged: () => void | Promise<void>
}>()

const { $t } = useI18n()
const languageStore = useLanguageStore()

const languageItems = computed(() => languageStore.availableLanguages.map(language => ({
  label: language.value === 'all'
    ? String($t('common.all_languages'))
    : String($t(`content_language.${language.value}`)),
  leading: language.icon,
  trailing: language.value === languageStore.currentLanguageValue ? 'i-lucide-check' : undefined,
  onclick: () => selectLanguage(language.value)
})))

const selectLanguage = async (value: string) => {
  if (value === languageStore.currentLanguageValue) return
  await languageStore.setLanguageByValue(value)
  await props.onLanguageChanged()
}
</script>
