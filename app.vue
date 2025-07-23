<template>
  <div class="min-h-screen">
    <AppHeader />
    <main>
      <NuxtPage />
    </main>
    <NuxtRouteAnnouncer />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
</script>
