<template>
  <main class="prose mx-auto max-w-3xl px-5 py-12">
    <div class="mt-8">
      <h1 class="font-serif font-size-24 md:font-size-32 font-600 line-height-tight">{{ $t('privacy_title') }}</h1>
      <p class="text-sm text-gray-500 relative -top-2">{{ $t('privacy_effective_date', { date: effectiveDate }) }}</p>
    </div>

    <section>
      <h2>{{ $t('privacy_s1_title') }}</h2>
      <p>{{ $t('privacy_s1_p1') }}</p>
      <p>{{ $t('privacy_s1_p2') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s2_title') }}</h2>
      <p>{{ $t('privacy_s2_p1') }}</p>
      <ul>
        <li><strong>{{ $t('privacy_s2_li1_label') }}</strong> {{ $t('privacy_s2_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s2_li2_label') }}</strong> {{ $t('privacy_s2_li2_text') }}</li>
        <li><strong>{{ $t('privacy_s2_li3_label') }}</strong> {{ $t('privacy_s2_li3_text') }}</li>
      </ul>
      <p>{{ $t('privacy_s2_p2') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s3_title') }}</h2>
      <ul>
        <li>{{ $t('privacy_s3_li1') }}</li>
        <li>{{ $t('privacy_s3_li2') }}</li>
        <li>{{ $t('privacy_s3_li3') }}</li>
      </ul>
      <p>{{ $t('privacy_s3_p1') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s4_title') }}</h2>
      <p>{{ $t('privacy_s4_p1') }}</p>
      <p><strong>{{ $t('privacy_s4_p2_label') }} {{ $t('privacy_s4_p2_value') }}</strong></p>
      <ul>
        <li>{{ $t('privacy_s4_li1') }}</li>
        <li>{{ $t('privacy_s4_li2') }}</li>
      </ul>
      <p>{{ $t('privacy_s4_p3') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s5_title') }}</h2>
      <p>{{ $t('privacy_s5_p1') }}</p>
      <ul>
        <li>{{ $t('privacy_s5_li1') }}</li>
        <li>{{ $t('privacy_s5_li2') }}</li>
        <li>{{ $t('privacy_s5_li3') }}</li>
      </ul>
    </section>

    <section>
      <h2>{{ $t('privacy_s6_title') }}</h2>
      <p>{{ $t('privacy_s6_p1') }}</p>
      <ul>
        <li><strong>{{ $t('privacy_s6_li1_label') }}</strong> {{ $t('privacy_s6_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s6_li2_label') }}</strong> {{ $t('privacy_s6_li2_text') }}</li>
      </ul>
    </section>

    <section>
      <h2>{{ $t('privacy_s7_title') }}</h2>
      <ul>
        <li><strong>{{ $t('privacy_s7_li1_label') }}</strong> {{ $t('privacy_s7_li1_text') }}</li>
        <li><strong>{{ $t('privacy_s7_li2_label') }}</strong> {{ $t('privacy_s7_li2_text') }}</li>
      </ul>
      <p>{{ $t('privacy_s7_p1') }}</p>
    </section>

    <section>
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

    <section>
      <h2>{{ $t('privacy_s9_title') }}</h2>
      <ul>
        <li>{{ $t('privacy_s9_li1') }}</li>
        <li>{{ $t('privacy_s9_li2') }}</li>
        <li>{{ $t('privacy_s9_li3') }}</li>
        <li>{{ $t('privacy_s9_li4') }}</li>
      </ul>
      <p>{{ $t('privacy_s9_p1') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s10_title') }}</h2>
      <p>{{ $t('privacy_s10_p1') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s11_title') }}</h2>
      <p>{{ $t('privacy_s11_p1') }}</p>
    </section>

    <section>
      <h2>{{ $t('privacy_s12_title') }}</h2>
      <p>{{ $t('privacy_s12_p1') }}</p>
      <ul>
        <li>{{ $t('privacy_s12_li1_label') }} <a :href="$ts('privacy_s12_li1_url')" target="_blank">{{ $t('privacy_s12_li1_link') }}</a></li>
        <li>{{ $t('privacy_s12_li2') }}</li>
        <li>{{ $t('privacy_s12_li3') }}</li>
      </ul>

      <p class="font-medium mt-6">{{ $t('privacy_tagline') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

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
  datePublished: new Date().toISOString().split('T')[0]
})
definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default'
})

const effectiveDate = new Date().toLocaleDateString('fr-FR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
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
.prose :where(h2) {
  font-size: 2.0rem;
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

  font-size: 1.5rem; /* 24px */
  line-height: 2rem; /* 32px */
  font-weight: 200;
}
.prose :where(ul, ol) {
  font-family: 'Nunito';
  margin-top: 1em;
  margin-bottom: 1.25em;
  padding-left: 1.4em;

  font-size: 1.3rem;
  line-height: 2rem;
  font-weight: 300;
}
.prose :where(ul) {
  list-style-type: disc;
}
.prose :where(li + li) {
  margin-top: 1em;
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
  border-radius: 2px; /* subtle rounding like terms page */
}

/* Blockquotes: calmer style */
.prose :where(blockquote) {
  font-style: italic;
  color: #374151; /* gray-700 */
  border-left: 3px solid #E5E7EB; /* gray-200 */
  padding-left: 1rem;
  margin: 1.25em 0;
}

/* Sections get a gentle separation */
.prose :where(section + section) {
  margin-top: 2.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(17, 24, 39, 0.06); /* gray-900 @ 6% */
}

/* Small meta line under title */
.prose :where(p.text-sm) {
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  color: #6B7280; /* gray-500 (ensure if Tailwind isn't loaded) */
}

/* Dark mode via prefers-dark class */
.prefers-dark .prose :where(a:focus-visible) {
  outline-color: #a9c3ff;
}
.prefers-dark .prose :where(blockquote) {
  color: #9CA3AF; /* gray-400/300 for dark readability */
  border-left-color: #374151; /* gray-700 */
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
  .prose :where(blockquote) {
    color: #9CA3AF; /* gray-400/300 for dark readability */
    border-left-color: #374151; /* gray-700 */
  }
  .prose :where(section + section) {
    border-top-color: rgba(229, 231, 235, 0.08); /* gray-200 @ 8% */
  }
  .prose :where(p.text-sm) {
    color: #9CA3AF; /* gray-400 */
  }
}
</style>
