<template>
  <main class="legal-page mx-auto max-w-6xl px-6 pb-12 pt-12 sm:px-8 sm:pb-16 md:pt-28 lg:px-10">
    <header id="privacy-page-header" class="legal-header">
      <h1>{{ $t('privacy_title') }}</h1>
      <p class="effective-date">{{ $t('privacy_effective_date', { date: effectiveDate }) }}</p>
    </header>

    <div class="privacy-body">
      <LegalContents
        class="privacy-toc"
        :label="$ts('legal_contents')"
        :items="privacyContentsItems"
        :active-id="activePrivacySectionId"
      />

      <div class="legal-content text-stone-700 dark:text-stone-200">

    <section id="privacy-introduction" class="privacy-section">
      <h2>{{ $t('privacy_s1_title') }}</h2>
      <p>{{ $t('privacy_s1_p1') }}</p>
      <p>{{ $t('privacy_s1_p2') }}</p>
    </section>

    <section id="privacy-data-collected" class="privacy-section">
      <h2>{{ $t('privacy_s2_title') }}</h2>
      <p>{{ $t('privacy_s2_p1') }}</p>
      <ul>
        <li><strong>{{ $t('privacy_s2_li1_label') }}</strong> {{ $t('privacy_s2_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s2_li2_label') }}</strong> {{ $t('privacy_s2_li2_text') }}</li>
        <li><strong>{{ $t('privacy_s2_li3_label') }}</strong> {{ $t('privacy_s2_li3_text') }}</li>
      </ul>
      <p>{{ $t('privacy_s2_p2') }}</p>
    </section>

    <section id="privacy-data-use" class="privacy-section">
      <h2>{{ $t('privacy_s3_title') }}</h2>
      <ul>
        <li>{{ $t('privacy_s3_li1') }}</li>
        <li>{{ $t('privacy_s3_li2') }}</li>
        <li>{{ $t('privacy_s3_li3') }}</li>
      </ul>
      <p>{{ $t('privacy_s3_p1') }}</p>
    </section>

    <section id="privacy-third-parties" class="privacy-section">
      <h2>{{ $t('privacy_s4_title') }}</h2>
      <p>{{ $t('privacy_s4_p1') }}</p>
      <p><strong>{{ $t('privacy_s4_p2_label') }} {{ $t('privacy_s4_p2_value') }}</strong></p>
      <ul>
        <li>{{ $t('privacy_s4_li1') }}</li>
        <li>{{ $t('privacy_s4_li2') }}</li>
      </ul>
      <p>{{ $t('privacy_s4_p3') }}</p>
    </section>

    <section id="privacy-data-transfers" class="privacy-section">
      <h2>{{ $t('privacy_s5_title') }}</h2>
      <p>{{ $t('privacy_s5_p1') }}</p>
      <ul>
        <li>{{ $t('privacy_s5_li1') }}</li>
        <li>{{ $t('privacy_s5_li2') }}</li>
        <li>{{ $t('privacy_s5_li3') }}</li>
      </ul>
    </section>

    <section id="privacy-legal-basis" class="privacy-section">
      <h2>{{ $t('privacy_s6_title') }}</h2>
      <p>{{ $t('privacy_s6_p1') }}</p>
      <ul>
        <li><strong>{{ $t('privacy_s6_li1_label') }}</strong> {{ $t('privacy_s6_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s6_li2_label') }}</strong> {{ $t('privacy_s6_li2_text') }}</li>
      </ul>
    </section>

    <section id="privacy-data-retention" class="privacy-section">
      <h2>{{ $t('privacy_s7_title') }}</h2>
      <ul>
        <li><strong>{{ $t('privacy_s7_li1_label') }}</strong> {{ $t('privacy_s7_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s7_li2_label') }}</strong> {{ $t('privacy_s7_li2_text') }}</li>
      </ul>
      <p>{{ $t('privacy_s7_p1') }}</p>
    </section>

    <section id="privacy-rights" class="privacy-section">
      <h2>{{ $t('privacy_s8_title') }}</h2>
      <p>{{ $t('privacy_s8_p1') }}</p>
      <ul>
        <li>{{ $t('privacy_s8_li1') }}</li>
        <li>{{ $t('privacy_s8_li2') }}</li>
        <li>{{ $t('privacy_s8_li3') }}</li>
        <li>{{ $t('privacy_s8_li4') }}</li>
        <li>{{ $t('privacy_s8_li5') }}</li>
      </ul>
      <p>{{ $t('privacy_s8_p2') }}</p>
    </section>

    <section id="privacy-security" class="privacy-section">
      <h2>{{ $t('privacy_s9_title') }}</h2>
      <ul>
        <li>{{ $t('privacy_s9_li1') }}</li>
        <li>{{ $t('privacy_s9_li2') }}</li>
        <li>{{ $t('privacy_s9_li3') }}</li>
        <li>{{ $t('privacy_s9_li4') }}</li>
      </ul>
      <p>{{ $t('privacy_s9_p1') }}</p>
    </section>

    <section id="privacy-children" class="privacy-section">
      <h2>{{ $t('privacy_s10_title') }}</h2>
      <p>{{ $t('privacy_s10_p1') }}</p>
    </section>

    <section id="privacy-changes" class="privacy-section">
      <h2>{{ $t('privacy_s11_title') }}</h2>
      <p>{{ $t('privacy_s11_p1') }}</p>
    </section>

    <section id="privacy-contact" class="privacy-section">
      <h2>{{ $t('privacy_s12_title') }}</h2>
      <p>{{ $t('privacy_s12_p1') }}</p>
      <ul>
        <li>{{ $t('privacy_s12_li1_label') }} <a :href="$ts('privacy_s12_li1_url')" target="_blank">{{ $t('privacy_s12_li1_link') }}</a></li>
        <li><strong>{{ $t('privacy_s12_email_label') }}</strong> <a :href="'mailto:' + $ts('privacy_s12_email')">{{ $ts('privacy_s12_email') }}</a></li>
        <li>{{ $t('privacy_s12_li2') }}</li>
        <li>{{ $t('privacy_s12_li3') }}</li>
      </ul>

      <p class="font-medium mt-6">{{ $t('privacy_tagline') }}</p>
    </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()
const { locale } = useI18nLocale()
const privacyFirstPublishedIso = '2025-08-07'
const effectiveDate = computed(() => new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${privacyFirstPublishedIso}T00:00:00Z`)))

const privacySectionEntries = [
  { id: 'privacy-introduction', key: 'privacy_s1_title' },
  { id: 'privacy-data-collected', key: 'privacy_s2_title' },
  { id: 'privacy-data-use', key: 'privacy_s3_title' },
  { id: 'privacy-third-parties', key: 'privacy_s4_title' },
  { id: 'privacy-data-transfers', key: 'privacy_s5_title' },
  { id: 'privacy-legal-basis', key: 'privacy_s6_title' },
  { id: 'privacy-data-retention', key: 'privacy_s7_title' },
  { id: 'privacy-rights', key: 'privacy_s8_title' },
  { id: 'privacy-security', key: 'privacy_s9_title' },
  { id: 'privacy-children', key: 'privacy_s10_title' },
  { id: 'privacy-changes', key: 'privacy_s11_title' },
  { id: 'privacy-contact', key: 'privacy_s12_title' },
] as const

const privacyContentsItems = computed(() => privacySectionEntries.map(item => ({
  id: item.id,
  label: $ts(item.key),
})))

const activePrivacySectionId = ref('')
let privacyScrollFrame = 0

function syncActivePrivacySection() {
  if (privacyScrollFrame) return

  privacyScrollFrame = window.requestAnimationFrame(() => {
    privacyScrollFrame = 0
    const isAtPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    const currentSection = isAtPageEnd
      ? privacySectionEntries.at(-1)
      : [...privacySectionEntries]
          .map(item => ({ item, element: document.getElementById(item.id) }))
          .filter(({ element }) => element && element.getBoundingClientRect().top <= 144)
          .at(-1)?.item

    activePrivacySectionId.value = currentSection?.id ?? ''
    const nextHash = currentSection ? `#${currentSection.id}` : ''
    if (window.location.hash !== nextHash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    }
  })
}

function syncActivePrivacySectionFromHash() {
  const id = window.location.hash.slice(1)
  if (privacySectionEntries.some(item => item.id === id)) {
    activePrivacySectionId.value = id
    return
  }
  syncActivePrivacySection()
}

onMounted(() => {
  window.addEventListener('scroll', syncActivePrivacySection, { passive: true })
  window.addEventListener('hashchange', syncActivePrivacySectionFromHash)
  window.addEventListener('popstate', syncActivePrivacySectionFromHash)
  syncActivePrivacySection()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncActivePrivacySection)
  window.removeEventListener('hashchange', syncActivePrivacySectionFromHash)
  window.removeEventListener('popstate', syncActivePrivacySectionFromHash)
  if (privacyScrollFrame) window.cancelAnimationFrame(privacyScrollFrame)
})

useHead({
  title: $ts('privacy_title'),
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: $ts('privacy_meta_desc') },
  ],
});

import { useJsonLd } from '../composables/useSeo'

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'PrivacyPolicy',
  url: 'https://verbatims.cc/privacy',
  name: $ts('privacy_title'),
  description: $ts('privacy_meta_desc'),
  datePublished: privacyFirstPublishedIso,
  dateModified: privacyFirstPublishedIso,
})
definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default',
  pageTransition: { name: 'legal-page', mode: 'out-in' }
})

</script>

<style scoped>
.legal-page {
  color: inherit;
}

.legal-content {
  max-width: 70ch;
}

.privacy-body {
  display: grid;
  grid-template-columns: minmax(0, 70ch) minmax(14rem, 17rem);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}

.privacy-toc {
  position: sticky;
  top: 6rem;
  grid-column: 2;
  grid-row: 1;
  max-height: calc(100dvh - 7rem);
  overflow-y: auto;
  padding-left: 1rem;
  border-left: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  scrollbar-width: thin;
}

.privacy-section {
  scroll-margin-top: 6rem;
}

.legal-header {
  margin-bottom: 2.5rem;
}

.legal-header h1 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 2.75rem;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1.05;
  text-wrap: balance;
}

@media (min-width: 768px) {
  .legal-header h1 { font-size: 3.25rem; }
}

@media (min-width: 1024px) {
  .legal-header h1 { font-size: 3.75rem; }
}

.legal-content :deep(h2) {
  margin: 0 0 1rem;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.375rem, 1.25rem + 0.3vw, 1.625rem);
  font-weight: 600;
  line-height: 1.25;
  scroll-margin-top: 6rem;
}

.effective-date {
  margin: 0.75rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.7;
}

.legal-page section + section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.legal-content :deep(p),
.legal-content :deep(ul),
.legal-content :deep(ol) {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.7;
  color: inherit;
}

.legal-content :deep(p) {
  margin: 0.9em 0;
}

.legal-content :deep(ul),
.legal-content :deep(ol) {
  margin: 0.9em 0 1.1em;
  padding-left: 1.35em;
}

.legal-content :deep(ul) {
  list-style: disc;
}

.legal-content :deep(li + li) {
  margin-top: 0.55em;
}

.legal-content :deep(strong) {
  font-weight: 650;
}

.legal-content :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-decoration-thickness: 0.07em;
  text-underline-offset: 0.2em;
}

.legal-content :deep(a:hover) {
  text-decoration-thickness: 0.12em;
}

.legal-content :deep(a:focus-visible) {
  border-radius: 2px;
  outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .legal-header {
    margin-bottom: 2.5rem;
  }

  .legal-page section + section {
    margin-top: 2.25rem;
    padding-top: 1.5rem;
  }
}

@media (max-width: 900px) {
  .privacy-body {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
  }

  .privacy-toc {
    position: static;
    grid-column: auto;
    grid-row: auto;
    max-height: none;
    padding: 0 0 1.25rem;
    border-left: 0;
    border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  }

  .legal-content {
    max-width: 70ch;
  }
}

@media (max-width: 640px) {
}
</style>
