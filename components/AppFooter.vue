<template>
  <!-- Outer wrapper uses a subtle gradient ring like the mock.
       We keep it purely decorative and not announced to ATs. -->
  <footer
    class="relative mt-18 lg:mt-22"
    role="contentinfo"
    aria-label="Site footer"
    data-testid="footer"
  >
    <!-- Background surface token (soft card) -->
    <div
      class="u-container px-4 sm:px-6"
    >
      <section
        class="relative rounded-3xl of-hidden
               bg-gray-1 dark:bg-gray-9
               ring-1 ring-inset ring-gray-3/60 dark:ring-gray-8/70
               shadow-[0_1px_0_0_rgba(0,0,0,0.02)]
              "
        aria-label="Call to action and navigation"
      >
        <!-- Soft halo gradient backdrop (decorative) -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
          <div
            class="absolute -inset-14 md:-inset-18
                   bg-gradient-to-b from-transparent via-primary/5 to-transparent
                   dark:via-primary/8 blur-2xl"
          />
        </div>

        <!-- Top CTA block -->
        <div
          class="flex flex-col items-center text-center py-12 sm:py-14 lg:py-18 px-4 sm:px-8"
        >
          <div
            class="mb-5 inline-flex size-12 sm:size-14 items-center justify-center rounded-2xl
                   bg-primary-600/10 dark:bg-primary-400/10
                   ring-1 ring-inset ring-primary/20 text-primary-700 dark:text-primary-300"
            aria-hidden="true"
          >
            <UIcon name="i-solar-sparkle-bold" class="size-6 sm:size-7" />
          </div>

          <h2
            class="font-600 tracking-tight
                   text-2xl sm:text-3xl lg:text-4xl
                   text-gray-12 dark:text-gray-1"
            data-testid="footer-cta-title"
          >
            Discover, save, and share powerful quotes
          </h2>

          <p
            class="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed
                   text-gray-9 dark:text-gray-4"
            data-testid="footer-cta-subtitle"
          >
            Verbatims is a community-driven library of quotes. Explore authors and references, build collections, and contribute your own findings.
          </p>

          <div class="mt-6 flex gap-3">
            <UButton
              data-testid="footer-cta-button"
              aria-label="Explore quotes"
              btn="solid"
              size="md"
              to="/"
              class="rounded-full px-5 sm:px-6 py-2.5 font-600 tracking-wide gap-2
                     shadow-[0_6px_24px_-6px_rgba(79,70,229,0.45)]
                     hover:shadow-[0_10px_28px_-8px_rgba(79,70,229,0.55)]
                     transition-shadow duration-200"
            >
              <span>Explore Quotes</span>
              <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
            </UButton>
            <UButton
              aria-label="Submit a quote"
              btn="ghost"
              size="md"
              to="/dashboard/my-quotes/drafts"
              class="rounded-full px-5 sm:px-6 py-2.5"
            >
              Submit a Quote
            </UButton>
          </div>
        </div>

        <!-- Divider between CTA and link area -->
        <hr
          class="mx-4 sm:mx-8 my-2 border-0 h-px bg-gray-3/80 dark:bg-gray-8/80"
          role="separator"
          aria-hidden="true"
        />

        <!-- Bottom content: contact + nav columns + social/newsletter -->
        <div class="px-4 sm:px-8 pt-8 pb-6">
          <!-- Grid follows design: 5 columns on lg -->
          <nav
            class="grid gap-8 md:grid-cols-3 lg:grid-cols-5"
            aria-label="Footer navigation"
            data-testid="footer-grid"
          >
            <!-- Contact -->
            <section aria-labelledby="footer-contact" data-testid="footer-contact">
              <h3 id="footer-contact"
                  class="text-base font-700 text-gray-12 dark:text-gray-1">
                Contact
              </h3>

              <ul class="mt-4 space-y-4">
                <li class="flex items-start gap-3">
                  <span
                    class="inline-flex items-center justify-center rounded-full bg-primary-600/10 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 ring-1 ring-primary/20 size-8"
                    aria-hidden="true"
                  >
                    <UIcon name="i-lucide-phone" class="size-4" />
                  </span>
                  <a
                    href="tel:6027744735"
                    class="link-muted"
                    aria-label="Call 602-774-4735"
                  >
                    602–774–4735
                  </a>
                </li>

                <li class="flex items-start gap-3">
                  <span
                    class="inline-flex items-center justify-center rounded-full bg-primary-600/10 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 ring-1 ring-primary/20 size-8"
                    aria-hidden="true"
                  >
                    <UIcon name="i-lucide-map-pin" class="size-4" />
                  </span>
                  <address class="not-italic text-sm text-gray-11 dark:text-gray-4">
                    11022 South 51st Street Suite 105<br />
                    Phoenix, AZ 85044
                  </address>
                </li>

                <li class="flex items-start gap-3">
                  <span
                    class="inline-flex items-center justify-center rounded-full bg-primary-600/10 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 ring-1 ring-primary/20 size-8"
                    aria-hidden="true"
                  >
                    <UIcon name="i-lucide-mail" class="size-4" />
                  </span>
                  <a
                    href="mailto:hello@unifiedui.com"
                    class="link-muted"
                    aria-label="Send email to hello@unifiedui.com"
                  >
                    hello@unifiedui.com
                  </a>
                </li>
              </ul>


              <ul class="mt-4 flex gap-4" role="list">
                <li>
                  <UButton
                    aria-label="Facebook"
                    btn="ghost"
                    size="sm"
                    icon
                    class="rounded-full"
                    to="https://facebook.com"
                    external
                  >
                    <UIcon name="i-ph-facebook-logo" class="size-5" />
                  </UButton>
                </li>
                <li>
                  <UButton
                    aria-label="Instagram"
                    btn="ghost"
                    size="sm"
                    icon
                    class="rounded-full"
                    to="https://instagram.com"
                    external
                  >
                    <UIcon name="i-ph-instagram-logo" class="size-5" />
                  </UButton>
                </li>
                <li>
                  <UButton
                    aria-label="LinkedIn"
                    btn="ghost"
                    size="sm"
                    icon
                    class="rounded-full"
                    to="https://linkedin.com"
                    external
                  >
                    <UIcon name="i-ph-linkedin-logo" class="size-5" />
                  </UButton>
                </li>
                <li>
                  <UButton
                    aria-label="Twitter"
                    btn="ghost"
                    size="sm"
                    icon
                    class="rounded-full"
                    to="https://twitter.com"
                    external
                  >
                    <UIcon name="i-ph-twitter-logo" class="size-5" />
                  </UButton>
                </li>
              </ul>
            </section>

            <!-- Explore -->
            <section aria-labelledby="footer-explore" data-testid="footer-explore">
              <h3 id="footer-explore" class="text-base font-700 text-gray-12 dark:text-gray-1">
                Explore
              </h3>
              <ul class="mt-4 space-y-3 text-sm">
                <li v-for="link in sectionExplore" :key="link.path">
                  <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
                </li>
              </ul>
            </section>

            <!-- Contribute -->
            <section aria-labelledby="footer-contribute" data-testid="footer-contribute">
              <h3 id="footer-contribute" class="text-base font-700 text-gray-12 dark:text-gray-1">
                Contribute
              </h3>
              <ul class="mt-4 space-y-3 text-sm">
                <li v-for="link in sectionContribute" :key="link.path">
                  <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
                </li>
              </ul>
            </section>

            <!-- Account -->
            <section
              aria-labelledby="footer-account"
              data-testid="footer-account"
              v-if="sectionAccount.length"
            >
              <h3 id="footer-account" class="text-base font-700 text-gray-12 dark:text-gray-1">
                Account
              </h3>
              <ul class="mt-4 space-y-3 text-sm">
                <li v-for="link in sectionAccount" :key="link.path">
                  <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
                </li>
              </ul>
            </section>

            <!-- Admin (visible to admins only) -->
            <section
              v-if="isAdmin && sectionAdmin.length"
              aria-labelledby="footer-admin"
              data-testid="footer-admin"
            >
              <h3 id="footer-admin" class="text-base font-700 text-gray-12 dark:text-gray-1">
                Admin
              </h3>
              <ul class="mt-4 space-y-3 text-sm">
                <li v-for="link in sectionAdmin" :key="link.path">
                  <NuxtLink class="link-muted" :to="link.path">{{ link.label }}</NuxtLink>
                </li>
              </ul>
            </section>
          </nav>

          <!-- Bottom row -->
          <div
            class="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4
                   border-t border-gray-3/80 dark:border-gray-8/80 pt-5"
          >
            <p
              class="text-xs sm:text-sm text-gray-10 dark:text-gray-5"
              data-testid="footer-copyright"
            >
              © {{ year }} Verbatims. All rights reserved.
            </p>

            <ul class="flex items-center gap-6 text-xs sm:text-sm">
              <li>
                <NuxtLink to="/privacy" class="link-muted" data-testid="footer-privacy">
                  Privacy & Policy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms" class="link-muted" data-testid="footer-terms">
                  Terms & Condition
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Notes:
// - UnaUI atoms used: UButton, UIcon. UnoCSS handles layout/styles.
// - link-muted class below centralizes hover/focus/visited tokens.
// - Dynamic year for copyright.

const year = new Date().getFullYear()

 // Session-based admin gating
const { user } = useUserSession()
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
