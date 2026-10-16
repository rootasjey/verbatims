<template>
  <div>
    <div class="dashboard-nav-scroll-wrap">
    <nav
      ref="primaryNav"
      class="dashboard-nav-scroll relative flex min-w-0 flex-nowrap items-center gap-x-4 overflow-x-auto border-b border-black/10 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10 md:gap-x-6"
      :aria-label="String($t('nav.my_library'))"
      @scroll="updatePrimaryOverflow"
    >
      <NuxtLink
        v-for="group in groups"
        :key="group.id"
        :to="group.to"
        :data-dashboard-group="group.id"
        class="relative flex min-h-12 shrink-0 items-center font-sans text-sm transition-colors hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-gray-100"
        :class="activeGroup.id === group.id ? 'font-600 text-gray-950 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'"
        :aria-current="activeGroup.id === group.id ? (route.path === group.to ? 'page' : 'location') : undefined"
      >
        {{ group.label }}
        <span
          v-if="countForGroup(group.id) > 0"
          class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gray-900/5 px-1.5 py-0.5 font-sans text-[11px] font-500 tabular-nums leading-none text-gray-500 dark:bg-white/10 dark:text-gray-400"
        >
          {{ countForGroup(group.id) }}
        </span>
      </NuxtLink>
      <span
        v-if="indicatorReady"
        class="dashboard-tab-indicator absolute left-0 top-0 h-px bg-gray-900 dark:bg-gray-100"
        :style="indicatorStyle"
        aria-hidden="true"
      />
    </nav>
    <span v-if="primaryCanScrollLeft" class="dashboard-nav-fade dashboard-nav-fade--left bg-gradient-to-r from-[#F7F5EF] to-transparent dark:from-[#0C0A09]" aria-hidden="true" />
    <span v-if="primaryCanScrollRight" class="dashboard-nav-fade dashboard-nav-fade--right bg-gradient-to-l from-[#F7F5EF] to-transparent dark:from-[#0C0A09]" aria-hidden="true" />
    <NButton
      v-if="primaryCanScrollLeft"
      icon
      btn="ghost-gray"
      size="xs"
      label="i-ph-caret-left"
      class="dashboard-nav-arrow dashboard-nav-arrow--left bg-[#F7F5EF] dark:bg-[#0C0A09]"
      :aria-label="String($t('nav.scroll_tabs_left'))"
      @click="scrollNav(primaryNav, -1)"
    />
    <NButton
      v-if="primaryCanScrollRight"
      icon
      btn="ghost-gray"
      size="xs"
      label="i-ph-caret-right"
      class="dashboard-nav-arrow dashboard-nav-arrow--right bg-[#F7F5EF] dark:bg-[#0C0A09]"
      :aria-label="String($t('nav.scroll_tabs_right'))"
      @click="scrollNav(primaryNav, 1)"
    />
    </div>

    <div
      class="dashboard-secondary-nav"
      :class="{ 'dashboard-secondary-nav--open': activeGroup.children?.length }"
      :aria-hidden="!activeGroup.children?.length"
      :inert="!activeGroup.children?.length"
    >
      <div class="dashboard-nav-scroll-wrap dashboard-secondary-nav__inner">
      <nav
        ref="secondaryNav"
        class="dashboard-nav-scroll flex min-w-0 items-center gap-5 overflow-x-auto overscroll-x-contain whitespace-nowrap border-t border-black/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10"
        :aria-label="activeGroup.children?.length ? activeGroup.label : undefined"
        @scroll="updateSecondaryOverflow"
      >
        <NuxtLink
          v-for="item in activeGroup.children"
          :key="item.to"
          :to="item.to"
          :data-dashboard-route="item.to"
          class="flex min-h-11 shrink-0 items-center font-sans text-sm transition-colors hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-gray-100"
          :class="isActive(item.to) ? 'font-600 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :tabindex="activeGroup.children?.length ? undefined : -1"
        >
          {{ item.label }}
          <span
            v-if="typeof item.count === 'number'"
            class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gray-900/5 px-1.5 py-0.5 font-sans text-[11px] font-500 tabular-nums leading-none text-gray-500 dark:bg-white/10 dark:text-gray-400"
          >
            {{ item.count }}
          </span>
        </NuxtLink>
      </nav>
      <span v-if="secondaryCanScrollLeft" class="dashboard-nav-fade dashboard-nav-fade--left bg-gradient-to-r from-[#F7F5EF] to-transparent dark:from-[#0C0A09]" aria-hidden="true" />
      <span v-if="secondaryCanScrollRight" class="dashboard-nav-fade dashboard-nav-fade--right bg-gradient-to-l from-[#F7F5EF] to-transparent dark:from-[#0C0A09]" aria-hidden="true" />
      <NButton
        v-if="secondaryCanScrollLeft"
        icon
        btn="ghost-gray"
        size="xs"
        label="i-ph-caret-left"
        class="dashboard-nav-arrow dashboard-nav-arrow--left bg-[#F7F5EF] dark:bg-[#0C0A09]"
        :aria-label="String($t('nav.scroll_tabs_left'))"
        @click="scrollNav(secondaryNav, -1)"
      />
      <NButton
        v-if="secondaryCanScrollRight"
        icon
        btn="ghost-gray"
        size="xs"
        label="i-ph-caret-right"
        class="dashboard-nav-arrow dashboard-nav-arrow--right bg-[#F7F5EF] dark:bg-[#0C0A09]"
        :aria-label="String($t('nav.scroll_tabs_right'))"
        @click="scrollNav(secondaryNav, 1)"
      />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { $t } = useI18n()
const { user } = useUserSession()
const myQuoteSubtabPaths = [
  '/dashboard/my-quotes/drafts',
  '/dashboard/my-quotes/pending',
  '/dashboard/my-quotes/published'
] as const
const myQuotesPreferenceKey = `dashboard.myQuotes.lastSubtab.${String(user.value?.id ?? 'anonymous')}`
const myQuotesDestination = ref<(typeof myQuoteSubtabPaths)[number]>(myQuoteSubtabPaths[0])
const userKey = String(user.value?.id ?? 'anonymous')
const favouritesCount = useState<number | null>(`dashboard-favourites-count-${userKey}`, () => null)
const collectionsCount = useState<number | null>(`dashboard-collections-count-${userKey}`, () => null)
const { data: dashboardStats, refresh: refreshDashboardStats } = await useFetch('/api/dashboard/stats', {
  key: `dashboard-context-nav-stats-${userKey}`
})
const countForGroup = (id: string) => {
  const stats = dashboardStats.value?.data
  if (id === 'favourites') return favouritesCount.value ?? stats?.favourites ?? 0
  if (id === 'lists') return collectionsCount.value ?? stats?.collections ?? 0
  if (id === 'quotes') return stats?.submitted ?? 0
  return 0
}
const primaryNav = ref<HTMLElement | null>(null)
const secondaryNav = ref<HTMLElement | null>(null)
const indicatorReady = ref(false)
const activeIndicator = ref({ x: 0, y: 0, width: 0 })
const primaryCanScrollLeft = ref(false)
const primaryCanScrollRight = ref(false)
const secondaryCanScrollLeft = ref(false)
const secondaryCanScrollRight = ref(false)
let navResizeObserver: ResizeObserver | undefined

const isMyQuoteSubtabPath = (path: string): path is (typeof myQuoteSubtabPaths)[number] =>
  myQuoteSubtabPaths.some(subtabPath => subtabPath === path)

onMounted(() => {
  try {
    if (isMyQuoteSubtabPath(route.path)) {
      myQuotesDestination.value = route.path
      localStorage.setItem(myQuotesPreferenceKey, route.path)
      return
    }

    const savedPath = localStorage.getItem(myQuotesPreferenceKey)
    if (savedPath && isMyQuoteSubtabPath(savedPath)) myQuotesDestination.value = savedPath
  } catch {
    // Keep the default destination when local storage is unavailable.
  }
})

watch(() => route.path, (path) => {
  if (!isMyQuoteSubtabPath(path)) return

  myQuotesDestination.value = path
  try {
    localStorage.setItem(myQuotesPreferenceKey, path)
  } catch {
    // In-memory navigation still works when local storage is unavailable.
  }
})

watch(() => dashboardStats.value?.data.favourites, (count) => {
  if (typeof count === 'number') favouritesCount.value = count
}, { immediate: true })

const indicatorStyle = computed(() => ({
  transform: `translate3d(${activeIndicator.value.x}px, ${activeIndicator.value.y}px, 0) scaleX(${activeIndicator.value.width})`
}))

const groups = computed(() => [
  { id: 'favourites', to: '/dashboard/favourites', label: String($t('nav.favourites')) },
  { id: 'lists', to: '/dashboard/lists', label: String($t('nav.lists')) },
  {
    id: 'quotes',
    to: myQuotesDestination.value,
    label: String($t('nav.my_quotes')),
    children: [
      { to: '/dashboard/my-quotes/drafts', label: String($t('nav.drafts')), count: dashboardStats.value?.data.draft ?? null },
      { to: '/dashboard/my-quotes/pending', label: String($t('nav.pending')), count: dashboardStats.value?.data.pending ?? null },
      { to: '/dashboard/my-quotes/published', label: String($t('nav.published')), count: dashboardStats.value?.data.approved ?? null }
    ]
  },
  {
    id: 'settings',
    to: '/dashboard/settings',
    label: String($t('nav.settings')),
    children: [
      { to: '/dashboard/developer', label: String($t('nav.developer')), count: null }
    ]
  }
])

const activeGroup = computed(() => {
  if (route.path.startsWith('/dashboard/favourites')) return groups.value.find(group => group.id === 'favourites')!
  if (route.path.startsWith('/dashboard/lists')) return groups.value.find(group => group.id === 'lists')!
  if (route.path.startsWith('/dashboard/my-quotes')) return groups.value.find(group => group.id === 'quotes')!
  return groups.value.find(group => group.id === 'settings')!
})

const isActive = (path: string) => path === '/dashboard/lists'
  ? route.path === path || route.path.startsWith(`${path}/`)
  : route.path === path

const updateOverflow = (element: HTMLElement | null, left: Ref<boolean>, right: Ref<boolean>) => {
  if (!element) return
  left.value = element.scrollLeft > 2
  right.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 2
}
const updatePrimaryOverflow = () => updateOverflow(primaryNav.value, primaryCanScrollLeft, primaryCanScrollRight)
const updateSecondaryOverflow = () => updateOverflow(secondaryNav.value, secondaryCanScrollLeft, secondaryCanScrollRight)
const scrollNav = (element: HTMLElement | null, direction: -1 | 1) => {
  if (!element) return
  element.scrollBy({ left: direction * Math.max(140, element.clientWidth * 0.65), behavior: 'smooth' })
}

const updateActiveIndicator = async () => {
  if (!import.meta.client) return

  await nextTick()
  updatePrimaryOverflow()
  updateSecondaryOverflow()

  const nav = primaryNav.value
  const activeLink = nav?.querySelector<HTMLElement>('[aria-current]')
  if (!nav || !activeLink) return

  const navRect = nav.getBoundingClientRect()
  const linkRect = activeLink.getBoundingClientRect()
  activeIndicator.value = {
    x: linkRect.left - navRect.left + nav.scrollLeft,
    y: linkRect.bottom - navRect.top - 1,
    width: linkRect.width
  }
  indicatorReady.value = true
}

watch(() => route.path, async () => {
  if (!import.meta.client) return
  refreshDashboardStats()
  await nextTick()
  updateActiveIndicator()
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  const activeGroupLink = primaryNav.value?.querySelector('[aria-current="page"]')
  const activeRouteLink = secondaryNav.value?.querySelector('[aria-current="page"]')
  activeGroupLink?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior })
  activeRouteLink?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior })
}, { immediate: true })

watch(groups, updateActiveIndicator, { flush: 'post' })

onMounted(async () => {
  await updateActiveIndicator()
  if (!primaryNav.value) return

  navResizeObserver = new ResizeObserver(updateActiveIndicator)
  navResizeObserver.observe(primaryNav.value)
  if (secondaryNav.value) navResizeObserver.observe(secondaryNav.value)
  primaryNav.value.querySelectorAll('[data-dashboard-group]').forEach(link => navResizeObserver?.observe(link))
})

onBeforeUnmount(() => navResizeObserver?.disconnect())
</script>

<style scoped>
.dashboard-tab-indicator {
  transform-origin: left center;
  width: 1px;
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-secondary-nav {
  display: grid;
  grid-template-rows: 0fr;
  pointer-events: none;
  transition: grid-template-rows 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-secondary-nav--open {
  grid-template-rows: 1fr;
  pointer-events: auto;
}

.dashboard-secondary-nav__inner {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.dashboard-nav-scroll-wrap {
  position: relative;
  min-width: 0;
}

.dashboard-nav-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior-x: contain;
}

.dashboard-nav-scroll::-webkit-scrollbar {
  display: none;
}

.dashboard-nav-fade {
  position: absolute;
  inset-block: 1px;
  z-index: 2;
  width: 2.5rem;
  pointer-events: none;
}

.dashboard-nav-fade--left {
  left: 0;
}

.dashboard-nav-fade--right {
  right: 0;
}

.dashboard-nav-arrow {
  position: absolute;
  top: 50%;
  z-index: 3;
  height: 2rem;
  width: 2rem;
  transform: translateY(-50%);
  border-radius: 9999px;
}

.dashboard-nav-arrow--left { left: 0.25rem; }
.dashboard-nav-arrow--right { right: 0.25rem; }

@media (prefers-reduced-motion: reduce) {
  .dashboard-tab-indicator,
  .dashboard-secondary-nav {
    transition: none;
  }
}
</style>
