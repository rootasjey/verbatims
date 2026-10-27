<template>
  <section class="grid min-h-[calc(100svh-3.75rem)] place-items-center px-6 py-20 md:px-10 md:py-28">
    <div class="w-full max-w-5xl text-center">
      <p class="font-sans text-[0.65rem] font-600 uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">404 · Archives</p>
      <h1 class="mt-5 font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-400 leading-[0.98] tracking-[-0.04em] text-gray-950 text-balance dark:text-gray-50">
        {{ title }}
      </h1>
      <p class="mx-auto mt-5 max-w-xl font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
        {{ description }}
      </p>

      <nav class="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" :aria-label="String($t('error_page.navigation'))">
        <NuxtLink
          :to="primaryTo"
          class="inline-flex min-h-11 items-center gap-2 rounded-full bg-gray-950 px-5 font-sans text-sm font-600 text-white transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-stone-500 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white"
        >
          {{ primaryLabel }}
          <NIcon name="i-ph-arrow-right" class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          v-if="secondaryTo && secondaryLabel"
          :to="secondaryTo"
          class="min-h-11 px-1 py-3 font-sans text-sm font-600 text-gray-600 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-stone-500 dark:text-gray-400 dark:decoration-white/20 dark:hover:text-gray-100"
        >
          {{ secondaryLabel }}
        </NuxtLink>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel?: string
  secondaryTo?: string
}

defineProps<Props>()

const { $t } = useI18n()
</script>
