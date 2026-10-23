<template>
  <div data-admin-workbench class="min-h-screen bg-[#FAFAF9] text-gray-950 dark:bg-[#0C0A09] dark:text-gray-50">
    <AppMastheadBar />

    <header :class="['fixed inset-x-0 top-0 flex items-center justify-between px-4 py-2.5 transition-colors md:hidden', (themeEditorOpen || modalScrollLocked) ? 'pointer-events-none z-[60] bg-[#FAFAF9]/60 backdrop-blur-sm dark:bg-[#0C0A09]/60' : 'z-40 bg-[#FAFAF9] dark:bg-[#0C0A09]']">
      <NuxtLink to="/" class="font-subtitle text-xl font-700 italic tracking-[0.1rem] text-gray-950 dark:text-gray-50">
        verbatims
      </NuxtLink>
      <NButton
        icon
        btn="ghost-gray"
        :label="mobileMenuOpen ? 'i-ph-x' : 'i-ph-list'"
        size="sm"
        :aria-label="String($t(mobileMenuOpen ? 'common.close' : 'nav.menu'))"
        :aria-expanded="mobileMenuOpen"
        aria-controls="admin-mobile-site-menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      />
    </header>

    <ClientOnly>
      <NDrawer
        v-model:open="mobileMenuOpen"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] h-screen rounded-none bg-[#FAFAF9] dark:bg-[#0C0A09]', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
          <div id="admin-mobile-site-menu" class="flex h-full flex-col overflow-y-auto px-6 pb-12 pt-8">
            <div class="flex items-center justify-between gap-4">
              <span class="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                {{ mobileDate }}
              </span>
              <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="mobileMenuOpen = false" />
            </div>

            <nav class="mt-10 flex flex-col gap-1" :aria-label="String($t('nav.menu'))">
              <NuxtLink
                v-for="item in mobileMainLinks"
                :key="item.to"
                :to="item.to"
                class="flex min-h-12 items-center border-b border-black/8 font-serif text-2xl text-gray-900 dark:border-white/10 dark:text-gray-100"
                @click="mobileMenuOpen = false"
              >
                {{ item.label }}
              </NuxtLink>

              <details class="group mt-5 border-t border-black/10 pt-4 dark:border-white/15">
                <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between font-sans text-lg font-600 text-gray-900 dark:text-gray-100">
                  {{ $t('nav.contribute') }}
                  <span class="flex items-center gap-3">
                    <NAvatar v-if="user" size="2" :src="user.avatar_url" :alt="user.name">
                      <template #fallback><BrandAvatarFallback /></template>
                    </NAvatar>
                    <NIcon name="i-ph-caret-down" class="transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div class="mt-2 grid gap-1 pl-1">
                  <button v-if="user" type="button" class="flex min-h-11 items-center gap-3 py-2 text-left text-base text-gray-700 dark:text-gray-300" @click="openMobileAddQuote">
                    <NIcon name="i-ph-quotes-duotone" />{{ $t('nav.add_quote') }}
                  </button>
                  <NuxtLink v-if="!user" to="/login" class="flex min-h-11 items-center gap-3 py-2 text-base text-gray-700 dark:text-gray-300" @click="mobileMenuOpen = false">
                    <NIcon name="i-ph-sign-in" />{{ $t('nav.sign_in') }}
                  </NuxtLink>
                </div>
              </details>

              <details v-if="user" class="group mt-4 border-t border-black/10 pt-4 dark:border-white/15">
                <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between font-sans text-lg font-600 text-gray-900 dark:text-gray-100">
                  {{ $t('components.user_menu.my_space') }}
                  <NIcon name="i-ph-caret-down" class="transition-transform group-open:rotate-180" />
                </summary>
                <div class="mt-2 grid gap-1">
                  <NuxtLink v-for="item in mobileSpaceLinks" :key="item.to" :to="item.to" class="flex min-h-11 items-center gap-3 py-2 text-base text-gray-700 dark:text-gray-300" @click="mobileMenuOpen = false">
                    <NIcon :name="item.icon" />{{ item.label }}
                  </NuxtLink>
                </div>
              </details>

              <button v-if="user" type="button" class="mt-4 flex min-h-12 items-center gap-3 border-t border-black/10 pt-4 text-left text-base text-gray-700 dark:border-white/15 dark:text-gray-300" @click="signOutFromMobile">
                <NIcon name="i-ph-sign-out" />{{ $t('components.user_menu.sign_out') }}
              </button>
            </nav>

            <div class="mt-auto flex items-center gap-2 border-t border-black/10 pt-5 dark:border-white/15">
              <I18nSelector />
              <ThemeSelector />
            </div>
          </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <div class="min-h-screen pt-14 md:pt-0">
      <header class="mx-auto max-w-6xl px-6 pt-8 sm:px-8 md:pt-28 lg:px-10">
        <div class="max-w-3xl">
          <h1 class="font-serif text-5xl font-400 leading-[0.98] tracking-[-0.035em] text-gray-950 dark:text-gray-50 sm:text-6xl lg:text-7xl">
            {{ $t('admin.workspace_title') }}
          </h1>
          <p class="mt-4 max-w-2xl font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            {{ $t('admin.workspace_description') }}
          </p>
        </div>

        <nav :aria-label="String($t('admin.workspace_title'))" class="mt-6">
          <div class="admin-tab-row">
            <div
              ref="groupTabs"
              :class="[
                'admin-nav-scroll flex gap-6 overflow-x-auto border-b border-gray-200 dark:border-white/10 sm:gap-9',
                { 'px-10': groupTabsOverflow }
              ]"
              @scroll="updateTabScrollState('groups')"
            >
              <NuxtLink
                v-for="group in adminNavGroups"
                :key="group.id"
                :data-admin-group="group.id"
                :to="group.to"
                :aria-current="activeGroupId === group.id ? 'page' : undefined"
                :class="[
                  'admin-section-link relative flex min-h-12 shrink-0 items-center gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500',
                  activeGroupId === group.id
                    ? 'font-600 text-gray-950 dark:text-gray-50'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                ]"
              >
                <NIcon :name="group.icon" class="h-4 w-4 opacity-70" />
                {{ group.label }}
                <span
                  v-if="activeGroupId === group.id"
                  class="absolute inset-x-0 bottom-0 h-0.5 bg-gray-950 dark:bg-gray-100"
                />
              </NuxtLink>
            </div>
            <div v-if="groupTabsOverflow" class="pointer-events-none absolute inset-y-0 left-0 flex items-center pr-10">
              <div v-if="groupTabsCanScrollLeft" class="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent dark:from-[#0C0A09] dark:via-[#0C0A09]/95" />
              <NButton
                icon
                btn="soft-gray"
                size="sm"
                label="i-ph-caret-left"
                class="pointer-events-auto relative z-1"
                :aria-label="String($t('nav.scroll_tabs_left'))"
                :disabled="!groupTabsCanScrollLeft"
                @click="scrollTabs('groups', -1)"
              />
            </div>
            <div v-if="groupTabsOverflow" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pl-10">
              <div v-if="groupTabsCanScrollRight" class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent dark:from-[#0C0A09] dark:via-[#0C0A09]/95" />
              <NButton
                icon
                btn="soft-gray"
                size="sm"
                label="i-ph-caret-right"
                class="pointer-events-auto relative z-1"
                :aria-label="String($t('nav.scroll_tabs_right'))"
                :disabled="!groupTabsCanScrollRight"
                @click="scrollTabs('groups', 1)"
              />
            </div>
          </div>

          <div v-if="activeGroupItems.length" class="admin-tab-row">
            <div
              ref="itemTabs"
              :class="[
                'admin-nav-scroll flex gap-6 overflow-x-auto border-b border-gray-200/70 py-2 dark:border-white/5 sm:gap-8',
                { 'px-10': itemTabsOverflow }
              ]"
              @scroll="updateTabScrollState('items')"
            >
              <NuxtLink
                v-for="item in activeGroupItems"
                :key="item.to"
                :to="item.to"
                :aria-current="isRouteActive(item.to) ? 'page' : undefined"
                :class="[
                  'flex min-h-10 shrink-0 items-center gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500',
                  isRouteActive(item.to)
                    ? 'font-600 text-gray-950 dark:text-gray-50'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                ]"
              >
                {{ item.label }}
                <NBadge v-if="item.count !== undefined" :label="String(item.count)" badge="soft-gray" size="xs" />
              </NuxtLink>
            </div>
            <div v-if="itemTabsOverflow" class="pointer-events-none absolute inset-y-0 left-0 flex items-center pr-10">
              <div v-if="itemTabsCanScrollLeft" class="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent dark:from-[#0C0A09] dark:via-[#0C0A09]/95" />
              <NButton
                icon
                btn="soft-gray"
                size="sm"
                label="i-ph-caret-left"
                class="pointer-events-auto relative z-1"
                :aria-label="String($t('nav.scroll_tabs_left'))"
                :disabled="!itemTabsCanScrollLeft"
                @click="scrollTabs('items', -1)"
              />
            </div>
            <div v-if="itemTabsOverflow" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pl-10">
              <div v-if="itemTabsCanScrollRight" class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FAFAF9] via-[#FAFAF9]/95 to-transparent dark:from-[#0C0A09] dark:via-[#0C0A09]/95" />
              <NButton
                icon
                btn="soft-gray"
                size="sm"
                label="i-ph-caret-right"
                class="pointer-events-auto relative z-1"
                :aria-label="String($t('nav.scroll_tabs_right'))"
                :disabled="!itemTabsCanScrollRight"
                @click="scrollTabs('items', 1)"
              />
            </div>
          </div>
        </nav>
      </header>

      <main data-admin-content class="mx-auto max-w-6xl px-6 pb-28 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AdminNavItem {
  to: string
  label: string
  count?: number
}

interface AdminNavGroup {
  id: string
  label: string
  icon: string
  to: string
  items: AdminNavItem[]
}

interface AdminStatsResponse {
  data?: {
    quotes?: {
      approved?: number
      pending?: number
      draft?: number
      harvested?: number
    }
    authors?: { total?: number }
    references?: { total?: number }
    tags?: { total?: number }
    themes?: { total?: number }
    social_queue?: { total?: number }
    messages?: { total?: number }
    api_keys?: { total?: number }
    users?: { total?: number }
  }
}

const { $t } = useI18n()
const { locale } = useI18nLocale()
const route = useRoute()
const { user, clear } = useUserSession()
const mobileMenuOpen = ref(false)
const showAddQuote = useState('app-add-quote-dialog-open', () => false)
const themeEditorOpen = useState<boolean>('admin-theme-dialog-open', () => false)
const modalScrollLocked = useState<boolean>('app-modal-scroll-locked', () => false)

const mobileDate = computed(() => new Date().toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
  weekday: 'short',
  year: '2-digit',
  month: 'short',
  day: 'numeric',
}))

const mobileMainLinks = computed(() => [
  { label: String($t('nav.explore')), to: '/quotes' },
  { label: String($t('nav.authors')), to: '/authors' },
  { label: String($t('nav.references')), to: '/references' },
  { label: String($t('nav.about')), to: '/about' },
])

const mobileSpaceLinks = computed(() => [
  { label: String($t('components.user_menu.dashboard')), to: '/dashboard', icon: 'i-ph-house' },
  { label: String($t('components.user_menu.collections')), to: '/dashboard/lists', icon: 'i-ph-bookmark' },
  { label: String($t('components.user_menu.submissions')), to: '/dashboard/my-quotes/pending', icon: 'i-ph-file-text' },
  { label: String($t('components.user_menu.liked')), to: '/dashboard/favourites', icon: 'i-ph-heart' },
  { label: String($t('components.user_menu.settings')), to: '/dashboard/settings', icon: 'i-ph-gear' },
  ...((user.value?.role === 'admin' || user.value?.role === 'moderator')
    ? [{ label: String($t('components.user_menu.admin')), to: '/admin', icon: 'i-ph-shield-check' }]
    : []),
])

function openMobileAddQuote() {
  mobileMenuOpen.value = false
  showAddQuote.value = true
}

async function signOutFromMobile() {
  mobileMenuOpen.value = false
  await clear()
  await navigateTo('/')
}

const publishedCount = ref(0)
const pendingCount = ref(0)
const draftCount = ref(0)
const harvestedCount = ref(0)
const authorsCount = ref(0)
const referencesCount = ref(0)
const tagsCount = ref(0)
const themesCount = ref(0)
const socialQueueCount = ref(0)
const usersCount = ref(0)
const messagesCount = ref(0)
const apiKeysCount = ref(0)

const groupTabs = ref<HTMLDivElement | null>(null)
const itemTabs = ref<HTMLDivElement | null>(null)
const groupTabsOverflow = ref(false)
const itemTabsOverflow = ref(false)
const groupTabsCanScrollLeft = ref(false)
const groupTabsCanScrollRight = ref(false)
const itemTabsCanScrollLeft = ref(false)
const itemTabsCanScrollRight = ref(false)

const pageHeader = usePageHeader()

const adminNavGroups = computed<AdminNavGroup[]>(() => [
  {
    id: 'overview',
    label: String($t('admin.nav.overview')),
    icon: 'i-ph-house',
    to: '/admin',
    items: [],
  },
  {
    id: 'moderation',
    label: String($t('admin.sections.moderation')),
    icon: 'i-ph-shield-check',
    to: '/admin/quotes/pending',
    items: [
      { to: '/admin/quotes/pending', label: String($t('admin.nav.pending')), count: pendingCount.value },
      { to: '/admin/quotes/published', label: String($t('admin.nav.published')), count: publishedCount.value },
      { to: '/admin/quotes/drafts', label: String($t('admin.nav.drafts')), count: draftCount.value },
      { to: '/admin/social-queue', label: String($t('admin.nav.social_queue')), count: socialQueueCount.value },
    ],
  },
  {
    id: 'editorial',
    label: String($t('admin.sections.editorial')),
    icon: 'i-ph-books',
    to: '/admin/authors',
    items: [
      { to: '/admin/authors', label: String($t('admin.nav.authors')), count: authorsCount.value },
      { to: '/admin/references', label: String($t('admin.nav.references')), count: referencesCount.value },
      { to: '/admin/tags', label: String($t('admin.nav.tags')), count: tagsCount.value },
      { to: '/admin/themes', label: String($t('admin.nav.themes')), count: themesCount.value },
    ],
  },
  {
    id: 'people',
    label: String($t('admin.sections.people')),
    icon: 'i-ph-users',
    to: '/admin/users',
    items: [
      { to: '/admin/users', label: String($t('admin.nav.users')), count: usersCount.value },
      { to: '/admin/messages', label: String($t('admin.nav.messages')), count: messagesCount.value },
      { to: '/admin/api-keys', label: String($t('admin.nav.api_keys')), count: apiKeysCount.value },
    ],
  },
  {
    id: 'operations',
    label: String($t('admin.sections.operations')),
    icon: 'i-ph-wrench',
    to: '/admin/harvest',
    items: [
      { to: '/admin/harvest', label: String($t('admin.nav.harvest_quotes')), count: harvestedCount.value },
      { to: '/admin/enrichment', label: String($t('admin.nav.enrichment_queue')) },
      { to: '/admin/enrichment-audit', label: String($t('admin.nav.enrichment_audit')) },
    ],
  },
  {
    id: 'data',
    label: String($t('admin.sections.data')),
    icon: 'i-ph-database',
    to: '/admin/import',
    items: [
      { to: '/admin/import', label: String($t('admin.nav.import_data')) },
      { to: '/admin/export', label: String($t('admin.nav.export_data')) },
      { to: '/admin/maintenance', label: String($t('admin.nav.database_maintenance')) },
    ],
  },
])

const pathMatches = (to: string) => to === '/admin'
  ? route.path === to
  : route.path === to || route.path.startsWith(`${to}/`)

const activeGroupId = computed(() =>
  adminNavGroups.value.find(group => group.items.some(item => pathMatches(item.to)))?.id ?? 'overview'
)

const activeGroupItems = computed(() =>
  adminNavGroups.value.find(group => group.id === activeGroupId.value)?.items ?? []
)

const isRouteActive = (to: string) => pathMatches(to)

function getTabsElement(kind: 'groups' | 'items') {
  return kind === 'groups' ? groupTabs.value : itemTabs.value
}

function updateTabScrollState(kind: 'groups' | 'items') {
  const element = getTabsElement(kind)
  if (!element) return

  const canScrollLeft = element.scrollLeft > 1
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  const canScrollRight = element.scrollLeft < maxScrollLeft - 1
  const canScroll = maxScrollLeft > 1

  if (kind === 'groups') {
    groupTabsOverflow.value = canScroll
    groupTabsCanScrollLeft.value = canScrollLeft
    groupTabsCanScrollRight.value = canScrollRight
  } else {
    itemTabsOverflow.value = canScroll
    itemTabsCanScrollLeft.value = canScrollLeft
    itemTabsCanScrollRight.value = canScrollRight
  }
}

function updateAllTabScrollStates() {
  updateTabScrollState('groups')
  updateTabScrollState('items')
}

function scrollTabs(kind: 'groups' | 'items', direction: -1 | 1) {
  const element = getTabsElement(kind)
  if (!element) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  element.scrollBy({ left: direction * Math.max(element.clientWidth * 0.7, 140), behavior })
}

async function revealActiveTabs() {
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  for (const [kind, element] of [['groups', groupTabs.value], ['items', itemTabs.value]] as const) {
    if (!element) continue
    const activeLink = element.querySelector<HTMLElement>('[aria-current="page"]')
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (activeLink) {
      const containerRect = element.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()
      const maxScrollLeft = element.scrollWidth - element.clientWidth
      const inset = maxScrollLeft > 1 ? 40 : 0
      const leftInset = inset
      const rightInset = inset
      const visibleLeft = containerRect.left + leftInset + 4
      const visibleRight = containerRect.right - rightInset - 4

      if (linkRect.left < visibleLeft) {
        const target = activeLink === element.firstElementChild
          ? 0
          : Math.max(0, element.scrollLeft - (visibleLeft - linkRect.left))
        element.scrollTo({ left: target, behavior })
      } else if (linkRect.right > visibleRight) {
        const target = activeLink === element.lastElementChild
          ? maxScrollLeft
          : Math.min(maxScrollLeft, element.scrollLeft + (linkRect.right - visibleRight))
        element.scrollTo({ left: target, behavior })
      }
    }
    updateTabScrollState(kind)
  }
}

async function loadQuoteCounts() {
  try {
    const response = await fetch('/api/admin/stats')
    if (!response.ok) throw new Error(`Admin stats request failed (${response.status})`)
    const stats = await response.json() as AdminStatsResponse
    publishedCount.value = stats.data?.quotes?.approved ?? 0
    pendingCount.value = stats.data?.quotes?.pending ?? 0
    draftCount.value = stats.data?.quotes?.draft ?? 0
    harvestedCount.value = stats.data?.quotes?.harvested ?? 0
    authorsCount.value = stats.data?.authors?.total ?? 0
    referencesCount.value = stats.data?.references?.total ?? 0
    tagsCount.value = stats.data?.tags?.total ?? 0
    themesCount.value = stats.data?.themes?.total ?? 0
    socialQueueCount.value = stats.data?.social_queue?.total ?? 0
    usersCount.value = stats.data?.users?.total ?? 0
    messagesCount.value = stats.data?.messages?.total ?? 0
    apiKeysCount.value = stats.data?.api_keys?.total ?? 0
  } catch (error) {
    console.error('Failed to load admin quote counts:', error)
  }
}

onMounted(() => {
  pageHeader.setHeaderFromRoute()
  loadQuoteCounts()
  window.addEventListener('resize', handleTabResize)
  updateTabScrollState('groups')
  updateTabScrollState('items')
  revealActiveTabs()
})

function handleTabResize() {
  updateAllTabScrollStates()
  revealActiveTabs()
}

onUnmounted(() => window.removeEventListener('resize', handleTabResize))

watch(() => route.path, () => {
  pageHeader.setHeaderFromRoute()
  revealActiveTabs()
}, { flush: 'post' })

watch(activeGroupId, revealActiveTabs, { flush: 'post' })

watch(() => [activeGroupItems.value.length, pendingCount.value, publishedCount.value, draftCount.value, harvestedCount.value, authorsCount.value, referencesCount.value, tagsCount.value, themesCount.value, socialQueueCount.value, usersCount.value, messagesCount.value, apiKeysCount.value], async () => {
  await revealActiveTabs()
})

watch(() => adminNavGroups.value.flatMap(group => [group.label, ...group.items.map(item => item.label)]).join('\u0000'), async () => {
  await revealActiveTabs()
})
</script>

<style>
.admin-nav-scroll {
  scrollbar-width: none;
  scroll-behavior: auto;
  scroll-padding-inline: 2.5rem;
}

@media (prefers-reduced-motion: no-preference) {
  .admin-nav-scroll {
    scroll-behavior: smooth;
  }
}

.admin-nav-scroll::-webkit-scrollbar {
  display: none;
}

.admin-nav-scroll a:focus-visible {
  outline-offset: -2px;
}

.admin-tab-row {
  position: relative;
}

[data-admin-content] :is(input:not([type="checkbox"]):not([type="radio"]), select, textarea) {
  border-color: var(--admin-border);
  border-radius: 0.5rem;
  background-color: var(--admin-control-surface);
}

[data-admin-content] :is(input, select, textarea):focus-visible {
  border-color: var(--admin-focus);
  outline: 2px solid color-mix(in srgb, var(--admin-focus) 24%, transparent);
  outline-offset: 1px;
}

[data-admin-content] div:has(> table),
[data-admin-content] table {
  background-color: var(--admin-table-surface);
  border-color: var(--admin-border);
}

[data-admin-content] table thead tr {
  background-color: var(--admin-table-header) !important;
}

[data-admin-content] div[class*="bottom-0"][class*="z-20"] {
  background-color: var(--admin-sidebar-surface);
  border-color: var(--admin-border);
  box-shadow: 0 -6px 18px rgb(12 10 9 / 6%);
}

.dark [data-admin-content] div[class*="bottom-0"][class*="z-20"] {
  box-shadow: 0 -6px 18px rgb(0 0 0 / 24%);
}

[data-admin-content] div[class*="bottom-0"][class*="z-20"] button {
  border-radius: 9999px;
}

[data-admin-page-header] [data-slot="combobox-trigger"] {
  min-height: 2.5rem;
  justify-content: space-between;
  gap: 0.5rem;
  border: 1px solid var(--admin-border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--admin-control-surface);
  color: inherit;
  line-height: 1.25rem;
  vertical-align: middle;
  transition: background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

[data-admin-content] table thead [data-slot="combobox-trigger"] {
  border-radius: 0.375rem;
}

[data-admin-page-header] [data-slot="combobox-trigger"]:hover {
  background: color-mix(in srgb, var(--admin-control-surface) 72%, var(--admin-border));
}

[data-admin-page-header] [data-slot="combobox-trigger"]:focus-visible {
  outline: 2px solid var(--admin-focus);
  outline-offset: 2px;
}

[data-admin-page-header] [data-slot="combobox-trigger"] > span {
  line-height: 1.25rem;
}

@media (prefers-reduced-motion: reduce) {
  [data-admin-page-header] [data-slot="combobox-trigger"] {
    transition: none;
  }
}

[data-admin-workbench] {
  --admin-sidebar-surface: #f0efe9;
  --admin-control-surface: #f0efe9;
  --admin-table-surface: #f0efe9;
  --admin-table-header: #e6e4dd;
  --admin-border: #d8d4cb;
  --admin-focus: #57534e;
}

.dark [data-admin-workbench] {
  --admin-sidebar-surface: #17191e;
  --admin-control-surface: rgb(255 255 255 / 6%);
  --admin-table-surface: #17191e;
  --admin-table-header: #202126;
  --admin-border: rgb(255 255 255 / 10%);
  --admin-focus: #a8a29e;
}
</style>
