<template>
  <NAvatar :src="src || undefined" :alt="alt" :size="size" :square="square">
    <template #fallback>
      <BrandAvatarFallback />
    </template>
  </NAvatar>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  src?: string | null
  alt: string
  size?: string
  square?: string
}>(), {
  size: '2',
  square: '2.5em',
})
</script>
