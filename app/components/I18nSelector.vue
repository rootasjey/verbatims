<template>
  <NCombobox
    v-model="selected"
    :items="localeOptions"
    by="value"
    :_combobox-input="{
      placeholder: 'Select language...',
      class: 'text-sm',
    }"
    :_combobox-trigger="{
      btn: 'ghost-gray',
      size: 'sm',
      class: 'gap-1 px-2 text-sm font-normal',
    }"
  >
    <template #trigger="{ modelValue }">
      <span>{{ modelValue ? modelValue.label : 'EN' }}</span>
    </template>

    <template #label="{ item }">
      <span>{{ item.label }}</span>
    </template>
  </NCombobox>
</template>

<script setup lang="ts">
const { $switchLocale } = useI18n()
const { locale } = useI18nLocale()
const { syncLocale } = useI18nContentSync()

interface LocaleOption {
  value: string
  label: string
}

const localeOptions: LocaleOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
]

const selected = computed({
  get: () => localeOptions.find(o => o.value === (locale.value || 'en')) || localeOptions[0],
  set: (val: LocaleOption | null) => {
    if (!val) return
    $switchLocale(val.value)
    syncLocale(val.value)
  }
})
</script>
