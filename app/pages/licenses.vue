<template>
  <main class="licenses-page mx-auto max-w-6xl px-6 pb-12 pt-12 sm:px-8 sm:pb-16 md:pt-28 lg:px-10">
    <header id="licenses-page-header" class="licenses-header">
      <h1>{{ $t('licenses_title') }}</h1>
      <p>
        {{ $t('licenses_subtitle') }}
      </p>
    </header>

    <div class="licenses-content text-stone-700 dark:text-stone-200">
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
        >LICENSE<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>.
      </p>
    </section>

    <section>
      <h2>Third-party software</h2>
      <p>
        This project relies on open-source libraries. We thank their authors and communities. A complete,
        up-to-date list of direct dependencies is available in <code>package.json</code>.
      </p>
      <ul>
        <li>Nuxt 4 (application framework and SSR)</li>
        <li>Vue 3 and Vue Router</li>
        <li>Pinia (state management)</li>
        <li>Nuxt Image</li>
        <li>UNA UI for Nuxt</li>
        <li>NuxtHub Core</li>
        <li>nuxt-auth-utils</li>
        <li>Cloudflare Wrangler (development tooling)</li>
        <li>Jimp (image utilities in tooling)</li>
      </ul>
      <p class="licenses-muted-copy">
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
          <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer">openmoji.org<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
          — Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY‑SA 4.0<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>.
        </li>
        <li>
          Lucide Icons — <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">lucide.dev<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          Phosphor Icons — <a href="https://phosphoricons.com" target="_blank" rel="noopener noreferrer">phosphoricons.com<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          Radix Icons — <a href="https://icons.radix-ui.com" target="_blank" rel="noopener noreferrer">icons.radix-ui.com<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          Tabler Icons — <a href="https://tabler.io/icons" target="_blank" rel="noopener noreferrer">tabler.io/icons<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          Solar Icons (via Iconify) — attribution as required by their maintainers.
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/letter-v" title="letter v icons">Letter v icons created by yukyik - Flaticon<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/3d-v" title="3d-v icons">3d-v icons created by cubydesign - Flaticon<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/statue-of-liberty" title="statue of liberty icons">Statue of liberty icons created by justicon - Flaticon<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
        <li>
          <a href="https://www.flaticon.com/free-icons/france" title="france icons">France icons created by Freepik - Flaticon<NIcon name="i-tabler-arrow-up-right" class="licenses-external-link-icon" aria-hidden="true" /></a>
        </li>
      </ul>
      <p class="licenses-muted-copy">
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
        <a href="mailto:support@verbatims.cc">support@verbatims.cc<NIcon name="i-tabler-mail" class="licenses-external-link-icon" aria-hidden="true" /></a>.
      </p>
    </section>
    </div>
  </main>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

useHead({
  title: $ts('licenses_title'),
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: $ts('licenses_meta_desc') },
  ],
})

definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default',
  pageTransition: { name: 'legal-page', mode: 'out-in' }
})


</script>

<style scoped>
.licenses-content :where(h1, h2) {
  scroll-margin-top: 6rem;
}

.licenses-content {
  max-width: 70ch;
}

.licenses-header {
  max-width: none;
  margin-bottom: 2.5rem;
}

.licenses-header h1 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 2.75rem;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.05;
  text-wrap: balance;
}

@media (min-width: 768px) {
  .licenses-header h1 { font-size: 3.25rem; }
}

@media (min-width: 1024px) {
  .licenses-header h1 { font-size: 3.75rem; }
}

.licenses-header p {
  max-width: 48rem;
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.7;
}

.licenses-content :deep(h2) {
  margin: 0 0 0.8rem;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.375rem, 1.25rem + 0.3vw, 1.625rem);
  font-weight: 600;
  line-height: 1.3;
}

.licenses-content :deep(p),
.licenses-content :deep(ul),
.licenses-content :deep(ol) {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.7;
  color: inherit;
}

.licenses-content :deep(p) {
  margin: 0.85em 0;
}

.licenses-content :deep(ul),
.licenses-content :deep(ol) {
  margin: 0.85em 0 1em;
  padding-left: 1.35em;
  list-style: disc;
}

.licenses-content :deep(li + li) {
  margin-top: 0.45em;
}

.licenses-content :deep(p.licenses-muted-copy) {
  font-size: 0.875rem;
  opacity: 0.82;
}

.licenses-content :deep(strong) {
  font-weight: 650;
}

.licenses-content :deep(a) {
  color: inherit;
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: left calc(100% - 0.08em);
  background-size: 0 1px;
  transition: background-size 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.licenses-content :deep(a:hover),
.licenses-content :deep(a:focus-visible) {
  background-size: 100% 1px;
}

.licenses-content :deep(.licenses-external-link-icon) {
  display: inline-block;
  width: 0.78em;
  height: 0.78em;
  margin-inline-start: 0.16em;
  vertical-align: -0.04em;
  opacity: 0.62;
  transition: opacity 160ms ease;
}

.licenses-content :deep(a:hover .licenses-external-link-icon),
.licenses-content :deep(a:focus-visible .licenses-external-link-icon) {
  opacity: 1;
}

.licenses-content :deep(a:focus-visible) {
  outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
  outline-offset: 3px;
  border-radius: 2px;
}

.licenses-content section + section {
  margin-top: 2.25rem;
  padding-top: 1.75rem;
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .licenses-content :deep(a) {
    transition: none;
  }

  .licenses-content :deep(.licenses-external-link-icon) {
    transition: none;
  }
}
</style>
