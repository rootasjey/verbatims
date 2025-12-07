<template>
  <NCombobox
    v-model="selectedLanguage"
    :items="availableLanguages"
    by="value"
    :_combobox-input="{
      placeholder: 'Select language...',
    }"
    data-testid="language-selector"
    @update:model-value="onLanguageChange"
  >
    <template #trigger="{ modelValue }">
      <template v-if="modelValue && typeof modelValue === 'object' && 'icon' in modelValue">
        <div class="flex items-center gap-2">
          <NIcon :name="modelValue.icon" />
          {{ modelValue.display }}
        </div>
      </template>
      <template v-else>
        Select language...
      </template>
    </template>

    <template #label="{ item }">
      <div class="flex items-center gap-2">
        <NIcon :name="item.icon"  />
        {{ item.display }}
      </div>
    </template>
  </NCombobox>
</template>

<script setup lang="ts">
import type { LanguageOption } from '~/stores/language'

// Props
interface Props {
  // Optional callback for when language changes (for custom handling)
  onLanguageChanged?: (language: LanguageOption) => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  onLanguageChanged: undefined
})

// Use the language store (initialization handled by plugin)
const languageStore = useLanguageStore()

// Reactive references with proper initialization handling
const selectedLanguage = computed({
  get: () => {
    // Ensure we return a valid language option even during initialization
    const current = languageStore.currentLanguage
    if (!current || !current.value) {
      return languageStore.availableLanguages[0] // Default to "All Languages"
    }
    return current
  },
  set: (value: LanguageOption) => {
    languageStore.setLanguage(value)
  }
})

const availableLanguages = computed(() => languageStore.availableLanguages)

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
