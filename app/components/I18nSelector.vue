<template>
  <NCombobox
    v-model="selected"
    :items="localeOptions"
    by="value"
    :_combobox-input="comboboxInputProps"
    :_combobox-list="{
      class: 'min-w-[160px]',
    }"
    :_combobox-trigger="{
      btn: 'ghost-gray',
      size: 'sm',
      trailing: '',
      class: 'gap-1 px-1.5 text-sm font-normal w-fit min-w-0',
    }"
  >
    <template #trigger="{ modelValue }">
      <div class="flex items-center gap-1.5">
        <img
          v-if="modelValue"
          :src="modelValue.flag"
          alt=""
          class="w-5 h-3.5 object-cover rounded-[2px] shrink-0"
        />
        <span v-if="modelValue" class="text-xs font-medium leading-none">{{ modelValue.value === 'en' ? 'EN' : 'FRA' }}</span>
        <span v-else class="text-xs font-medium leading-none">EN</span>
      </div>
    </template>

    <template #label="{ item }">
      <div class="flex items-center gap-2">
        <img
          :src="item.flag"
          alt=""
          class="w-5 h-3.5 object-cover rounded-[2px] shrink-0"
        />
        <span>{{ item.label }}</span>
      </div>
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
  flag: string
}

const localeOptions: LocaleOption[] = [
  { value: 'en', label: 'English', flag: '/images/languages/england.png' },
  { value: 'fr', label: 'Français', flag: '/images/languages/france.png' },
]

const { $t } = useI18n()

const comboboxInputProps = computed(() => ({
  placeholder: $t('components.dialogs.select_language'),
  class: 'text-sm',
}))

const selected = computed({
  get: () => localeOptions.find(o => o.value === (locale.value || 'en')) || localeOptions[0],
  set: (val: LocaleOption | null) => {
    if (!val) return
    $switchLocale(val.value)
    syncLocale(val.value)
  }
})
</script>
