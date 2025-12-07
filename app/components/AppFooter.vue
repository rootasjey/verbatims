<template>
  <!-- Compact footer aligned with the home page spacing and typography -->
  <footer
    class="pt-8 border-t border-gray-3/80 dark:border-gray-8/80"
    role="contentinfo"
    aria-label="Site footer"
    data-testid="footer"
  >
    <div class="u-container px-8 py-12">
      <div class="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <!-- Brand + short tagline -->
        <div class="max-w-xl">
          <AppIcon class="ml-4" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Discover and share memorable quotes <br /> from films, books, music, and more.
          </p>
        </div>

        <!-- Simple nav groups -->
        <nav aria-label="Footer navigation" class="grid grid-cols-2 gap-8"
          :class="{
            'grid-cols-2': !isAdmin,
            'grid-cols-2 sm:grid-cols-4': isAdmin && sectionAccount.length,
            'grid-cols-2 sm:grid-cols-3': isAdmin && !sectionAccount.length
          }">
          <section aria-labelledby="footer-explore" data-testid="footer-explore">
            <h3 id="footer-explore" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">Explore</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionExplore" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
              <li v-for="link in sectionAbout" :key="link.path + '-about'">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionContribute.length" aria-labelledby="footer-contribute" data-testid="footer-contribute">
            <h3 id="footer-contribute" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">Contribute</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionContribute" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="sectionAccount.length" aria-labelledby="footer-account" data-testid="footer-account">
            <h3 id="footer-account" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">Account</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionAccount" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>

          <section v-if="isAdmin && sectionAdmin.length" aria-labelledby="footer-admin" data-testid="footer-admin">
            <h3 id="footer-admin" class="text-xs uppercase font-600 tracking-wide text-gray-500 dark:text-gray-400">Admin</h3>
            <ul class="mt-3 space-y-2 text-sm">
              <li v-for="link in sectionAdmin" :key="link.path">
                <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
              </li>
            </ul>
          </section>
        </nav>
      </div>

      <!-- Bottom row -->
      <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400" data-testid="footer-copyright">
          © {{ year }} Verbatims. All rights reserved.
        </p>

        <div class="flex items-center gap-6 text-xs sm:text-sm">
          <NuxtLink to="/licenses" class="link-muted" data-testid="footer-licenses">Licenses</NuxtLink>
          <NuxtLink to="/privacy" class="link-muted" data-testid="footer-privacy">Privacy & Policy</NuxtLink>
          <NuxtLink to="/terms" class="link-muted" data-testid="footer-terms">Terms & Condition</NuxtLink>
          <span class="color-gray-500 font-600">Version: {{ version }}</span>
          
          <ThemeSelector />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
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
  .filter(l => ['/about'].includes(l.path))
  .filter(notAdmin)

const sectionAdmin = allLinks
  .filter(l => l.path.startsWith('/admin'))
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
