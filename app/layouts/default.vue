<template>
  <div
    class="min-h-screen"
    :class="usesWarmEditorialSurface
      ? 'bg-[#F7F5EF] dark:bg-[#0C0A09]'
      : 'bg-gray-50 dark:bg-[#0C0A09]'"
  >
    <!-- Desktop header: hidden on screens < 768px -->
    <AppMastheadBar />

    <!-- Mobile header: hidden on screens >= 768px -->
    <header
      :class="[
        'fixed top-0 left-0 right-0 md:hidden px-4 py-3 safe-area-pt transition-colors',
        modalScrollLocked ? 'pointer-events-none z-[60] bg-[#FAFAF9]/60 backdrop-blur-sm dark:bg-[#0C0A09]/60' : 'z-40',
          {
            'bg-[#F7F5EF] dark:bg-[#0C0A09]': !modalScrollLocked && scrollY === 0 && usesWarmEditorialSurface,
            'bg-[#FAFAF9] dark:bg-[#0C0A09]': !modalScrollLocked && scrollY === 0 && !usesWarmEditorialSurface,
            'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': !modalScrollLocked && scrollY !== 0 && usesWarmEditorialSurface,
            'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': !modalScrollLocked && scrollY !== 0 && !usesWarmEditorialSurface
          }
        ]"
      :style="!modalScrollLocked && isQuoteDetailPage && scrollY === 0 ? { backgroundColor: 'transparent', backdropFilter: 'none' } : undefined"
    >
      <div
        class="flex items-center justify-between gap-3"
        @click.self="scrollToTop"
      >
        <div class="flex items-center">
          <NButton
            v-if="isQuoteDetailPage"
            icon
            btn="ghost-gray"
            label="i-ph-arrow-left"
            size="sm"
            class="mr-1 min-h-11 min-w-11"
            :aria-label="String($t('components.quote_sticky.back_to_results'))"
            @click.stop="navigateBackToQuoteResults"
          />
          <Transition name="quote-masthead-brand">
            <NButton
              v-if="!isQuoteDetailPage || scrollY > 48"
              btn="~"
              @click="handleAppIconClick"
              size="sm"
              class="m-0 p-3"
            >
              <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl">verbatims</span>
            </NButton>
          </Transition>
        </div>

        <span class="flex-1" aria-hidden="true" />
        <NButton
          v-if="route.path === '/' && homeTheme"
          icon
          btn="ghost-gray"
          label="i-lucide-book-open"
          size="sm"
          :aria-label="String($t('home.theme_details'))"
          :aria-expanded="showMobileTheme"
          aria-controls="mobile-theme-sheet"
          @click="showMobileTheme = true"
        />

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

    <ClientOnly>
      <NDrawer
        v-if="route.path === '/' && homeTheme"
        v-model:open="showMobileTheme"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] rounded-t-3xl bg-[#F7F5EF] dark:bg-[#1C1917] shadow-2xl', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
          <div id="mobile-theme-sheet" class="px-6 pb-8 pt-5" aria-label="Theme details">
            <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100">{{ homeTheme.name }}</h2>
              <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="showMobileTheme = false" />
            </div>
            <p v-if="homeTheme.description" class="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ homeTheme.description }}
            </p>
            <p class="mt-4 text-xs text-gray-500 dark:text-gray-500">
              {{ homeStats.quotes.toLocaleString() }} citations · {{ homeStats.references.toLocaleString() }} références · {{ homeStats.authors.toLocaleString() }} auteurs
            </p>
            <p class="mt-2 font-sans text-xs text-gray-400 dark:text-gray-500">
              {{ $t('home.edition_date', { date: currentEditionDate }) }}
            </p>
          </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <ClientOnly>
      <NDrawer
        v-model:open="showMobileMenu"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] h-screen rounded-none bg-[#F7F5EF] dark:bg-[#0C0A09]', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
      <div
        id="mobile-site-menu"
        class="mobile-site-menu flex h-full flex-col overflow-y-auto px-6 pb-32 pt-20"
        role="dialog"
        aria-modal="true"
        :aria-label="String($t('nav.menu'))"
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
          <details class="group border-t border-black/10 pt-5 dark:border-white/15" style="--menu-index: 4">
            <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between font-sans text-xl font-500 text-gray-900 dark:text-gray-100">
              {{ $t('nav.contribute') }}
              <span class="flex items-center gap-3">
                <NAvatar v-if="user" :src="user.avatar_url" :alt="user.name" class="h-10 w-10 rounded-full">
                  <template #fallback><BrandAvatarFallback /></template>
                </NAvatar>
                <NIcon name="i-ph-caret-down" class="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div class="mt-3 grid gap-1 pl-1">
              <button v-if="user" type="button" class="flex min-h-11 items-center gap-3 py-2 font-sans text-base text-gray-700 dark:text-gray-300" @click="openContribution">
                <NIcon name="i-ph-quotes-duotone" />{{ $t('nav.add_quote') }}
              </button>
              <button type="button" class="flex min-h-11 items-center gap-3 py-2 font-sans text-base text-gray-700 dark:text-gray-300" @click="openMobileReport">
                <NIcon name="i-ph-bug-duotone" />{{ $t('nav.report_issue') }}
              </button>
              <NuxtLink v-if="!user" to="/login" class="flex min-h-11 items-center gap-3 py-2 font-sans text-base text-gray-700 dark:text-gray-300" @click="closeMobileMenu">
                <NIcon name="i-ph-sign-in" />{{ $t('nav.sign_in') }}
              </NuxtLink>

              <details v-if="user" class="group mt-3 border-t border-black/10 pt-3 dark:border-white/15">
                <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between font-sans text-base font-600 text-gray-700 dark:text-gray-300">
                  {{ $t('components.user_menu.my_space') }}
                  <NIcon name="i-ph-caret-down" class="transition-transform group-open:rotate-180" />
                </summary>
                <div class="mt-2 grid gap-1">
                  <NuxtLink v-for="item in mobileAccountLinks" :key="item.to" :to="item.to" class="flex min-h-11 items-center gap-3 py-2 font-sans text-base text-gray-700 dark:text-gray-300" @click="closeMobileMenu">
                    <NIcon :name="item.icon" />{{ item.label }}
                  </NuxtLink>
                </div>
              </details>
              <button v-if="user" type="button" class="mt-2 flex min-h-11 items-center gap-3 border-t border-black/10 pt-3 text-left font-sans text-base text-gray-700 dark:border-white/15 dark:text-gray-300" @click="signOutMobile">
                <NIcon name="i-ph-sign-out" />{{ $t('components.user_menu.sign_out') }}
              </button>
            </div>
          </details>
        </nav>

        <details class="group mt-10 border-t border-black/10 pt-5 dark:border-white/15">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between font-sans text-sm font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            {{ $t('nav.more_information') }}
            <NIcon name="i-ph-caret-down" class="transition-transform group-open:rotate-180" />
          </summary>
          <nav class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1" :aria-label="String($t('nav.more_information'))">
            <NuxtLink
              v-for="item in mobileInformationLinks"
              :key="item.to"
              :to="item.to"
              class="flex min-h-11 items-center font-sans text-base text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </details>

        <div class="mt-12 border-t border-black/10 pt-5 dark:border-white/15" aria-label="Preferences">
          <div class="flex items-center gap-2">
            <I18nSelector />
            <ThemeSelector />
          </div>
        </div>
      </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <!-- Main content: responsive top/bottom spacing -->
    <main
      class="pt-14 md:pt-0 md:pb-10"
      :class="[
        route.path.startsWith('/quotes/')
          ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]'
          : 'pb-10',
        isDashboardPage ? 'min-h-[calc(100vh-3.5rem)]' : ''
      ]"
    >
      <div v-if="isDashboardPage" class="mx-auto w-full max-w-6xl px-6 pb-10 pt-8 sm:px-8 md:pb-14 md:pt-28 lg:px-10">
        <header class="pb-8 md:pb-12">
          <h1 class="font-serif text-5xl font-400 leading-[0.98] tracking-[-0.035em] text-gray-900 dark:text-gray-100 sm:text-6xl lg:text-7xl">
            {{ $t('dashboard.workspace_title') }}
          </h1>
          <p class="mt-4 max-w-2xl font-sans text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
            {{ $t('dashboard.workspace_description') }}
          </p>
          <DashboardContextNav class="mt-6" />
        </header>
        <div id="dashboard-page-toolbar" class="mb-5 [&:empty]:hidden" />
        <div
          class="dashboard-data-panel-shell"
          :aria-busy="dashboardViewTransitionPending"
        >
          <section :class="['min-h-full', isDashboardListsPage ? 'px-0 py-0' : 'rounded-2xl bg-[#e7e4dd] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]']">
            <div :inert="dashboardViewTransitionPending">
              <slot />
            </div>
          </section>
          <div
            v-if="dashboardViewTransitionPending"
            class="dashboard-transition-state rounded-2xl bg-[#e7e4dd] dark:bg-[#17191e]"
            role="status"
            :aria-label="$t('common.loading') as string"
          >
            <span class="sr-only">{{ $t('common.loading') }}</span>
            <div aria-hidden="true" class="w-full max-w-3xl space-y-6 px-5 sm:px-8 lg:px-12">
              <div
                v-for="row in 3"
                :key="row"
                class="space-y-3 border-b border-stone-300/70 pb-6 last:border-0 dark:border-white/10 motion-reduce:animate-none animate-pulse"
              >
                <span class="block h-4 w-full rounded-sm bg-stone-300/70 dark:bg-white/10" />
                <span class="block h-4 w-4/5 rounded-sm bg-stone-300/70 dark:bg-white/10" />
                <span class="block h-3 w-1/3 rounded-sm bg-stone-300/70 dark:bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <slot v-else />
    </main>

    <!-- Keep the full editorial footer on desktop; mobile navigation owns those destinations. -->
    <div class="hidden md:block">
      <AppFooter v-if="!isAuthPage" class="homepage-v3-footer" />
    </div>

    <!-- Mobile-only drawers (client-only to avoid SSR issues with NDrawer) -->
    <ClientOnly>
      <AddQuoteDrawer
        v-model:open="showAddQuote"
      />
      <ReportDrawer
        v-model:open="showReportDrawer"
        :target-type="'general'"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useQuotesFeedStore } from '~/stores/quotes'

const route = useRoute()
const quotesFeedStore = useQuotesFeedStore()
const isAuthPage = computed(() => route.path === '/login' || route.path === '/signup')
const isDashboardPage = computed(() => route.path.startsWith('/dashboard'))
const isDashboardListsIndex = computed(() => route.path === '/dashboard/lists')
const isDashboardListsPage = computed(() => isDashboardListsIndex.value || route.path.startsWith('/dashboard/lists/'))
const dashboardViewTransitionPending = useState('dashboard-view-transition-pending', () => false)
const modalScrollLocked = useState<boolean>('app-modal-scroll-locked', () => false)
const usesWarmEditorialSurface = computed(() => route.path === '/' || route.path.startsWith('/quotes/') || route.path === '/search' || ['/about', '/terms', '/privacy', '/licenses'].includes(route.path) || isAuthPage.value || isDashboardPage.value)
const isQuoteDetailPage = computed(() => /^\/quotes\/[^/]+$/.test(route.path))
const { $t } = useI18n()
const { locale } = useI18nLocale()
const { user, clear } = useUserSession()

watch(() => route.path, (path, previousPath) => {
  if (!path.startsWith('/dashboard') || !previousPath.startsWith('/dashboard')) return
  dashboardViewTransitionPending.value = true
}, { flush: 'sync' })

watch(isDashboardPage, (isDashboard) => {
  if (!isDashboard) dashboardViewTransitionPending.value = false
}, { flush: 'sync' })
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const homeStats = useState<{ quotes: number; authors: number; references: number }>('active-home-stats', () => ({ quotes: 0, authors: 0, references: 0 }))
const showAddQuote = useState('app-add-quote-drawer-open', () => false)
const showReportDrawer = ref(false)
const showMobileMenu = ref(false)
const showMobileTheme = ref(false)
const previousBodyOverflow = ref('')
const previousDocumentOverflow = ref('')

const mobileMenuItems = computed(() => [
  { label: String($t('nav.explore')), leading: 'i-ph-compass', to: '/quotes' },
  { label: String($t('nav.authors')), leading: 'i-ph-users-three', to: '/authors' },
  { label: String($t('nav.references')), leading: 'i-ph-book-open-text', to: '/references' },
  { label: String($t('nav.about')), leading: 'i-ph-info', to: '/about' },
])

const mobileAccountLinks = computed(() => [
  { to: '/dashboard', icon: 'i-ph-house', label: String($t('components.user_menu.dashboard')) },
  { to: '/dashboard/lists', icon: 'i-ph-bookmark', label: String($t('components.user_menu.collections')) },
  { to: '/dashboard/my-quotes/pending', icon: 'i-ph-file-text', label: String($t('components.user_menu.submissions')) },
  { to: '/dashboard/favourites', icon: 'i-ph-heart', label: String($t('components.user_menu.liked')) },
  { to: '/dashboard/settings', icon: 'i-ph-gear', label: String($t('components.user_menu.settings')) },
  ...((user.value?.role === 'admin' || user.value?.role === 'moderator')
    ? [{ to: '/admin', icon: 'i-ph-shield-check', label: String($t('components.user_menu.admin')) }]
    : [])
])

const mobileInformationLinks = computed(() => [
  { to: '/developers', label: String($t('footer.developers')) },
  { to: '/status', label: String($t('footer.status')) },
  { to: '/licenses', label: String($t('footer.licenses')) },
  { to: '/privacy', label: String($t('footer.privacy')) },
  { to: '/terms', label: String($t('footer.terms')) },
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

const currentEditionDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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

const navigateBackToQuoteResults = () => {
  navigateTo(quotesFeedStore.snapshot?.sourcePath || '/quotes')
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const openContribution = () => {
  closeMobileMenu()
  showAddQuote.value = true
}

const openMobileReport = () => {
  closeMobileMenu()
  showReportDrawer.value = true
}

const signOutMobile = async () => {
  closeMobileMenu()
  await clear()
  await navigateTo('/')
}

const handleMobileMenuKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (showMobileMenu.value) closeMobileMenu()
  if (showMobileTheme.value) showMobileTheme.value = false
}

const handleAddQuoteShortcut = (event: KeyboardEvent) => {
  if (!import.meta.client || window.matchMedia('(min-width: 768px)').matches) return
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'a' || !user.value || showAddQuote.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return
  if (showReportDrawer.value || showMobileMenu.value || showMobileTheme.value) return

  event.preventDefault()
  showAddQuote.value = true
}

onMounted(() => window.addEventListener('keydown', handleAddQuoteShortcut))
onUnmounted(() => window.removeEventListener('keydown', handleAddQuoteShortcut))

watch([showMobileMenu, showMobileTheme], ([menuOpen, themeOpen]) => {
  if (!import.meta.client) return
  const isOpen = menuOpen || themeOpen

  if (isOpen) {
    if (document.body.style.overflow !== 'hidden') {
      previousBodyOverflow.value = document.body.style.overflow
      previousDocumentOverflow.value = document.documentElement.style.overflow
    }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
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
.dashboard-data-panel-shell {
  position: relative;
  min-height: 26rem;
}

.dashboard-transition-state {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quote-masthead-brand-enter-active,
.quote-masthead-brand-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.quote-masthead-brand-enter-from,
.quote-masthead-brand-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .quote-masthead-brand-enter-active,
  .quote-masthead-brand-leave-active {
    transition: none;
  }
}
</style>

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

.mobile-site-menu { transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1); }

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
