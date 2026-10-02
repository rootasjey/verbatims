<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage :transition="isDashboardPage ? dashboardPageTransition : false" />
    </NuxtLayout>
    <MobileBottomNavigation v-if="!isAuthPage && !isDashboardPage" />
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
const isDashboardPage = computed(() => route.path.startsWith('/dashboard'))
const dashboardViewTransitionPending = useState('dashboard-view-transition-pending', () => false)
const dashboardPageTransition = {
  name: 'dashboard-view',
  mode: 'out-in' as const,
  onAfterEnter: () => {
    dashboardViewTransitionPending.value = false
  }
}

const appReady = useState('app-ready', () => false)
onNuxtReady(() => {
  appReady.value = true
})
</script>
