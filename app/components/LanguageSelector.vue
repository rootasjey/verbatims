<template>
  <div :class="{ 'language-selector--compact': props.compact }">
    <NCombobox
      v-model="selectedLanguage"
      :items="availableLanguages"
      by="value"
      :_combobox-input="{
        placeholder: $t('common.select_language') as string,
      }"
      :_combobox-trigger="{
        class: triggerClass,
        block: false,
        trailing: props.compact ? 'i-lucide-chevron-down' : undefined,
        ariaLabel: props.ariaLabel ?? $t('common.select_language') as string,
      }"
      :_combobox-list="props.compact ? { class: '!w-max !min-w-40' } : undefined"
      data-testid="language-selector"
      @update:model-value="onLanguageChange"
    >
      <template #trigger="{ modelValue }">
        <template v-if="modelValue && typeof modelValue === 'object' && 'icon' in modelValue">
          <div class="flex items-center gap-2">
            <NIcon v-if="!props.compact" :name="modelValue.icon" />
            {{ modelValue.display }}
          </div>
        </template>
        <template v-else>
          {{ $t('common.select_language') }}
        </template>
      </template>

      <template #label="{ item }">
        <div class="flex items-center gap-2">
          <NIcon :name="item.icon"  />
          {{ item.display }}
        </div>
      </template>
    </NCombobox>
  </div>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'

// Props
interface Props {
  // Optional callback for when language changes (for custom handling)
  onLanguageChanged?: (language: LanguageOption) => void | Promise<void>
  useClassicDesign?: boolean
  compact?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  onLanguageChanged: undefined,
  useClassicDesign: false,
  compact: false,
  ariaLabel: undefined,
})

const { $t } = useI18n()

const triggerClass = computed(() => {
  const base = 'bg-transparent'
  const classicFlag = ' !text-xs bg-gray-100 dark:bg-gray-900 ring-none !rounded-0 shadow-none'
  const compactFlag = ' !h-auto !min-h-0 !w-auto !max-w-max !border-0 !bg-transparent !p-0 !shadow-none !text-xs !font-500 !text-gray-500 dark:!text-gray-400'
  return `${base} ${props.useClassicDesign ? classicFlag : ''} ${props.compact ? compactFlag : ''}`
})

// Use the language store (initialization handled by plugin)
const languageStore = useLanguageStore()

// Reactive references with proper initialization handling
const selectedLanguage = computed({
  get: () => {
    const current = languageStore.currentLanguage
    return availableLanguages.value.find(language => language.value === current?.value)
      ?? availableLanguages.value[0]
  },
  set: (value: LanguageOption) => {
    languageStore.setLanguage(value)
  }
})

const availableLanguages = computed(() => languageStore.availableLanguages.map(language => ({
  ...language,
  display: String($t(`content_language.${language.value}`))
})))

// Handle language change
const onLanguageChange = async (newLanguage: LanguageOption) => {
  try {
    // Update the store
    await languageStore.setLanguage(newLanguage)

    // Call custom callback if provided
    if (props.onLanguageChanged) {
      await props.onLanguageChanged(newLanguage)
    }
  } catch (error) {
    console.error('Failed to change language:', error)
    // Could add toast notification here if needed
  }
}
</script>

<style scoped>
.language-selector--compact :deep(button),
.language-selector--compact :deep([role='combobox']),
.language-selector--compact :deep([data-slot='combobox-trigger']),
.language-selector--compact :deep(input) {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  appearance: none;
}

.language-selector--compact :deep(button:hover),
.language-selector--compact :deep([role='combobox']:hover),
.language-selector--compact :deep([data-slot='combobox-trigger']:hover),
.language-selector--compact :deep(input:hover) {
  background: transparent !important;
}

.language-selector--compact :deep([class*='chevrons-up-down']),
.language-selector--compact :deep([class*='arrows-vertical']),
.language-selector--compact :deep([class*='arrows-up-down']) {
  display: none !important;
}

.language-selector--compact {
  display: inline-block;
  width: max-content;
}

.language-selector--compact :deep([data-slot='combobox']),
.language-selector--compact :deep([data-slot='combobox-anchor']),
.language-selector--compact :deep([data-slot='combobox-trigger']) {
  width: max-content !important;
  min-width: 0 !important;
}
</style>
