<template>
  <!-- Compact footer aligned with the home page spacing and typography -->
  <footer
    class="pt-8 border-gray-3/20 dark:border-gray-8/80"
    :class="{ 'border-t': route.path !== '/' }"
    role="contentinfo"
    aria-label="Site footer"
    data-testid="footer"
  >
    <div class="u-container py-12">
      <div class="px-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <!-- Brand + short tagline -->
        <div class="max-w-xl">
          <AppIcon />
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-sm">
            {{ $t('footer.tagline') }}
          </p>
        </div>

        <!-- Simple nav groups -->
        <nav aria-label="Footer navigation" class="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <section aria-labelledby="footer-explore" data-testid="footer-explore">
            <h3 id="footer-explore" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.explore') }}</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionExplore" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-about" data-testid="footer-about">
            <h3 id="footer-about" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.about') }}</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionAbout" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionContribute.length" aria-labelledby="footer-contribute" data-testid="footer-contribute">
            <h3 id="footer-contribute" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.contribute') }}</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionContribute" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionAccount.length" aria-labelledby="footer-account" data-testid="footer-account">
            <h3 id="footer-account" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.account') }}</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionAccount" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="isAdmin && sectionAdmin.length" aria-labelledby="footer-admin" data-testid="footer-admin">
            <h3 id="footer-admin" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.admin') }}</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionAdmin" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>
        </nav>
      </div>

      <!-- Bottom row -->
      <div class="mt-10 px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-2">
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400" data-testid="footer-copyright">
          {{ $t('footer.all_rights', { year }) }}
        </p>

        <div class="flex items-center gap-1 sm:gap-6 xl:gap-6 text-xs sm:text-sm flex-wrap xl:flex-nowrap">
          <template v-for="{ to, labelKey, icon } in bottomLinks" :key="to">
            <NTooltip :content="$t(labelKey) as string">
              <NuxtLink :to="to" class="link-muted flex items-center xl:hidden" :aria-label="$t(labelKey) as string" :data-testid="`footer-${to.slice(1)}`">
                <NIcon :name="icon" size="5" />
              </NuxtLink>
            </NTooltip>
            <NuxtLink :to="to" class="link-muted hidden xl:inline" :data-testid="`footer-${to.slice(1)}`">{{ $t(labelKey) }}</NuxtLink>
          </template>

          <I18nSelector />
          <ThemeSelector />

          <span class="color-gray-500 font-600 whitespace-nowrap">{{ $t('footer.version') }}: {{ version }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { $t } = useI18n()

const route = useRoute()
const config = useRuntimeConfig()
const version = config.public.appVersion

const { user } = useUserSession()
const year = new Date().getFullYear()
const isAdmin = computed(() => user.value?.role === 'admin')
const isLoggedIn = computed(() => Boolean(user.value))

type RouteLink = { path: string; label: string }

// Collect pages at build/runtime. Vite/NUXT supports eager for static analysis.
const pageModules = import.meta.glob('../pages/**/*.vue', { eager: true })

function normalizePathToRoute(filePath: string): RouteLink | null {
  // Convert file path to route path:
  // ../pages/index.vue -> /
  // ../pages/about.vue -> /about
  // ../pages/dir/index.vue -> /dir
  // ../pages/dir/[id].vue -> exclude (dynamic)
  let path = filePath
    .replace(/^..\/pages\//, '/')
    .replace(/\.vue$/, '')
    .replace(/\/index$/, '')

  if (path === '') path = '/'

  const segments = path.split('/').filter(Boolean)
  const hasDynamic = segments.some(s => s.startsWith('[') && s.endsWith(']'))
  if (hasDynamic) return null

  const last = segments[segments.length - 1] || ''
  const label = path === '/'
    ? 'Explore Quotes'
    : last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return { path, label }
}

const allLinks: RouteLink[] = Object.keys(pageModules)
  .map(normalizePathToRoute)
  .filter((x): x is RouteLink => Boolean(x))

// Helpers
const notAdmin = (l: RouteLink) => !l.path.startsWith('/admin')

// Curated sections
const sectionExplore = allLinks
  .filter(l => ['/', '/authors', '/references', '/sponsor'].includes(l.path))
  .filter(notAdmin)

const sectionContribute = (isLoggedIn.value ? allLinks : [])
  .filter(l => [
    '/dashboard',
    '/dashboard/collections',
    '/dashboard/lists',
    '/dashboard/my-quotes/drafts',
    '/dashboard/my-quotes/pending',
    '/dashboard/my-quotes/published'
  ].includes(l.path))
  .filter(notAdmin)

const sectionAccount = (!isLoggedIn.value ? allLinks : [])
  .filter(l => ['/login', '/signup'].includes(l.path))
  .filter(notAdmin)

const sectionAbout = allLinks
  .filter(l => ['/about', '/presskit/logo'].includes(l.path))
  .filter(notAdmin)

const sectionAdmin = allLinks
  .filter(l => l.path.startsWith('/admin'))

interface BottomLink {
  to: string
  labelKey: string
  icon: string
}

const bottomLinks: BottomLink[] = [
  { to: '/developers', labelKey: 'footer.developers', icon: 'i-tabler-terminal-2' },
  { to: '/status', labelKey: 'footer.status', icon: 'i-tabler-activity-heartbeat' },
  { to: '/licenses', labelKey: 'footer.licenses', icon: 'i-tabler-box' },
  { to: '/privacy', labelKey: 'footer.privacy', icon: 'i-tabler-key' },
  { to: '/terms', labelKey: 'footer.terms', icon: 'i-tabler-align-box-center-middle' },
]
</script>

<style scoped>
.link-muted {
  color: rgb(113, 113, 122);
  text-decoration: none;
  text-underline-offset: 2px;
  transition-property: color;
  transition-duration: 150ms;
  transition-timing-function: ease;
  border-radius: 0.125rem;
  outline: none;
}

/* Dark mode base color */
:where(.dark) .link-muted {
  color: rgb(163, 163, 175);
}

.link-muted:hover {
  color: rgb(24, 24, 27);
  text-decoration: underline;
}

:where(.dark) .link-muted:hover {
  color: rgb(229, 231, 235);
}

.link-muted:focus-visible {
  outline: 2px solid rgba(79, 70, 229, 0.6);
  outline-offset: 2px;
}
</style>
