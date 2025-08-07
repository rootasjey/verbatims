<template>
  <main class="container mx-auto px-4 py-10 md:py-14 prose prose-invert max-w-3xl">
    <header class="mb-8">
      <h1 class="text-3xl md:text-4xl font-semibold tracking-tight">
        About Verbatims
      </h1>
      <p class="mt-3 text-base md:text-lg text-gray-300">
        A home for timeless words — curated, searchable, and crafted for daily inspiration.
      </p>
    </header>

    <section aria-labelledby="mission" class="mb-10">
      <h2 id="mission" class="text-2xl font-semibold">Our mission</h2>
      <p class="mt-3">
        Verbatims exists to spark reflection through the right words at the right moment. We gather wisdom from great thinkers across cultures and eras so you can discover, save, and share quotes that inspire action, deepen learning, and brighten your day.
      </p>
    </section>

    <section aria-labelledby="origin" class="mb-10">
      <h2 id="origin" class="text-2xl font-semibold">How it started</h2>
      <p class="mt-3">
        We love note-taking and collecting quotes — but keeping them scattered in docs and screenshots made them hard to find, verify, and share. Verbatims began as a simple tool to bring quotes, sources, and context together in one place.
      </p>
      <p class="mt-3">
        The vision: a thoughtful, accurate, and inviting library where you can browse by topic or author, build personal collections, and get gentle nudges to revisit ideas that matter to you.
      </p>
    </section>

    <section aria-labelledby="features" class="mb-10">
      <h2 id="features" class="text-2xl font-semibold">What you can do</h2>
      <ul class="mt-4 grid gap-3 list-none p-0">
        <li class="flex items-start gap-3">
          <span class="i-heroicons-magnifying-glass-20-solid text-primary mt-1"></span>
          <p>
            Browse and search by topic, author, keyword, or reference. Relevant results surface fast, with smart ranking.
          </p>
        </li>
        <li class="flex items-start gap-3">
          <span class="i-heroicons-heart-20-solid text-rose-400 mt-1"></span>
          <p>
            Save favorites and build collections — keep what resonates close and organized.
          </p>
        </li>
        <li class="flex items-start gap-3">
          <span class="i-heroicons-bell-alert-20-solid text-amber-400 mt-1"></span>
          <p>
            Get a daily quote notification tailored to your interests and recent activity.
          </p>
        </li>
        <li class="flex items-start gap-3">
          <span class="i-heroicons-share-20-solid text-primary mt-1"></span>
          <p>
            Share beautifully formatted cards to social media, or copy clean text with attribution.
          </p>
        </li>
        <li class="flex items-start gap-3">
          <span class="i-heroicons-sparkles-20-solid text-emerald-400 mt-1"></span>
          <p>
            Contribute your own quotes with sources. Submissions go through moderation for accuracy and clarity.
          </p>
        </li>
        <li class="flex items-start gap-3">
          <span class="i-heroicons-adjustments-horizontal-20-solid text-sky-400 mt-1"></span>
          <p>
            Personalize your feed. Optional AI‑powered recommendations help you discover adjacent topics and authors.
          </p>
        </li>
      </ul>
    </section>

    <section aria-labelledby="curation" class="mb-10">
      <h2 id="curation" class="text-2xl font-semibold">Curation & accuracy</h2>
      <p class="mt-3">
        Quotes are sourced from primary texts when possible, reputable anthologies, scholarly databases, and trusted archives. Each quote includes attribution and, where available, reference details.
      </p>
      <p class="mt-3">
        We verify wording and authorship before publishing. When a quote is widely misattributed, we either correct it with a note or decline it. We also welcome community reports with citations — corrections help everyone.
      </p>
      <p class="mt-3">
        Editorial guidelines prioritize clarity, context, and respectful representation. Paraphrases are labeled; ellipses and edits are clearly indicated.
      </p>
    </section>

    <section aria-labelledby="community" class="mb-10">
      <h2 id="community" class="text-2xl font-semibold">Community & contribution</h2>
      <ul class="mt-4 list-disc pl-6 space-y-2">
        <li>Submit quotes with sources directly from quote pages or your dashboard.</li>
        <li>Report issues (typos, attribution, duplicates) using the “Report” action on any quote.</li>
        <li>Suggest features and improvements from the settings “Feedback” link.</li>
        <li>Participate respectfully — celebrate ideas, not individuals. Harassment, hate, or plagiarism isn’t allowed.</li>
      </ul>
    </section>

    <section aria-labelledby="accessibility" class="mb-10">
      <h2 id="accessibility" class="text-2xl font-semibold">Accessibility & inclusivity</h2>
      <p class="mt-3">
        We design for readability and keyboard navigation, with high‑contrast themes and scalable type. The interface supports screen readers with semantic landmarks and descriptive labels.
      </p>
      <p class="mt-3">
        Language is for everyone: we’re expanding multilingual support and prioritizing diverse voices across cultures, eras, and perspectives. You’ll find classic thinkers alongside contemporary authors, poets, scientists, and activists.
      </p>
    </section>

    <section aria-labelledby="privacy" class="mb-10">
      <h2 id="privacy" class="text-2xl font-semibold">Privacy & data</h2>
      <p class="mt-3">
        We keep it simple. We store the essentials to make the app work for you: your account info, favorites, collections, language preferences, and notification settings. Usage data may be aggregated to improve search and recommendations.
      </p>
      <p class="mt-3">
        We don’t sell personal data. For full details, see our
        <NuxtLink to="/privacy" class="text-primary underline-offset-2 hover:underline">Privacy Policy</NuxtLink>
        and
        <NuxtLink to="/terms" class="text-primary underline-offset-2 hover:underline">Terms</NuxtLink>.
      </p>
    </section>

    <section aria-labelledby="roadmap" class="mb-10">
      <h2 id="roadmap" class="text-2xl font-semibold">Roadmap highlights</h2>
      <ul class="mt-4 list-disc pl-6 space-y-2">
        <li>Richer author pages with timelines, references, and related works.</li>
        <li>Advanced filters: sources, eras, movements, and reading level.</li>
        <li>Scheduled shares and export options for newsletters and slides.</li>
        <li>Better multilingual search with transliteration support.</li>
        <li>Opt‑in AI suggestions trained on curated, cited sources.</li>
      </ul>
    </section>

    <section aria-labelledby="contact" class="mb-4">
      <h2 id="contact" class="text-2xl font-semibold">Contact & support</h2>
      <p class="mt-3">
        Questions, ideas, or found a hiccup? We’d love to hear from you.
      </p>
      <ul class="mt-4 list-none p-0 space-y-2">
        <li>
          <span class="i-heroicons-envelope-20-solid text-primary mr-2"></span>
          <a href="mailto:support@verbatims.app" class="underline underline-offset-2 hover:no-underline">
            support@verbatims.app
          </a>
        </li>
        <li>
          <span class="i-heroicons-question-mark-circle-20-solid text-primary mr-2"></span>
          <NuxtLink to="/help" class="underline underline-offset-2 hover:no-underline">
            Help Center
          </NuxtLink>
        </li>
        <li>
          <span class="i-heroicons-chat-bubble-left-right-20-solid text-primary mr-2"></span>
          <NuxtLink to="/feedback" class="underline underline-offset-2 hover:no-underline">
            Send feedback
          </NuxtLink>
        </li>
      </ul>
    </section>

    <footer class="mt-10 pt-6 border-t border-gray-800 text-sm text-gray-400">
      Built with care, curiosity, and lots of dog‑eared pages.
    </footer>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: 'About • Verbatims',
  meta: [
    { name: 'description', content: 'Learn about Verbatims — our mission, curation approach, community guidelines, privacy practices, and what’s coming next.' },
  ],
})
</script>

<style scoped>
/* Ensure icon size alignment with UnoCSS icon presets if used */
[class^="i-heroicons-"],
[class*=" i-heroicons-"] {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}
</style>