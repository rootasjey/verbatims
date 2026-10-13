<template>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    <template v-if="selectionMode">
      <span class="shrink-0 font-sans text-xs text-gray-600 dark:text-gray-300">
        {{ $t('common.selected_count', { count: selectedCount }) }}
      </span>
      <NTooltip :content="$t(allVisibleSelected ? 'common.select_none' : 'common.select_visible') as string">
        <NButton
          icon
          btn="ghost-gray"
          size="xs"
          rounded="full"
          class="h-9 w-9"
          :label="allVisibleSelected ? 'i-tabler-square-minus' : 'i-tabler-select-all'"
          :aria-label="$t(allVisibleSelected ? 'common.select_none' : 'common.select_visible') as string"
          :disabled="visibleCount === 0"
          @click="$emit('toggle-visible')"
        />
      </NTooltip>
      <div class="flex items-center md:hidden">
        <NTooltip :content="$t('common.selection_actions') as string">
          <NButton
            icon
            btn="ghost-gray"
            size="xs"
            rounded="full"
            class="h-9 w-9"
            label="i-tabler-dots"
            :aria-label="$t('common.selection_actions') as string"
            @click="drawerOpen = true"
          />
        </NTooltip>
      </div>
      <div class="hidden items-center gap-1 md:flex">
        <NTooltip
          v-for="action in actions"
          :key="action.key"
          :content="action.label"
        >
          <NButton
            icon
            btn="outline-gray"
            size="xs"
            rounded="full"
            class="h-9 w-9"
            :label="action.icon || 'i-tabler-bolt'"
            :aria-label="action.label"
            :disabled="action.disabled || selectedCount === 0"
            @click="$emit('action', action.key)"
          />
        </NTooltip>
      </div>
      <NTooltip v-if="selectedCount > 0" :content="$t('common.clear') as string">
        <NButton
          icon
          btn="ghost-gray"
          size="xs"
          rounded="full"
          class="hidden h-9 w-9 md:inline-flex"
          label="i-tabler-x"
          :aria-label="$t('common.clear') as string"
          @click="$emit('clear')"
        />
      </NTooltip>
      <NTooltip :content="$t('common.done') as string">
        <NButton
          icon
          btn="ghost-gray"
          size="xs"
          rounded="full"
          class="hidden h-9 w-9 md:inline-flex"
          label="i-tabler-check"
          :aria-label="$t('common.done') as string"
          @click="$emit('exit-mode')"
        />
      </NTooltip>
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
