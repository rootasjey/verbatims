<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <MobileBottomNavigation v-if="!isAuthPage" />
    <NuxtRouteAnnouncer />
    <NToaster :_toast-viewport="{ class: 'z-[200]' }" />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import MobileBottomNavigation from '~/components/MobileBottomNavigation.vue'

const route = useRoute()
const isAuthPage = computed(() => route.path === '/login' || route.path === '/signup')

const appReady = useState('app-ready', () => false)
onNuxtReady(() => {
  appReady.value = true
})
</script>
