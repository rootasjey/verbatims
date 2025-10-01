<template>
  <main class="prose mx-auto max-w-3xl px-5 py-12">
    <div class="mt-12">
      <h1>Licenses & attribution</h1>
      <p class="text-sm text-gray-500 relative -top-2">
        License summary for Verbatims and credits for third‑party software and assets.
      </p>
    </div>

    <section>
      <h2>Project license</h2>
      <p>
        Verbatims is open source and distributed under the MIT License. In short:
      </p>
      <ul>
        <li>You're free to use, modify, distribute, and sublicense the code.</li>
        <li>Please include the copyright and license notice in copies.</li>
        <li>The software is provided “as is”, without warranties.</li>
      </ul>
      <p>
        Read the full text in the repository: 
        <a
          href="https://github.com/rootasjey/verbatims/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >LICENSE</a>.
      </p>
    </section>

    <section>
      <h2>Third-party software</h2>
      <p>
        This project relies on open-source libraries. We thank their authors and communities. A complete,
        up-to-date list of direct dependencies is available in <code>package.json</code>.
      </p>
      <ul>
        <li>Nuxt 3 (application framework and SSR)</li>
        <li>Vue 3 and Vue Router</li>
        <li>Pinia (state management)</li>
        <li>Nuxt Image</li>
        <li>UNA UI for Nuxt</li>
        <li>NuxtHub Core</li>
        <li>nuxt-auth-utils</li>
        <li>Cloudflare Wrangler (development tooling)</li>
        <li>Jimp (image utilities in tooling)</li>
      </ul>
      <p class="text-sm text-gray-500">
        These third‑party packages are the property of their respective owners and remain under their own licenses.
        Refer to their repositories for license terms.
      </p>
    </section>

    <section>
      <h2>Icon sets and graphics</h2>
      <p>
        Some icons in development and UI previews are provided via Iconify JSON packages. Attribution for notable sets:
      </p>
      <ul>
        <li>
          OpenMoji — Open‑source emojis for designers, developers and everyone else.
          <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer">openmoji.org</a>
          — Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY‑SA 4.0</a>.
        </li>
        <li>
          Lucide Icons — <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">lucide.dev</a>
        </li>
        <li>
          Phosphor Icons — <a href="https://phosphoricons.com" target="_blank" rel="noopener noreferrer">phosphoricons.com</a>
        </li>
        <li>
          Radix Icons — <a href="https://icons.radix-ui.com" target="_blank" rel="noopener noreferrer">icons.radix-ui.com</a>
        </li>
        <li>
          Tabler Icons — <a href="https://tabler.io/icons" target="_blank" rel="noopener noreferrer">tabler.io/icons</a>
        </li>
        <li>
          Solar Icons (via Iconify) — attribution as required by their maintainers.
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/letter-v" title="letter v icons">Letter v icons created by yukyik - Flaticon</a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/3d-v" title="3d-v icons">3d-v icons created by cubydesign - Flaticon</a>
        </li>
      </ul>
      <p class="text-sm text-gray-500">
        Icon sets are governed by their own licenses. Please consult each project's LICENSE for details.
      </p>
    </section>

    <section>
      <h2>Content attribution</h2>
      <p>
        Quotes and references may be subject to copyright or local legal frameworks. When sharing, please include
        appropriate attribution and respect rights holders. Report issues or concerns from any quote's “Report” action
        or contact support.
      </p>
    </section>

    <section>
      <h2>Questions or requests</h2>
      <p>
        If you're a rights holder or maintainer and want an adjustment to attribution, please reach out:
        <a href="mailto:support@verbatims.app">support@verbatims.app</a>.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: 'Licenses • Verbatims',
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: 'License summary for Verbatims and attributions for third‑party libraries, icons, and assets.' },
  ],
})

definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default'
})

import { useMobileDetection, useLayoutSwitching } from '~/composables/useMobileDetection'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

const hydrated = ref(false)

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})
</script>

<style scoped>
/* Smooth anchor offset for in-page links */
.prose :where(h1, h2) {
  scroll-margin-top: 6rem;
}

/* Slightly tighter readable measure and improved rhythm */
.prose {
  line-height: 1.75;
}

/* Headings: clear hierarchy and spacing */
.prose :where(h1) {
  font-family: 'Gambetta';
  font-size: clamp(1.875rem, 1.2rem + 2vw, 2.25rem);
  line-height: 0.6;
  margin-bottom: 0.8em;
}
.prose :where(h2) {
  font-size: 1.1rem;
  line-height: 1.3;
  font-weight: 800;
  font-family: 'Gambetta';
  margin-top: 2.2em;
  margin-bottom: 0.8em;
}

/* Paragraphs and lists spacing */
.prose :where(p) {
  font-family: 'Nunito';
  margin-top: 1em;
  margin-bottom: 1em;
}
.prose :where(ul, ol) {
  font-family: 'Nunito';
  margin-top: 1em;
  margin-bottom: 1.25em;
  padding-left: 1.4em;
}
.prose :where(li + li) {
  margin-top: 0.4em;
}

/* Strong emphasis slightly toned for long-form text */
.prose :where(strong) {
  font-weight: 600;
}

/* Links: subtle underline that appears on hover/focus */
.prose :where(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 0.08em;
}
.prose :where(a:hover, a:focus-visible) {
  text-decoration-thickness: 0.12em;
}

/* Improve focus outlines for accessibility */
.prose :where(a:focus-visible) {
  outline: 2px solid #3b82f6; /* blue-500 in light */
  outline-offset: 2px;
  border-radius: 2px;
}

/* Section separation with a gentle border (matches About/Privacy) */
.prose :where(section + section) {
  margin-top: 2.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(17, 24, 39, 0.06); /* gray-900 @ 6% */
}

/* Small meta line under title */
.prose :where(p.text-sm) {
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  color: #6B7280; /* gray-500 */
}

/* Dark mode via prefers-dark class */
.prefers-dark .prose :where(a:focus-visible) {
  outline-color: #a9c3ff;
}
.prefers-dark .prose :where(section + section) {
  border-top-color: rgba(229, 231, 235, 0.08); /* gray-200 @ 8% */
}
.prefers-dark .prose :where(p.text-sm) {
  color: #9CA3AF; /* gray-400 */
}

/* Dark mode via OS preference */
@media (prefers-color-scheme: dark) {
  .prose :where(a:focus-visible) {
    outline-color: #a9c3ff;
  }
  .prose :where(section + section) {
    border-top-color: rgba(229, 231, 235, 0.08); /* gray-200 @ 8% */
  }
  .prose :where(p.text-sm) {
    color: #9CA3AF; /* gray-400 */
  }
}
</style>
