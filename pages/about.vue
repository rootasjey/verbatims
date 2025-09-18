<template>
  <main class="prose mx-auto max-w-3xl px-4 sm:px-5 py-8 sm:py-12">
    <div class="mt-12">
      <h1>About Verbatims</h1>
      <p class="text-sm text-gray-500 relative -top-2">
        A home for timeless words — curated, searchable, and crafted for daily inspiration.
      </p>
      <p class="text-sm font-600 text-gray-500 relative -top-6">version: {{ version }}</p>
    </div>

    <section>
      <h2>Purpose</h2>
      <p>
        Verbatims is built to share quotes with people in an easy and fun way. The core idea is simple:
        make discovery, attribution, and sharing delightful. Whether you're hunting for a line to
        brighten someone's day, building a collection for a talk, or researching a citation, Verbatims
        aims to make the journey smooth and reliable.
      </p>
    </section>

    <section>
      <h2>A short history</h2>
      <p>
        We love note-taking and collecting quotes — but keeping them scattered in docs and screenshots made them hard to find, verify, and share. Verbatims began as a simple tool to bring quotes, sources, and context together in one place.
      </p>
      <p>
        The vision: a thoughtful, accurate, and inviting library where you can browse by topic or author, build personal collections, and get gentle nudges to revisit ideas that matter to you.
      </p>
      <p>
        This project has gone through multiple re-dos. It started as a Windows Phone app called
        "Citamours", evolved through several prototypes and rewrites, and eventually became
        the web-focused project you see today: Verbatims. Each rebuild taught us about
        discoverability, moderation, and the importance of good metadata.
      </p>
    </section>

    <section>
      <h2>What you can do</h2>
      <ul>
        <li>Browse and search by topic, author, keyword, or reference. Relevant results surface fast, with smart ranking.</li>
        <li>Save favorites and build collections — keep what resonates close and organized.</li>
        <li>Get a daily quote notification tailored to your interests and recent activity.</li>
        <li>Share beautifully formatted cards to social media, or copy clean text with attribution.</li>
        <li>Contribute your own quotes with sources. Submissions go through moderation for accuracy and clarity.</li>
      </ul>
    </section>

    <section>
      <h2>Curation & accuracy</h2>
      <p>
        Quotes are sourced from primary texts when possible, reputable anthologies, scholarly databases, and trusted archives. Each quote includes attribution and, where available, reference details.
      </p>
      <p>
        We verify wording and authorship before publishing. When a quote is widely misattributed, we either correct it with a note or decline it. We also welcome community reports with citations — corrections help everyone.
      </p>
      <p>
        Editorial guidelines prioritize clarity, context, and respectful representation. Paraphrases are labeled; ellipses and edits are clearly indicated.
      </p>
    </section>

    <section>
      <h2>Community & contribution</h2>
      <ul>
        <li>Submit quotes with sources directly from quote pages or your dashboard.</li>
        <li>Report issues (typos, attribution, duplicates) using the “Report” action on any quote.</li>
        <li>Suggest features and improvements from the settings “Feedback” link.</li>
        <li>Participate respectfully — celebrate ideas, not individuals. Harassment, hate, or plagiarism isn't allowed.</li>
      </ul>
    </section>

    <section>
      <h2>Accessibility & inclusivity</h2>
      <p>
        We design for readability and keyboard navigation, with high-contrast themes and scalable type. The interface supports screen readers with semantic landmarks and descriptive labels.
      </p>
      <p>
        Language is for everyone: we're expanding multilingual support and prioritizing diverse voices across cultures, eras, and perspectives. You'll find classic thinkers alongside contemporary authors, poets, scientists, and activists.
      </p>
    </section>

    <section>
      <h2>Privacy & data</h2>
      <p>
        We keep it simple. We store the essentials to make the app work for you: your account info, favorites, collections, language preferences, and notification settings. Usage data may be aggregated to improve search and recommendations.
      </p>
      <p>
        We don’t sell personal data. For full details, see our
        <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
        and
        <NuxtLink to="/terms">Terms</NuxtLink>.
      </p>
    </section>

    <section>
      <h2>Roadmap highlights</h2>
      <ul>
        <li>Richer author pages with timelines, references, and related works.</li>
        <li>Advanced filters: sources, eras, movements, and reading level.</li>
        <li>Scheduled shares and export options for newsletters and slides.</li>
        <li>Better multilingual search with transliteration support.</li>
        <li>Opt‑in AI suggestions trained on curated, cited sources.</li>
      </ul>
    </section>

    <section>
      <h2>Tech stack</h2>
      <p>
        Verbatims is built with modern web tooling. The main pieces include:
      </p>
      <ul>
        <li>Nuxt 3 (Vue 3) for the application framework and server rendering.</li>
        <li>Pinia for application state management.</li>
        <li>UnoCSS + UNA UI for utility-first styling and UI primitives.</li>
        <li>Nuxt Image for image handling and optimization.</li>
        <li>Server-side features powered by Nitro; Cloudflare / Wrangler used in CI/deploy workflows.</li>
      </ul>
      <p class="text-sm text-gray-500">(See <code>package.json</code> and <code>nuxt.config.ts</code> for exact versions.)</p>
    </section>

    <section>
      <h2>Suggestions & next steps</h2>
      <p>
        A few ideas I'd like to explore next:
      </p>
      <ul>
        <li>Richer export options (CSV, JSON, and print-ready quote cards).</li>
        <li>Improved author pages with timelines and source documents.</li>
        <li>Multilingual UI and search improvements for non-Latin scripts.</li>
        <li>Opt-in personalization and a gentle recommendation layer.</li>
      </ul>
    </section>

    <section>
      <h2>Contact & support</h2>
      <p>
        Questions, ideas, or found a hiccup? We'd love to hear from you.
        Open a GitHub issue or use the feedback form in the header <UIcon name="i-ph-flag" class="mb-1" /> .
      </p>
      <div>
        <UButton 
          leading="i-ph-bug" label="Open a GitHub issue" 
          btn="soft" size="sm" 
          to="https://github.com/rootasjey/verbatims/issues" target="_blank" 
        />
      </div>
      <p class="font-medium mt-6">Built with care, curiosity, and plenty of coffee.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { version } from '@/types/version';
import { useMobileDetection, useLayoutSwitching } from '~/composables/useMobileDetection'

definePageMeta({
  // Use a stable initial layout for SSR/hydration; we'll switch after Nuxt is ready on client
  layout: 'default'
})

useHead({
  title: 'About \u2022 Verbatims',
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: 'Learn about Verbatims, its purpose, history, community, and the tech stack behind it.' },
  ],
})

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

/* Section separation with a gentle border (matches Privacy) */
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