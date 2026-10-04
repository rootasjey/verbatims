<template>
  <NDrawer v-model:open="openModel" direction="bottom">
    <template #body>
      <div class="space-y-4 p-5 pb-7">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
              {{ $t('components.quote_actions.quick_actions') }}
            </h2>
            <p v-if="quoteText" class="mt-2 line-clamp-2 font-serif text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {{ quoteText }}
            </p>
          </div>
          <NButton icon btn="ghost-gray" size="xs" label="i-ph-x-bold" :aria-label="$t('common.close') as string" @click="openModel = false" />
        </div>

        <div class="divide-y divide-black/8 dark:divide-white/10">
          <button
            v-for="(action, index) in visibleActions"
            :key="`${action.label}-${index}`"
            type="button"
            :disabled="action.disabled"
            class="flex min-h-12 w-full items-center gap-3 py-2 text-left font-sans text-sm text-gray-800 transition-colors first:pt-0 last:pb-0 hover:text-black focus-visible:outline-none focus-visible:underline disabled:opacity-50 dark:text-gray-200 dark:hover:text-white"
            @click="runAction(action)"
          >
            <NIcon v-if="action.leading" :name="action.leading" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
interface Action { label?: string | null; leading?: string; disabled?: boolean; onclick?: () => void }

const props = defineProps<{
  open: boolean
  quoteText?: string
  actions: Action[]
}>()

const emit = defineEmits<{ (event: 'update:open', value: boolean): void }>()
const { $t } = useI18n()
const openModel = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})
const visibleActions = computed(() => props.actions.filter(action => action.label))

const runAction = (action: Action) => {
  if (action.disabled) return
  openModel.value = false
  action.onclick?.()
}
</script>
