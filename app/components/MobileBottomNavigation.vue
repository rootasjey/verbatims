<template>
  <nav
    :aria-hidden="isHidden ? 'true' : undefined"
    :inert="isHidden ? true : undefined"
    :class="{ 'mobile-bottom-navigation--hidden': isHidden }"
    class="mobile-bottom-navigation fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 safe-area-pb md:hidden"
  >
    <!-- Floating Navigation Container -->
    <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 px-2 py-2">
      <div class="flex items-center space-x-2">
        <NuxtLink
          to="/"
          class="flex flex-col items-center justify-center hover:scale-102 active:scale-99 transition-all duration-300 group"
          @click="handleNavigation('/')"
        >
          <div
            class="w-12 h-12 rounded-4 flex items-center justify-center transition-all duration-300"
            :class="[
              isActiveRoute('/')
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            ]"
          >
            <NIcon
              name="i-ph-house-bold"
              class="w-5 h-5"
            />
          </div>
        </NuxtLink>

        <NuxtLink
          to="/search"
          class="flex flex-col items-center justify-center hover:scale-102 active:scale-99 transition-all duration-300 group"
          @click="handleNavigation('/search')"
        >
          <div
            class="w-12 h-12 rounded-4 flex items-center justify-center transition-all duration-300"
            :class="[
              isActiveRoute('/search')
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            ]"
          >
            <NIcon
              name="i-ph-magnifying-glass-bold"
              class="w-5 h-5"
            />
          </div>
        </NuxtLink>

        <NuxtLink
          to="/diary"
          class="flex flex-col items-center justify-center hover:scale-102 active:scale-99 transition-all duration-300 group"
          @click="handleNavigation('/diary')"
        >
          <div
            class="w-12 h-12 rounded-4 flex items-center justify-center transition-all duration-300"
            :class="[
              isActiveRoute('/diary')
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            ]"
          >
            <NIcon
              name="i-ph-book-open-bold"
              class="w-5 h-5"
            />
          </div>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const isHidden = ref(false)
const lastScrollY = ref(0)

const scrollThreshold = 8
let scrollFramePending = false

const updateVisibility = () => {
  if (!import.meta.client) return

  const currentScrollY = Math.max(window.scrollY, 0)
  const scrollDelta = currentScrollY - lastScrollY.value
  const maxScrollY = document.documentElement.scrollHeight - window.innerHeight
  const isNearTop = currentScrollY <= 24
  const isNearBottom = maxScrollY > 0 && currentScrollY >= maxScrollY - 24

  if (isNearTop || isNearBottom) {
    isHidden.value = false
  } else if (scrollDelta > scrollThreshold) {
    isHidden.value = true
  } else if (scrollDelta < -scrollThreshold) {
    isHidden.value = false
  }

  lastScrollY.value = currentScrollY
}

const handleScroll = () => {
  if (scrollFramePending) return

  scrollFramePending = true
  requestAnimationFrame(() => {
    scrollFramePending = false
    updateVisibility()
  })
}

const emit = defineEmits<{
  addQuote: []
}>()

const isActiveRoute = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleNavigation = (path: string) => {
  // Add haptic feedback if available
  if (import.meta.client && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }

  if (path === '/search' && route.path === path) {
    window.dispatchEvent(new Event('verbatims:focus-search-page-input'))
    return
  }

  // Navigate to the path
  if (route.path !== path) {
    navigateTo(path)
  }
}

const handleAddQuote = () => {
  // Add haptic feedback
  if (import.meta.client && 'vibrate' in navigator) {
    navigator.vibrate(100)
  }

  // Emit add quote event to parent
  emit('addQuote')
}

onMounted(() => {
  lastScrollY.value = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(() => route.fullPath, () => {
  isHidden.value = false

  if (import.meta.client) {
    lastScrollY.value = window.scrollY
  }
})
</script>

<style scoped>
.mobile-bottom-navigation {
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease;
}

.mobile-bottom-navigation--hidden {
  transform: translate(-50%, calc(100% + 1.5rem));
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-bottom-navigation {
    transition: opacity 160ms ease;
  }

  .mobile-bottom-navigation--hidden {
    transform: translateX(-50%);
  }
}

/* Safe area support for devices with notches */
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}

/* Ensure navigation doesn't interfere with content */
@media (max-width: 767px) {
  body {
    padding-bottom: 80px; /* Height of bottom navigation */
  }
}
</style>
