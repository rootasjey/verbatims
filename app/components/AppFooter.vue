<template>
  <!-- Editorial footer aligned with the home page spacing and typography -->
  <footer
    class="app-footer pt-8 border-gray-3/20 dark:border-gray-8/80"
    :class="{ 'border-t': route.path !== '/' }"
    role="contentinfo"
    aria-label="Site footer"
    data-testid="footer"
  >
    <div class="u-container py-12">
      <div class="px-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <!-- Brand + short tagline -->
        <div class="max-w-xl">
          <span class="homepage-v3-footer-wordmark" aria-label="Verbatims">verbatims</span>
          <NuxtLink
            to="https://github.com/rootasjey/verbatims"
            target="_blank"
            rel="noopener noreferrer"
            class="homepage-v3-footer-version block italic ml-1 text-xs font-600 text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:outline-gray-100"
            :aria-label="`${$t('footer.version')}: ${version} — GitHub`"
          >
            {{ $t('footer.version') }}: {{ version }}
          </NuxtLink>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-sm">
            {{ $t('footer.tagline') }}
          </p>
        </div>

        <!-- Simple nav groups -->
        <nav aria-label="Footer navigation" class="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <section aria-labelledby="footer-explore" data-testid="footer-explore">
            <h3 id="footer-explore" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.explore') }}</h3>
            <ul class="mt-3 text-sm">
              <li v-for="link in sectionExplore" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-about" data-testid="footer-about">
            <h3 id="footer-about" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.about') }}</h3>
            <ul class="mt-3 text-sm">
              <li v-for="link in sectionAbout" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionContribute.length" aria-labelledby="footer-contribute" data-testid="footer-contribute">
            <h3 id="footer-contribute" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.contribute') }}</h3>
            <ul class="mt-3 text-sm">
              <li v-for="link in sectionContribute" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionAccount.length" aria-labelledby="footer-account" data-testid="footer-account">
            <h3 id="footer-account" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.account') }}</h3>
            <ul class="mt-3 text-sm">
              <li v-for="link in sectionAccount" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="isAdmin && sectionAdmin.length" aria-labelledby="footer-admin" data-testid="footer-admin">
            <h3 id="footer-admin" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">{{ $t('footer.admin') }}</h3>
            <ul class="mt-3 text-sm">
              <li v-for="link in sectionAdmin" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>
        </nav>
      </div>

      <!-- Bottom row -->
      <div class="homepage-v3-footer-bottom mt-10 px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-2">
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400" data-testid="footer-copyright">
          {{ $t('footer.all_rights', { year }) }}
        </p>

        <div class="flex items-center gap-1 sm:gap-6 xl:gap-6 text-xs sm:text-sm flex-wrap xl:flex-nowrap">
          <div class="homepage-v3-footer-technical-links flex items-center gap-3">
            <template v-for="{ to, labelKey, icon } in bottomLinks" :key="to">
              <NTooltip :content="$t(labelKey) as string">
                <NuxtLink :to="to" class="link-muted hidden" :aria-label="$t(labelKey) as string" :data-testid="`footer-${to.slice(1)}`">
                  <NIcon :name="icon" size="5" />
                </NuxtLink>
              </NTooltip>
              <NuxtLink :to="to" class="link-muted inline whitespace-nowrap" :data-testid="`footer-${to.slice(1)}`">{{ $t(labelKey) }}</NuxtLink>
            </template>
          </div>

          <div class="homepage-v3-footer-preferences flex items-center gap-2">
            <I18nSelector />
            <ThemeSelector />
          </div>

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

// Collect route paths without eagerly importing each page component.
const pageModules = import.meta.glob('../pages/**/*.vue')

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
  .filter(l => ['/', '/authors', '/references'].includes(l.path))
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

<style>
.homepage-v3-footer {
  display: block;
  background: #f7f5ef;
}

.quote-detail-footer {
  background: #f7f5ef;
}

.quote-detail-footer.app-footer {
  padding-top: 0;
}

.quote-detail-footer .u-container {
  padding-top: 7rem;
  padding-bottom: 2.5rem;
}

.quote-detail-footer .u-container > div:first-child {
  min-height: 22rem;
  gap: 4rem;
}

.quote-detail-footer .u-container > div:first-child > div:first-child p {
  max-width: 24rem;
  margin-top: 1.25rem;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: #77746d;
}

.dark .quote-detail-footer .u-container > div:first-child > div:first-child p {
  color: rgba(245, 242, 236, 0.62);
}

.dark .quote-detail-footer {
  background: #0c0a09;
}

.dark .homepage-v3-footer {
  background: #0c0a09;
}

.homepage-v3-footer.app-footer {
  border-top: 0;
  padding-top: 0;
}

.homepage-v3-footer .u-container {
  max-width: 1440px;
  padding-top: 7rem;
  padding-bottom: 2.5rem;
}

.homepage-v3-footer .u-container > div:first-child {
  min-height: 22rem;
  gap: 4rem;
}

.homepage-v3-footer .u-container > div:first-child > div:first-child {
  max-width: 28rem;
}

.homepage-v3-footer .u-container > div:first-child > div:first-child p {
  max-width: 24rem;
  margin-top: 1.25rem;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: #77746d;
}

.homepage-v3-footer-wordmark {
  display: inline-block;
  color: #181818;
  font-family: Fraunces, Georgia, serif;
  font-size: 2rem;
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.06em;
}

.homepage-v3-footer nav {
  gap: 3.5rem;
}

.homepage-v3-footer nav h3 {
  color: #77746d;
  font-size: 0.65rem;
  letter-spacing: 0.16em;
}

.homepage-v3-footer nav ul {
  margin-top: 1rem;
  line-height: 1.8;
}

.homepage-v3-footer nav li,
.homepage-v3-footer nav a {
  font-size: 0.875rem;
}

.homepage-v3-footer .u-container > div:last-child {
  border-color: rgba(120, 116, 109, 0.24);
  padding-top: 1.5rem;
  color: rgba(119, 116, 109, 0.72);
  font-size: 0.75rem;
}

.homepage-v3-footer-bottom .link-muted {
  color: inherit;
  text-decoration: none;
}

.homepage-v3-footer-bottom .link-muted:hover { color: #181818; }
.homepage-v3-footer-bottom > div:last-child { gap: 1rem; }
.homepage-v3-footer-bottom button,
.homepage-v3-footer-bottom [role='button'] {
  color: inherit;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.homepage-v3-footer-bottom button:hover,
.homepage-v3-footer-bottom [role='button']:hover {
  color: #181818;
}

.dark .homepage-v3-footer-wordmark { color: #f5f2ec; }
.dark .homepage-v3-footer .u-container > div:first-child > div:first-child p { color: rgba(245, 242, 236, 0.62); }
.dark .homepage-v3-footer nav h3 { color: rgba(245, 242, 236, 0.52); }
.dark .homepage-v3-footer-bottom .link-muted:hover,
.dark .homepage-v3-footer-bottom button:hover,
.dark .homepage-v3-footer-bottom [role='button']:hover { color: #f5f2ec; }

@media (max-width: 767px) {
  .homepage-v3-footer .u-container {
    padding: 4.5rem 1.5rem 8rem;
  }

  .homepage-v3-footer .u-container > div:first-child {
    min-height: auto;
  }

  .homepage-v3-footer .u-container > div:first-child,
  .homepage-v3-footer .u-container > div:last-child {
    padding-left: 0;
    padding-right: 0;
  }

  .homepage-v3-footer nav {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2.25rem;
  }

  .homepage-v3-footer nav section { min-width: 0; }

  .homepage-v3-footer nav ul {
    display: flex;
    max-width: 100%;
    margin-top: 0.5rem;
    padding-left: 0;
    gap: 1.5rem;
    overflow-x: auto;
    line-height: 1.5;
    scrollbar-width: none;
  }

  .homepage-v3-footer nav ul::-webkit-scrollbar { display: none; }
  .homepage-v3-footer nav li { flex-shrink: 0; }

  .homepage-v3-footer .u-container > div:first-child > div:first-child p {
    max-width: 19rem;
    font-size: 1.35rem;
  }

  .homepage-v3-footer-wordmark { font-size: 1.75rem; }

  .homepage-v3-footer .u-container > div:last-child {
    align-items: flex-start;
    gap: 1.25rem;
  }

  .homepage-v3-footer .u-container > div:first-child > div:first-child p {
    margin-top: 1.5rem;
  }

  .homepage-v3-footer-bottom > div:last-child {
    flex-wrap: wrap;
  }

  .homepage-v3-footer-technical-links {
    max-width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .homepage-v3-footer-technical-links::-webkit-scrollbar { display: none; }

  .homepage-v3-footer-bottom > div:last-child {
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .homepage-v3-footer-preferences {
    flex-basis: 100%;
    justify-content: flex-start;
  }

}
</style>
