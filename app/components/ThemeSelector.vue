<template>
  <div>
    <NSelect
      v-model="selectedTheme"
      :items="themeOptions"
      value-key="label"
      item-key="label"
      :size="props.appearance === 'settings' ? 'sm' : 'xs'"
      :_select-trigger="props.appearance === 'settings' ? { class: '!h-10 !min-h-10 !w-full !min-w-36 !rounded-md !border !border-[#d2cfc6] !bg-[#f0efe9] !px-3 !py-2 !text-sm !font-medium !text-gray-800 hover:!bg-[#eae8e1] dark:!border-white/15 dark:!bg-white/[0.06] dark:!text-gray-200 dark:hover:!bg-white/10' } : undefined"
      :_select-content="{ bodyLock: false }"
      select="light:soft-rose dark:soft-gray"
      :select-item="props.appearance === 'settings' ? 'light:gray dark:gray' : 'light:rose dark:gray'"
      @update:model-value="onThemeChange"
    >
      <template #value="{ modelValue }">
        <span class="flex items-center gap-2">
          <NIcon :name="(modelValue as ThemeOption)?.icon" class="w-4 h-4" />
          {{ (modelValue as ThemeOption)?.label }}
        </span>
      </template>
      <template #item="{ item }">
        <span class="flex items-center gap-2">
          <NIcon :name="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </span>
      </template>
    </NSelect>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  appearance?: 'default' | 'settings'
}>(), {
  appearance: 'default',
})

interface ThemeOption {
  label: string;
  value: string;
  icon: string;
}

const themeOptions: ThemeOption[] = [
  { label: 'System', value: 'system', icon: 'i-ph-monitor-duotone' },
  { label: 'Light', value: 'light', icon: 'i-ph-sun-duotone' },
  { label: 'Dark', value: 'dark', icon: 'i-ph-moon-duotone' },
]

function getInitialTheme(): ThemeOption {
  if (import.meta.client) {
    const saved = localStorage.getItem('theme')
    const found = themeOptions.find(opt => opt.value === saved)
    if (found) return found
    return themeOptions[0]!
  }
  return themeOptions[0]!
}

const selectedTheme = ref<ThemeOption>(getInitialTheme())

function onThemeChange(option: ThemeOption) {
  if (!import.meta.client) return
  selectedTheme.value = option
  localStorage.setItem('theme', option.value)
  
  if (option.value === 'system') {
    document.documentElement.classList.remove('dark', 'light')
    // Use system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.add('light')
    }
  } else {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(option.value)
  }
}

onMounted(() => {
  if (!import.meta.client) return
  // Apply theme on mount
  onThemeChange(selectedTheme.value)
  // Listen for system changes if system selected
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (selectedTheme.value.value === 'system') {
      const found = themeOptions.find(opt => opt.value === 'system')
      if (found) onThemeChange(found)
    }
  })
})
</script>
