<template>
  <ClientOnly>
    <NDrawer
      v-if="isMobile"
      v-model:open="open"
      direction="bottom"
      :una="{
        drawerContent: 'max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-[#FAFAF9] shadow-2xl dark:bg-[#0C0A09]',
        drawerOverlay: 'bg-black/45',
      }"
    >
      <template #body>
        <div class="space-y-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div class="flex items-center justify-between gap-4">
            <h2 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ title }}</h2>
            <NButton btn="ghost-gray" size="sm" icon label="i-ph-x" :aria-label="closeLabel" @click="open = false" />
          </div>
          <slot />
        </div>
      </template>
    </NDrawer>

    <NDialog
      v-else
      v-model:open="open"
      :show-close="false"
      :una="{
        dialogContent: 'w-[calc(100vw-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-[#FAFAF9] text-gray-900 shadow-xl dark:border-gray-800 dark:bg-[#0C0A09] dark:text-gray-100',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100">{{ title }}</h2>
          <NButton btn="ghost-gray" size="sm" icon label="i-ph-x" :aria-label="closeLabel" @click="open = false" />
        </div>
      </template>
      <slot />
    </NDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  closeLabel: string
}>()

const open = defineModel<boolean>('open', { default: false })
const { isMobile } = useMobileDetection()
</script>
