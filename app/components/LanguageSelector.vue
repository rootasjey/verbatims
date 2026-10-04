<template>
  <div :class="{
    'language-selector--compact': props.compact,
    'language-selector--toolbar': props.appearance === 'toolbar',
    'language-selector--compact-toolbar': props.appearance === 'compact-toolbar',
  }">
    <NCombobox
      :model-value="selectedLanguage"
      :items="availableLanguages"
      by="value"
      :_combobox-input="{
        placeholder: $t('common.select_language') as string,
      }"
      :_combobox-trigger="{
        class: triggerClass,
        block: false,
        trailing: props.compact ? 'i-lucide-chevron-down' : ['toolbar', 'compact-toolbar'].includes(props.appearance) ? 'i-ph-caret-down' : undefined,
        ariaLabel: props.ariaLabel ?? $t('common.select_language') as string,
      }"
      :_combobox-list="props.compact || ['toolbar', 'compact-toolbar'].includes(props.appearance) ? { class: '!w-max !min-w-40' } : undefined"
      data-testid="language-selector"
      @update:model-value="onLanguageChange"
    >
      <template #trigger="{ modelValue }">
        <template v-if="modelValue && typeof modelValue === 'object' && 'icon' in modelValue">
          <div class="flex items-center gap-2">
            <NIcon v-if="!props.compact && props.appearance !== 'compact-toolbar'" :name="modelValue.icon" />
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
  appearance?: 'default' | 'toolbar' | 'compact-toolbar'
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  onLanguageChanged: undefined,
  useClassicDesign: false,
  compact: false,
  appearance: 'default',
  ariaLabel: undefined,
})

const { $t } = useI18n()

const triggerClass = computed(() => {
  const base = 'bg-transparent'
  const classicFlag = ' !text-xs bg-gray-100 dark:bg-gray-900 ring-none !rounded-0 shadow-none'
  const compactFlag = ' !h-auto !min-h-0 !w-auto !max-w-max !border-0 !bg-transparent !p-0 !shadow-none !text-xs !font-500 !text-gray-500 dark:!text-gray-400'
  const toolbarFlag = ' !h-10 !min-h-10 !w-full !min-w-36 !rounded-md !border !border-[#d2cfc6] !bg-[#f0efe9] !px-3 !py-2 !text-sm !font-medium !text-gray-800 hover:!bg-[#eae8e1] dark:!border-white/15 dark:!bg-white/[0.06] dark:!text-gray-200 dark:hover:!bg-white/10'
  const compactToolbarFlag = ' !h-10 !min-h-10 !w-auto !min-w-0 !max-w-max !rounded-md !border !border-[#d2cfc6] !bg-[#f0efe9] !px-3 !py-2 !text-sm !font-medium !text-gray-800 hover:!bg-[#eae8e1] dark:!border-white/15 dark:!bg-white/[0.06] dark:!text-gray-200 dark:hover:!bg-white/10'
  return `${base} ${props.useClassicDesign ? classicFlag : ''} ${props.compact ? compactFlag : ''} ${props.appearance === 'toolbar' ? toolbarFlag : ''} ${props.appearance === 'compact-toolbar' ? compactToolbarFlag : ''}`
})

// Use the language store (initialization handled by plugin)
const languageStore = useLanguageStore()

// Reactive references with proper initialization handling
const selectedLanguage = computed(() => {
  const current = languageStore.currentLanguage
  return availableLanguages.value.find(language => language.value === current?.value)
    ?? availableLanguages.value[0]
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

.language-selector--toolbar {
  display: block;
  min-width: 9rem;
}

.language-selector--compact-toolbar {
  display: block;
  width: max-content;
}

.language-selector--compact-toolbar :deep([data-slot='combobox-trigger']) {
  width: max-content !important;
  min-width: 0 !important;
}
</style>
