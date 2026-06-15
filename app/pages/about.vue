<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        About
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        A home for timeless words: curated, searchable, and crafted for daily inspiration.
      </p>
      <div class="flex justify-center mt-4">
        <NBadge badge="outline-gray" size="sm" :label="`Version ${version}`" class="px-4 font-600 font-sans" rounded="6" />
      </div>
    </header>

    <div class="mt-16 max-w-4xl mx-auto px-8 pb-16">
      <section class="mb-16">
        <div class="flex justify-center mb-6">
          <img
            src="/images/profile-picture.png"
            alt="Photo of Jérémie, the creator of Verbatims"
            width="120"
            height="120"
            role="button"
            tabindex="0"
            aria-label="Open profile picture preview"
            @click="openProfilePreview"
            @keyup.enter.prevent="openProfilePreview"
            @keyup.space.prevent="openProfilePreview"
            :class="['rounded-full grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer', { 'profile-zoom': !showProfilePreview }]"
          />
        </div>

        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto space-y-4">
          <p>
            I'm Jérémie, a software engineer and lifelong quote collector.
            I built Verbatims to solve a personal problem: how to keep track of the many quotes I love, along with their sources and context, in a way that makes them easy to find and share.
            I have a background in building web applications and a passion for thoughtful design, so this project is a blend of my interests in technology, literature, and curation.
          </p>
        </div>

        <div class="flex justify-center items-center gap-3 mt-12">
          <NTooltip content="GitHub">
            <NButton icon label="i-ph-github-logo" btn="outline-gray" size="sm" to="https://github.com/rootasjey" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip content="Twitter (X)">
            <NButton icon label="i-ph-twitter-logo" btn="outline-gray" size="sm" to="https://twitter.com/rootasjey" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip content="Bluesky">
            <NButton icon label="i-ph-butterfly" btn="outline-gray" size="sm" to="https://bsky.app/profile/corpinot.bsky.social" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip content="LinkedIn">
            <NButton icon label="i-ph-linkedin-logo" btn="outline-gray" size="sm" to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip content="Facebook">
            <NButton icon label="i-ph-facebook-logo" btn="outline-gray" size="sm" to="https://www.facebook.com/jeremiecorpinot/" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip content="Instagram">
            <NButton icon label="i-ph-instagram-logo" btn="outline-gray" size="sm" to="https://www.instagram.com/rootasjey/" target="_blank" class="decoration-none" />
          </NTooltip>
        </div>

        <div class="mt-16 text-center">
          <img
            src="/images/more-than-words.jpeg"
            alt="More than words"
            role="button"
            tabindex="0"
            aria-label="Open drawing preview"
            @click="openDrawingPreview"
            @keyup.enter.prevent="openDrawingPreview"
            @keyup.space.prevent="openDrawingPreview"
            class="drawing-zoom rounded-2 grayscale hover:grayscale-0 transition-all duration-300 mx-auto cursor-pointer"
          />
          <p class="text-sm italic text-gray-500 dark:text-gray-400 mt-3">
            A drawing I did titled "More than Words" inspired by the Anime "Jujutsu Kaisen".
            See more of my art on
            <a href="https://zimablue.cc" target="_blank" class="font-600 hover:underline text-gray-700 dark:text-gray-300">Zima Blue</a>.
          </p>
        </div>
      </section>

      <!-- Section divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Purpose -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Purpose</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            Verbatims is built to share quotes with people in an easy and fun way. The core idea is simple:
            make discovery, attribution, and sharing delightful. Whether you're hunting for a line to
            brighten someone's day, building a collection for a talk, or researching a citation, Verbatims
            aims to make the journey smooth and reliable.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- A short history -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">A short history</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            We love note-taking and collecting quotes, but keeping them scattered in docs and screenshots made them hard to find, verify, and share. Verbatims began as a simple tool to bring quotes, sources, and context together in one place.
          </p>
          <p>
            The vision: a thoughtful, accurate, and inviting library where you can browse by topic or author, build personal collections, and get gentle nudges to revisit ideas that matter to you.
          </p>
          <p>
            This project has gone through multiple re-dos. It started as a Windows Phone app called
            <i>Citamour</i>, evolved through several prototypes and rewrites, and eventually became
            the web-focused project you see today: Verbatims. Each rebuild taught us about
            discoverability, moderation, and the importance of good metadata.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- What you can do -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">What you can do</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>Browse and search by topic, author, keyword, or reference. Relevant results surface fast, with smart ranking.</li>
          <li>Save favorites and build collections: keep what resonates close and organized.</li>
          <li>Get a daily quote notification tailored to your interests and recent activity.</li>
          <li>Share beautifully formatted cards to social media, or copy clean text with attribution.</li>
          <li>Contribute your own quotes with sources. Submissions go through moderation for accuracy and clarity.</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Curation & accuracy -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Curation &amp; accuracy</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            Quotes are sourced from primary texts when possible, reputable anthologies, scholarly databases, and trusted archives. Each quote includes attribution and, where available, reference details.
          </p>
          <p>
            We verify wording and authorship before publishing. When a quote is widely misattributed, we either correct it with a note or decline it. We also welcome community reports with citations. Corrections help everyone.
          </p>
          <p>
            Editorial guidelines prioritize clarity, context, and respectful representation. Paraphrases are labeled; ellipses and edits are clearly indicated.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Community & contribution -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Community &amp; contribution</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>Submit quotes with sources directly from quote pages or your dashboard.</li>
          <li>Report issues (typos, attribution, duplicates) using the "Report" action on any quote.</li>
          <li>Suggest features and improvements from the settings "Feedback" link.</li>
          <li>Participate respectfully: celebrate ideas, not individuals. Harassment, hate, or plagiarism isn't allowed.</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Accessibility & inclusivity -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Accessibility &amp; inclusivity</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            We design for readability and keyboard navigation, with high-contrast themes and scalable type. The interface supports screen readers with semantic landmarks and descriptive labels.
          </p>
          <p>
            Language is for everyone: we're expanding multilingual support and prioritizing diverse voices across cultures, eras, and perspectives. You'll find classic thinkers alongside contemporary authors, poets, scientists, and activists.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Privacy & data -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Privacy &amp; data</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            We keep it simple. We store the essentials to make the app work for you: your account info, favorites, collections, language preferences, and notification settings. Usage data may be aggregated to improve search and recommendations.
          </p>
          <p>
            We don't sell personal data. For full details, see our
            <NuxtLink to="/privacy" class="font-600 hover:underline text-gray-700 dark:text-gray-300">Privacy Policy</NuxtLink>
            and
            <NuxtLink to="/terms" class="font-600 hover:underline text-gray-700 dark:text-gray-300">Terms</NuxtLink>.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Roadmap highlights -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Roadmap highlights</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>Richer author pages with timelines, references, and related works.</li>
          <li>Advanced filters: sources, eras, movements, and reading level.</li>
          <li>Scheduled shares and export options for newsletters and slides.</li>
          <li>Better multilingual search with transliteration support.</li>
          <li>Opt-in AI suggestions trained on curated, cited sources.</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Tech stack -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-2">Tech stack</h2>
        <div class="font-body text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            Verbatims is built with modern web tooling. The main pieces include:
          </p>
          <ul class="list-disc font-600 pl-7 space-y-2 py-6">
            <li>Nuxt 3 (Vue 3) for the application framework and server rendering.</li>
            <li>Pinia for application state management.</li>
            <li>UnoCSS + UNA UI for utility-first styling and UI primitives.</li>
            <li>Nuxt Image for image handling and optimization.</li>
            <li>Server-side features powered by Nitro; Cloudflare / Wrangler used in CI/deploy workflows.</li>
          </ul>
          <p class="text-sm text-gray-500 dark:text-gray-400">(See <code class="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 rounded">package.json</code> and <code class="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 rounded">nuxt.config.ts</code> for exact versions.)</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Suggestions & next steps -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Suggestions &amp; next steps</h2>
        <div class="font-body text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>A few ideas I'd like to explore next:</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Richer export options (CSV, JSON, and print-ready quote cards).</li>
            <li>Improved author pages with timelines and source documents.</li>
            <li>Multilingual UI and search improvements for non-Latin scripts.</li>
            <li>Opt-in personalization and a gentle recommendation layer.</li>
          </ul>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Contact & support -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">Contact &amp; support</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            Questions, ideas, or found a hiccup? We'd love to hear from you.
            Open a GitHub issue or use the feedback form in the header <NIcon name="i-ph-flag" class="mb-1 align-middle inline-block" />.
          </p>
        </div>
        <div>
          <NButton
            leading="i-ph-bug"
            trailing="i-ph-arrow-up-right"
            label="Open a GitHub issue"
            btn="outline-gray"
            size="sm"
            to="https://github.com/rootasjey/verbatims/issues" target="_blank"
            class="mt-6 decoration-none"
          />
        </div>
        <p class="font-body font-medium text-gray-700 dark:text-gray-300 mt-8">Built with care, curiosity, and plenty of coffee.</p>
      </section>
    </div>

    <ClientOnly>
      <ImagePreview
        v-model="showProfilePreview"
        src="/images/profile-picture.png"
        alt="Photo of Jérémie, the creator of Verbatims"
        img-class="profile-zoom"
        :close-on-scroll="true"
        :mask-closable="true"
      />
    </ClientOnly>

    <ClientOnly>
      <ImagePreview
        v-model="showDrawingPreview"
        src="/images/more-than-words.jpeg"
        alt="More than words"
        img-class="drawing-zoom"
        :close-on-scroll="true"
        :mask-closable="true"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const version = config.public.appVersion
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'About \u2022 Verbatims',
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: 'Learn about Verbatims, its purpose, history, community, and the tech stack behind it.' },
  ],
})

const showProfilePreview = ref(false)
const showDrawingPreview = ref(false)

const openProfilePreview = () => {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      showProfilePreview.value = true
      return nextTick()
    })
  } else {
    showProfilePreview.value = true
  }
}

const openDrawingPreview = () => {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      showDrawingPreview.value = true
      return nextTick()
    })
  } else {
    showDrawingPreview.value = true
  }
}

// Restore focus when preview closes
watch(showProfilePreview, (open, prev) => {
  if (prev && !open) {
    nextTick(() => {
      const el = document.querySelector<HTMLElement>('[aria-label="Open profile picture preview"]')
      el?.focus()
    })
  }
})

watch(showDrawingPreview, (open, prev) => {
  if (prev && !open) {
    nextTick(() => {
      const el = document.querySelector<HTMLElement>('[aria-label="Open drawing preview"]')
      el?.focus()
    })
  }
})
</script>

<style scoped>
.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.grayscale:hover {
  filter: grayscale(0%);
  transform: scale(1.03);
}
</style>

<style>
.profile-zoom {
  view-transition-name: profile-zoom;
  transform: translateZ(0);
}

.drawing-zoom {
  view-transition-name: drawing-zoom;
  transform: translateZ(0);
}
</style>
