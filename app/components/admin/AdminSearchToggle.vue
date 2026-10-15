<template>
  <div class="inline-flex min-w-0 items-center gap-1.5">
    <Transition name="admin-search">
      <input
        v-if="open"
        ref="input"
        :value="modelValue"
        type="search"
        :placeholder="placeholder"
        :aria-label="placeholder"
        class="h-10 w-48 rounded-lg border border-[#d2cfc6] bg-[#f0efe9] px-3 font-sans text-sm text-gray-800 outline-none placeholder-[#77756f] transition-[border-color,box-shadow] focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.esc="close"
      />
    </Transition>
    <NTooltip :content="open ? closeLabel : placeholder" :_tooltip-content="{ side: 'bottom' }">
      <NButton
        icon
        btn="outline-gray"
        size="sm"
        :label="open ? 'i-tabler-x' : 'i-tabler-search'"
        class="h-10 w-10 shrink-0 rounded-lg border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10"
        :aria-label="open ? closeLabel : placeholder"
        @click="open ? close() : openSearch()"
      />
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder: string
  closeLabel: string
}>()

defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const open = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function openSearch() {
  open.value = true
  await nextTick()
  input.value?.focus()
}

function close() {
  open.value = false
  // Preserve a search when the field is only collapsed; the user can reopen it.
}
</script>

<style scoped>
.admin-search-enter-active,
.admin-search-leave-active {
  overflow: hidden;
  transition: width 180ms ease, opacity 140ms ease, transform 180ms ease;
}

.admin-search-enter-from,
.admin-search-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(0.375rem);
}

.admin-search-enter-to,
.admin-search-leave-from {
  width: 12rem;
  opacity: 1;
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .admin-search-enter-active,
  .admin-search-leave-active {
    transition-duration: 1ms;
  }
}
</style>
