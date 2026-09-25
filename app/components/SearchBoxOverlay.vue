<template>
  <ClientOnly>
    <NDialog
      v-if="!mobile"
      v-model:open="openModel"
      :una="{ dialogContent: 'search-box-dialog' }"
      :ui="{ height: 'max-h-[86vh]' }"
      :_dialog-close="{ btn: 'ghost-gray' }"
    >
      <slot />
    </NDialog>

    <NDrawer
      v-else
      v-model:open="openModel"
      direction="bottom"
      :dismissible="true"
      :show-close="false"
      :una="{ drawerContent: 'h-auto max-h-[96dvh] w-full overflow-hidden rounded-t-2xl bg-[#F7F5EF] dark:bg-[#0C0A09] shadow-2xl', drawerFooter: 'mt-0 flex-row items-center justify-between gap-2 px-4 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]', drawerOverlay: 'bg-black/45' }"
    >
      <template #body>
        <div class="min-h-0 overflow-hidden">
          <slot />
        </div>
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </NDrawer>
  </ClientOnly>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  mobile: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})
</script>
