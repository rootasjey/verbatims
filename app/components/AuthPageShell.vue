<template>
  <main class="min-h-[calc(100svh-3.5rem)] bg-[#F7F5EF] px-5 py-8 text-gray-900 dark:bg-[#0C0A09] dark:text-gray-100 sm:px-8 md:flex md:items-center md:px-10 md:py-12">
    <div class="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-12 lg:gap-16">
      <header class="max-w-xl self-center">
        <h1 id="auth-page-title" class="max-w-[12ch] font-serif text-4xl font-400 leading-[1.08] tracking-[-0.03em] text-gray-950 dark:text-gray-100 sm:text-5xl md:text-6xl lg:text-7xl">
          {{ title }}
        </h1>
        <p class="mt-4 max-w-[38ch] font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
          {{ description }}
        </p>
      </header>

      <section class="w-full max-w-2xl md:justify-self-end" aria-labelledby="auth-page-title">
        <div class="rounded-2xl bg-[#F0EEE8] p-5 sm:p-8 lg:p-9 dark:bg-[#181715]">
          <slot />
          <div class="mt-6 font-sans text-sm text-gray-600 dark:text-gray-400">
            <slot name="footer" />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<style scoped>
:global(.auth-form-label) {
  @apply font-sans text-sm font-600 text-gray-700 dark:text-gray-300;
}

:global(.auth-form-input) {
  @apply min-h-12 w-full rounded-lg border border-[#CBC7BE] bg-[#F8F7F2] px-4 py-3 font-sans text-base font-400 text-gray-950 placeholder:text-[#67645E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0EEE8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#55514B] dark:bg-[#201F1D] dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 dark:focus-visible:ring-offset-[#181715];
}
</style>
