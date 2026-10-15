<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dashboard-home']
})
</script>

<template>
  <p class="sr-only">Redirecting to your favourites…</p>
</template>
