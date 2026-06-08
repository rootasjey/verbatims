<template>
  <NCheckbox
    v-model="checked"
    checkbox="info"
    rounded="1"
    size="lg"
    class="p-2.5 hover:scale-105 active:scale-96 transition-[color,background-color,transform]"
    :disabled="disabled"
  >
    <NBadge
      :badge="badge"
      class="font-600 cursor-pointer
        light:hover:text-blue-600 hover:shadow light:hover:shadow-blue-100 hover:scale-105
        active:scale-99 transition-[color,background-color,transform]"
    >
      {{ label }}
    </NBadge>
  </NCheckbox>
</template>

<script setup lang="ts">
const checked = defineModel<boolean>({ required: true })

interface Props {
  label: string
  disabled?: boolean
  badge?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  badge: 'solid-blue'
})
</script>
