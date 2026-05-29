<template>
  <NuxtLink
    :to="to"
    :href="href"
    class="group relative inline-block overflow-hidden font-sans text-sm transition-colors duration-300"
    :class="[
      defaultClasses,
      activeClasses
    ]"
  >
    <span class="relative z-1 transition-colors duration-300">
      <slot />
    </span>
    <span class="absolute inset-0 w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" :class="bgClasses" />
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  to?: string
  href?: string
  defaultClasses?: string
}

withDefaults(defineProps<Props>(), {
  to: undefined,
  href: undefined,
  defaultClasses: 'text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-[#0C0A09]'
})

const bgClasses = 'bg-[#0C0A09] dark:bg-[#FAFAF9]'
const activeClasses = 'group-active:scale-95 transition-transform'
</script>
