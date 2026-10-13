<template>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    <template v-if="selectionMode">
      <span class="hidden font-sans text-xs text-gray-600 dark:text-gray-300 md:inline">
        {{ $t('common.selected_count', { count: selectedCount }) }}
      </span>
      <NButton
        btn="ghost-gray"
        size="sm"
        rounded="full"
        class="hidden font-sans text-xs md:inline-flex"
        :disabled="visibleCount === 0"
        @click="$emit('toggle-visible')"
      >
        <NIcon :name="allVisibleSelected ? 'i-tabler-square-minus' : 'i-tabler-select-all'" class="mr-1.5 h-4 w-4" />
        <span>{{ $t(allVisibleSelected ? 'common.select_none' : 'common.select_visible') }}</span>
      </NButton>
      <div class="flex items-center gap-1 md:hidden">
        <NButton
          btn="outline-gray"
          size="sm"
          rounded="full"
          class="font-sans text-xs"
          @click="drawerOpen = true"
        >
          <NIcon name="i-tabler-dots" class="mr-1 h-4 w-4" />
          <span>{{ $t('common.selection_actions') }}</span>
          <span v-if="selectedCount" class="ml-1 rounded-full bg-black/8 px-1.5 dark:bg-white/10">{{ selectedCount }}</span>
        </NButton>
        <NButton
          btn="ghost-gray"
          size="sm"
          rounded="full"
          class="font-sans text-xs"
          :disabled="visibleCount === 0"
          @click="$emit('toggle-visible')"
        >
          <NIcon :name="allVisibleSelected ? 'i-tabler-square-minus' : 'i-tabler-select-all'" class="h-4 w-4" />
          <span class="sr-only">{{ $t(allVisibleSelected ? 'common.select_none' : 'common.select_visible') }}</span>
        </NButton>
      </div>
      <div class="hidden items-center gap-1 md:flex">
        <NButton
          v-for="action in actions"
          :key="action.key"
          btn="outline-gray"
          size="xs"
          rounded="full"
          class="font-sans text-xs"
          :disabled="action.disabled || selectedCount === 0"
          @click="$emit('action', action.key)"
        >
          <NIcon v-if="action.icon" :name="action.icon" class="mr-1.5 h-3.5 w-3.5" />
          {{ action.label }}
        </NButton>
      </div>
      <NButton
        v-if="selectedCount > 0"
        btn="ghost-gray"
        size="sm"
        rounded="full"
        class="hidden font-sans text-xs md:inline-flex"
        @click="$emit('clear')"
      >
        {{ $t('common.clear') }}
      </NButton>
      <NButton
        btn="ghost-gray"
        size="sm"
        rounded="full"
        class="hidden font-sans text-xs md:inline-flex"
        @click="$emit('exit-mode')"
      >
        {{ $t('common.done') }}
      </NButton>
    </template>

    <ClientOnly>
      <NDrawer v-model:open="drawerOpen" direction="bottom">
        <template #body>
          <div class="space-y-4 p-5 pb-7">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
                  {{ $t('common.selected_count', { count: selectedCount }) }}
                </h2>
                <button
                  type="button"
                  class="mt-2 font-sans text-sm text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:text-white"
                  :disabled="visibleCount === 0"
                  @click="$emit('toggle-visible')"
                >
                  {{ $t(allVisibleSelected ? 'common.select_none' : 'common.select_visible') }}
                </button>
              </div>
              <NButton icon btn="ghost-gray" size="xs" label="i-ph-x-bold" :aria-label="$t('common.close') as string" @click="drawerOpen = false" />
            </div>

            <div class="divide-y divide-black/8 dark:divide-white/10">
              <button
                v-for="action in actions"
                :key="action.key"
                type="button"
                :disabled="action.disabled || selectedCount === 0"
                class="flex min-h-12 w-full items-center gap-3 py-2 text-left font-sans text-sm text-gray-800 transition-colors first:pt-0 last:pb-0 hover:text-black focus-visible:outline-none focus-visible:underline disabled:opacity-45 dark:text-gray-200 dark:hover:text-white"
                @click="runAction(action.key)"
              >
                <NIcon v-if="action.icon" :name="action.icon" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <span>{{ action.label }}</span>
              </button>
              <button
                type="button"
                class="flex min-h-12 w-full items-center py-2 text-left font-sans text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                :disabled="selectedCount === 0"
                @click="$emit('clear'); drawerOpen = false"
              >
                {{ $t('common.clear') }}
              </button>
              <button
                type="button"
                class="flex min-h-12 w-full items-center py-2 text-left font-sans text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                @click="$emit('exit-mode'); drawerOpen = false"
              >
                {{ $t('common.done') }}
              </button>
            </div>
          </div>
    </template>
      </NDrawer>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
interface BulkAction {
  key: string
  label: string
  icon?: string
  disabled?: boolean
}

const props = defineProps<{
  selectionMode: boolean
  selectedCount: number
  visibleCount: number
  actions: BulkAction[]
}>()

const { $t } = useI18n()
const allVisibleSelected = computed(() => props.visibleCount > 0 && props.selectedCount >= props.visibleCount)
const emit = defineEmits<{
  (event: 'toggle-visible'): void
  (event: 'clear'): void
  (event: 'exit-mode'): void
  (event: 'action', key: string): void
}>()
const drawerOpen = ref(false)

const runAction = (key: string) => {
  drawerOpen.value = false
  emit('action', key)
}
</script>
