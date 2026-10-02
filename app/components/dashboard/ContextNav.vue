<template>
  <div>
    <nav
      ref="primaryNav"
      class="relative flex min-w-0 flex-wrap items-center gap-x-4 border-b border-black/10 whitespace-nowrap dark:border-white/10 md:flex-nowrap md:gap-x-6"
      :aria-label="String($t('nav.my_library'))"
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
          v-if="group.id === 'favourites' && favouritesCount !== null && favouritesCount > 0"
          class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gray-900/5 px-1.5 py-0.5 font-sans text-[11px] font-500 tabular-nums leading-none text-gray-500 dark:bg-white/10 dark:text-gray-400"
        >
          {{ favouritesCount }}
        </span>
      </NuxtLink>
      <span
        v-if="indicatorReady"
        class="dashboard-tab-indicator absolute left-0 top-0 h-px bg-gray-900 dark:bg-gray-100"
        :style="indicatorStyle"
        aria-hidden="true"
      />
    </nav>

    <div
      class="dashboard-secondary-nav"
      :class="{ 'dashboard-secondary-nav--open': activeGroup.children?.length }"
      :aria-hidden="!activeGroup.children?.length"
      :inert="!activeGroup.children?.length"
    >
      <nav
        ref="secondaryNav"
        class="dashboard-secondary-nav__inner flex min-w-0 items-center gap-5 overflow-x-auto overscroll-x-contain whitespace-nowrap border-t border-black/5 dark:border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :aria-label="activeGroup.children?.length ? activeGroup.label : undefined"
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
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { $t } = useI18n()
const { user } = useUserSession()
const userKey = String(user.value?.id ?? 'anonymous')
const favouritesCount = useState<number | null>(`dashboard-favourites-count-${userKey}`, () => null)
const { data: dashboardStats } = await useFetch('/api/dashboard/stats', {
  key: `dashboard-context-nav-stats-${userKey}`
})
const primaryNav = ref<HTMLElement | null>(null)
const secondaryNav = ref<HTMLElement | null>(null)
const indicatorReady = ref(false)
const activeIndicator = ref({ x: 0, y: 0, width: 0 })
let navResizeObserver: ResizeObserver | undefined

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
    to: '/dashboard/my-quotes/drafts',
    label: String($t('nav.my_quotes')),
    children: [
      { to: '/dashboard/my-quotes/drafts', label: String($t('nav.drafts')) },
      { to: '/dashboard/my-quotes/pending', label: String($t('nav.pending')) },
      { to: '/dashboard/my-quotes/published', label: String($t('nav.published')) }
    ]
  },
  {
    id: 'settings',
    to: '/dashboard/settings',
    label: String($t('nav.settings')),
    children: [
      { to: '/dashboard/sponsors', label: String($t('nav.sponsorships')) },
      { to: '/dashboard/developer', label: String($t('nav.developer')) }
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

const updateActiveIndicator = async () => {
  if (!import.meta.client) return

  await nextTick()

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
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-tab-indicator,
  .dashboard-secondary-nav {
    transition: none;
  }
}
</style>
