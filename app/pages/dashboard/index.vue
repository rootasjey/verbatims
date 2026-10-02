<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

await navigateTo('/dashboard/favourites', { replace: true })
</script>

<template>
  <p class="sr-only">Redirecting to your favourites…</p>
</template>
