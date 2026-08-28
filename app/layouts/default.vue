<template>
  <div
    class="min-h-screen"
    :class="route.path === '/'
      ? 'bg-[#F7F5EF] dark:bg-[#0C0A09]'
      : 'bg-gray-50 dark:bg-[#0C0A09]'"
  >
    <!-- Desktop header: hidden on screens < 768px -->
    <AppMastheadBar />

    <!-- Mobile header: hidden on screens >= 768px -->
    <header
      class="fixed top-0 left-0 right-0 z-40 md:hidden
        px-4 py-3 safe-area-pt"
        :class="[
          {
            'bg-[#F7F5EF] dark:bg-[#0C0A09]': scrollY === 0 && route.path === '/',
            'bg-[#FAFAF9] dark:bg-[#0C0A09]': scrollY === 0 && route.path !== '/',
            'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && route.path === '/',
            'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && route.path !== '/'
          }
        ]"
    >
      <div
        class="flex items-center justify-between gap-3"
        @click.self="scrollToTop"
      >
        <div class="flex items-center">
          <NButton
            btn="~"
            @click="handleAppIconClick"
            size="sm"
            class="m-0 p-3"
          >
            <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl">verbatims</span>
          </NButton>
        </div>

        <span v-if="route.path === '/' && homeTheme" class="min-w-0 flex-1 truncate text-center font-sans text-xs text-gray-600 dark:text-gray-300">
          {{ homeTheme.name }} · {{ currentDate }}
        </span>
        <span v-else class="inline flex-1 text-center font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>

        <NButton
          icon
          btn="ghost-gray"
          :label="showMobileMenu ? 'i-ph-x' : 'i-ph-list'"
          size="sm"
          :aria-label="String($t(showMobileMenu ? 'common.close' : 'nav.menu'))"
          :aria-expanded="showMobileMenu"
          aria-controls="mobile-site-menu"
          @click="showMobileMenu = !showMobileMenu"
        />
      </div>
    </header>

    <Transition name="mobile-menu">
      <div
        v-if="showMobileMenu"
        id="mobile-site-menu"
        class="mobile-site-menu fixed inset-0 z-50 flex flex-col bg-[#F7F5EF] px-6 pb-8 pt-20 dark:bg-[#0C0A09] md:hidden"
        :class="{ 'mobile-site-menu-dragging': isDraggingMenu }"
        :style="isDraggingMenu ? { transform: `translateY(${menuDragOffset}px)` } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-label="String($t('nav.menu'))"
        @touchstart="handleMenuTouchStart"
        @touchmove.prevent="handleMenuTouchMove"
        @touchend="handleMenuTouchEnd"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              {{ currentDate }}
            </p>
            <p v-if="route.path === '/' && homeTheme" class="mt-2 font-sans text-sm text-gray-700 dark:text-gray-300">
              {{ homeTheme.name }}
            </p>
          </div>
          <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="closeMobileMenu" />
        </div>
        <nav class="mt-14 flex flex-col gap-5" :aria-label="String($t('nav.menu'))">
          <NuxtLink v-for="(item, index) in mobileMenuItems.filter(item => item.to)" :key="item.to" :to="item.to!" class="mobile-site-menu-link" :style="{ '--menu-index': index }" @click="closeMobileMenu">
            {{ item.label }}
          </NuxtLink>
          <button type="button" class="mobile-site-menu-link text-left" style="--menu-index: 4" @click="openContribution">
            {{ $t('nav.contribute') }}
          </button>
        </nav>
      </div>
    </Transition>

    <!-- Main content: responsive top/bottom spacing -->
    <main class="pt-14 md:pt-0 pb-10 md:pb-10">
      <slot />
    </main>

    <!-- The homepage footer is part of the editorial scroll; inner pages keep the desktop convention. -->
    <AppFooter :class="route.path === '/' ? 'homepage-v3-footer' : 'hidden md:block'" />

    <!-- Mobile-only drawers (client-only to avoid SSR issues with NDrawer) -->
    <ClientOnly>
      <AddQuoteDrawer
        v-model:open="showAddQuote"
        @submitted="handleQuoteAdded"
      />
      <ReportDrawer
        v-model:open="showReportDrawer"
        :target-type="'general'"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { $t } = useI18n()
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const showMobileMenu = ref(false)
const previousBodyOverflow = ref('')
const previousDocumentOverflow = ref('')
const menuTouchStartY = ref<number | null>(null)
const menuDragOffset = ref(0)
const isDraggingMenu = ref(false)
const menuSwipeThreshold = 110

const mobileMenuItems = computed(() => [
  { label: String($t('nav.explore')), leading: 'i-ph-compass', to: '/quotes' },
  { label: String($t('nav.authors')), leading: 'i-ph-users-three', to: '/authors' },
  { label: String($t('nav.references')), leading: 'i-ph-book-open-text', to: '/references' },
  { label: String($t('nav.about')), leading: 'i-ph-info', to: '/about' },
  { label: String($t('nav.contribute')), leading: 'i-ph-plus-circle', onclick: () => { showAddQuote.value = true } },
])

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
})

const scrollY = ref(0)

const scrollToTop = () => {
  if (import.meta.client) {
    if (scrollY.value === 0) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleScroll = () => {
  if (import.meta.client) {
    scrollY.value = window.scrollY
  }
}

const handleAppIconClick = (event: MouseEvent) => {
  if (route.path !== '/') {
    navigateTo('/')
    return
  }
  event.preventDefault()
  scrollToTop()
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const openContribution = () => {
  closeMobileMenu()
  showAddQuote.value = true
}

const handleMobileMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMobileMenu()
}

const handleMenuTouchStart = (event: TouchEvent) => {
  if (!event.touches[0]) return
  menuTouchStartY.value = event.touches[0].clientY
  isDraggingMenu.value = true
}

const handleMenuTouchMove = (event: TouchEvent) => {
  if (menuTouchStartY.value === null || !event.touches[0]) return
  const delta = event.touches[0].clientY - menuTouchStartY.value
  menuDragOffset.value = Math.max(0, delta)
}

const handleMenuTouchEnd = () => {
  if (menuTouchStartY.value === null) return
  const shouldClose = menuDragOffset.value >= menuSwipeThreshold
  menuTouchStartY.value = null
  isDraggingMenu.value = false

  if (shouldClose) {
    closeMobileMenu()
    menuDragOffset.value = 0
    return
  }

  menuDragOffset.value = 0
}

watch(showMobileMenu, (isOpen) => {
  if (!import.meta.client) return

  if (isOpen) {
    previousBodyOverflow.value = document.body.style.overflow
    previousDocumentOverflow.value = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    menuTouchStartY.value = null
    isDraggingMenu.value = false
    menuDragOffset.value = 0
    document.body.style.overflow = previousBodyOverflow.value
    document.documentElement.style.overflow = previousDocumentOverflow.value
  }
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleMobileMenuKeydown)
  scrollY.value = window.scrollY
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleMobileMenuKeydown)
  if (import.meta.client) {
    document.body.style.overflow = previousBodyOverflow.value
    document.documentElement.style.overflow = previousDocumentOverflow.value
  }
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
  ]
})
</script>

<style scoped>
.safe-area-pt {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}

.mobile-site-menu-link {
  color: #272522;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(2.25rem, 10vw, 3.5rem);
  letter-spacing: -0.04em;
  line-height: 0.98;
}

.mobile-site-menu-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 6px;
}

.mobile-site-menu-link {
  opacity: 0;
  animation: mobile-menu-link-in 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--menu-index, 0) * 55ms + 100ms);
}

@keyframes mobile-menu-link-in {
  from { opacity: 0; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.mobile-site-menu-dragging { transition: none; }

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-1.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition-duration: 0.01ms;
  }

  .mobile-site-menu-link {
    animation: none;
    opacity: 1;
  }
}

:global(html.dark .mobile-site-menu-link) { color: #f5f2ec; }
</style>
