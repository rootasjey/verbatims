<template>
  <main class="grid min-h-[calc(100svh-3.5rem)] place-items-center px-4 md:min-h-screen">
    <LoadingWord label="Loading…" />
  </main>
</template>

<script setup lang="ts">
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}
</script>
