<template>
  <div class="min-h-screen">
    <div class="about-content mx-auto max-w-6xl px-6 pb-16 pt-12 sm:px-8 md:pt-28 lg:px-10">
      <section class="about-hero grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-16">
        <header id="about-top" class="about-heading">
          <h1 class="legal-page-title font-serif text-4xl font-400 leading-tight tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-5xl lg:text-[4rem]">
            {{ $t('about_title') }}
          </h1>
          <p class="mt-4 max-w-3xl font-sans text-lg leading-relaxed text-stone-700 dark:text-stone-300 md:mt-5 md:text-xl">
            {{ $t('about_subtitle') }}
          </p>
          <div class="mt-4 mb-8">
            <NBadge badge="outline-gray" size="sm" :label="$ts('about_version_label', { v: version })" class="px-4 font-600 font-sans" rounded="6" />
          </div>
        <div class="about-copy max-w-[60ch] space-y-4">
          <p class="about-lede">{{ $t('about_intro_1') }}</p>
          <p class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed">{{ $t('about_intro_2') }}</p>
          <p class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed">{{ $t('about_intro_3') }}</p>
        </div>
        </header>

        <aside class="about-profile flex flex-col items-start gap-5 lg:pt-2">
          <img
            src="/images/profile-picture.png"
            :alt="$ts('about_profile_alt')"
            width="120"
            height="120"
            role="button"
            tabindex="0"
            :aria-label="$ts('about_profile_aria')"
            @click="openProfilePreview"
            @keyup.enter.prevent="openProfilePreview"
            @keyup.space.prevent="openProfilePreview"
            :class="['aspect-square h-[7.5rem] w-[7.5rem] rounded-2xl object-cover grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer', { 'profile-zoom': !showProfilePreview }]"
          />

          <div class="flex flex-wrap items-center gap-2">
            <NTooltip :content="$ts('about_social_github')">
              <NButton icon label="i-ph-github-logo" btn="ghost-gray" size="sm" to="https://github.com/rootasjey" target="_blank" class="decoration-none" />
            </NTooltip>
            <NTooltip :content="$ts('about_social_twitter')">
              <NButton icon label="i-ph-twitter-logo" btn="ghost-gray" size="sm" to="https://twitter.com/rootasjey" target="_blank" class="decoration-none" />
            </NTooltip>
            <NTooltip :content="$ts('about_social_bluesky')">
              <NButton icon label="i-ph-butterfly" btn="ghost-gray" size="sm" to="https://bsky.app/profile/corpinot.bsky.social" target="_blank" class="decoration-none" />
            </NTooltip>
            <NTooltip :content="$ts('about_social_linkedin')">
              <NButton icon label="i-ph-linkedin-logo" btn="ghost-gray" size="sm" to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" class="decoration-none" />
            </NTooltip>
            <NTooltip :content="$ts('about_social_facebook')">
              <NButton icon label="i-ph-facebook-logo" btn="ghost-gray" size="sm" to="https://www.facebook.com/jeremiecorpinot/" target="_blank" class="decoration-none" />
            </NTooltip>
            <NTooltip :content="$ts('about_social_instagram')">
              <NButton icon label="i-ph-instagram-logo" btn="ghost-gray" size="sm" to="https://www.instagram.com/rootasjey/" target="_blank" class="decoration-none" />
            </NTooltip>
          </div>
          <figure class="about-art mt-2">
          <img
            src="/images/more-than-words.jpeg"
            :alt="$ts('about_drawing_alt')"
            role="button"
            tabindex="0"
            :aria-label="$ts('about_drawing_aria')"
            @click="openDrawingPreview"
            @keyup.enter.prevent="openDrawingPreview"
            @keyup.space.prevent="openDrawingPreview"
            class="drawing-zoom mx-auto w-full max-w-[15rem] rounded-2 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
          />
          <figcaption class="mt-3 max-w-[15rem] text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {{ $t('about_drawing_caption') }}
            <a href="https://zimablue.cc" target="_blank" rel="noopener noreferrer" class="font-600 text-stone-800 hover:underline dark:text-stone-200">{{ $t('about_drawing_link') }}</a>.
          </figcaption>
          </figure>
        </aside>
      </section>

      <div class="about-reading mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-16">
        <LegalContents
          class="about-toc lg:sticky lg:top-24"
          :label="$ts('legal_contents')"
          :items="aboutContentsItems"
          :active-id="activeAboutSectionId"
        />

        <main class="about-sections min-w-0">

      <!-- Section divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Purpose -->
      <section class="mb-16">
        <h2 id="about-purpose" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_purpose_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_purpose_1') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- A short history -->
      <section class="mb-16">
        <h2 id="about-history" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_history_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_history_1') }}</p>
          <p>{{ $t('about_history_2') }}</p>
          <p>{{ $t('about_history_3') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- What you can do -->
      <section class="mb-16">
        <h2 id="about-features" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_features_title') }}</h2>
        <ul class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>{{ $t('about_features_1') }}</li>
          <li>{{ $t('about_features_2') }}</li>
          <li>{{ $t('about_features_3') }}</li>
          <li>{{ $t('about_features_4') }}</li>
          <li>{{ $t('about_features_5') }}</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Curation & accuracy -->
      <section class="mb-16">
        <h2 id="about-curation" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_curation_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_curation_1') }}</p>
          <p>{{ $t('about_curation_2') }}</p>
          <p>{{ $t('about_curation_3') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Community & contribution -->
      <section class="mb-16">
        <h2 id="about-community" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_community_title') }}</h2>
        <ul class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>{{ $t('about_community_1') }}</li>
          <li>{{ $t('about_community_2') }}</li>
          <li>{{ $t('about_community_3') }}</li>
          <li>{{ $t('about_community_4') }}</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Accessibility & inclusivity -->
      <section class="mb-16">
        <h2 id="about-accessibility" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_accessibility_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_accessibility_1') }}</p>
          <p>{{ $t('about_accessibility_2') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Privacy & data -->
      <section class="mb-16">
        <h2 id="about-privacy" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_privacy_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_privacy_1') }}</p>
          <p>
            {{ $t('about_privacy_2') }}
            <NuxtLink to="/privacy" class="font-600 hover:underline text-gray-700 dark:text-gray-300">{{ $t('about_privacy_policy_link') }}</NuxtLink>
            and
            <NuxtLink to="/terms" class="font-600 hover:underline text-gray-700 dark:text-gray-300">{{ $t('about_terms_link') }}</NuxtLink>.
          </p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Roadmap highlights -->
      <section class="mb-16">
        <h2 id="about-roadmap" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_roadmap_title') }}</h2>
        <ul class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>{{ $t('about_roadmap_1') }}</li>
          <li>{{ $t('about_roadmap_2') }}</li>
          <li>{{ $t('about_roadmap_3') }}</li>
          <li>{{ $t('about_roadmap_4') }}</li>
          <li>{{ $t('about_roadmap_5') }}</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Tech stack -->
      <section class="mb-16">
        <h2 id="about-tech" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-2">{{ $t('about_tech_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_tech_intro') }}</p>
          <ul class="list-disc font-600 pl-7 space-y-2 py-6">
            <li>{{ $t('about_tech_1') }}</li>
            <li>{{ $t('about_tech_2') }}</li>
            <li>{{ $t('about_tech_3') }}</li>
            <li>{{ $t('about_tech_4') }}</li>
            <li>{{ $t('about_tech_5') }}</li>
            <li>{{ $t('about_tech_6') }}</li>
            <li>{{ $t('about_tech_7') }}</li>
          </ul>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('about_tech_note', { file1: 'package.json', file2: 'nuxt.config.ts' }) }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Suggestions & next steps -->
      <section class="mb-16">
        <h2 id="about-suggestions" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_suggestions_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_suggestions_intro') }}</p>
          <ul class="list-disc pl-5 space-y-2">
            <li>{{ $t('about_suggestions_1') }}</li>
            <li>{{ $t('about_suggestions_2') }}</li>
            <li>{{ $t('about_suggestions_3') }}</li>
            <li>{{ $t('about_suggestions_4') }}</li>
          </ul>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Contact & support -->
      <section class="mb-16">
        <h2 id="about-contact" class="font-serif text-2xl md:text-[1.625rem] font-600 mb-5">{{ $t('about_contact_title') }}</h2>
        <div class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>
            {{ $t('about_contact_1') }} <NIcon name="i-ph-flag" class="mb-1 align-middle inline-block" />.
          </p>
        </div>
        <div>
          <NButton
            leading="i-ph-bug"
            trailing="i-ph-arrow-up-right"
            :label="$ts('about_contact_button')"
            btn="outline-gray"
            size="sm"
            to="https://github.com/rootasjey/verbatims/issues" target="_blank"
            class="mt-6 decoration-none"
          />
        </div>
        <div class="mt-8">
          <a
            :href="`mailto:${aboutContactEmail}`"
            class="font-body text-lg font-200 text-gray-700 dark:text-gray-300 hover:opacity-80 underline decoration-dotted underline-offset-4"
          >
            {{ aboutContactEmail }}
          </a>
        </div>
        <p class="font-body font-medium text-gray-700 dark:text-gray-300 mt-8">{{ $t('about_contact_tagline') }}</p>
      </section>
        </main>
      </div>
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
import { useVerbatimsSeo } from '~/composables/useSeo'
const { $t, $ts } = useI18n()

const aboutContactEmail = 'support@verbatims.cc'

const config = useRuntimeConfig()
const version = config.public.appVersion
definePageMeta({
  layout: 'default'
})

useVerbatimsSeo({
  title: $ts('about_meta_title'),
  description: $ts('about_meta_desc'),
  imagePath: '/api/og/pages/about.png',
  imageAlt: 'About Verbatims, a home for memorable quotes and their sources',
})

const showProfilePreview = ref(false)
const showDrawingPreview = ref(false)

const aboutSectionEntries = [
  { id: 'about-purpose', key: 'about_purpose_title' },
  { id: 'about-history', key: 'about_history_title' },
  { id: 'about-features', key: 'about_features_title' },
  { id: 'about-curation', key: 'about_curation_title' },
  { id: 'about-community', key: 'about_community_title' },
  { id: 'about-accessibility', key: 'about_accessibility_title' },
  { id: 'about-privacy', key: 'about_privacy_title' },
  { id: 'about-roadmap', key: 'about_roadmap_title' },
  { id: 'about-tech', key: 'about_tech_title' },
  { id: 'about-suggestions', key: 'about_suggestions_title' },
  { id: 'about-contact', key: 'about_contact_title' }
] as const

const aboutContentsItems = computed(() => aboutSectionEntries.map(item => ({
  id: item.id,
  label: $ts(item.key),
})))

const activeAboutSectionId = ref('')
let aboutScrollFrame = 0

function syncActiveAboutSection() {
  if (aboutScrollFrame) return

  aboutScrollFrame = window.requestAnimationFrame(() => {
    aboutScrollFrame = 0
    const isAtPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    const currentSection = isAtPageEnd
      ? aboutSectionEntries.at(-1)
      : [...aboutSectionEntries]
          .map(item => ({ item, element: document.getElementById(item.id) }))
          .filter(({ element }) => element && element.getBoundingClientRect().top <= 144)
          .at(-1)?.item

    activeAboutSectionId.value = currentSection?.id ?? ''
    const nextHash = currentSection ? `#${currentSection.id}` : ''
    if (window.location.hash !== nextHash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    }
  })
}

function syncActiveAboutSectionFromHash() {
  const id = window.location.hash.slice(1)
  if (aboutSectionEntries.some(item => item.id === id)) {
    activeAboutSectionId.value = id
    return
  }
  syncActiveAboutSection()
}

onMounted(() => {
  window.addEventListener('scroll', syncActiveAboutSection, { passive: true })
  window.addEventListener('hashchange', syncActiveAboutSectionFromHash)
  window.addEventListener('popstate', syncActiveAboutSectionFromHash)
  syncActiveAboutSection()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncActiveAboutSection)
  window.removeEventListener('hashchange', syncActiveAboutSectionFromHash)
  window.removeEventListener('popstate', syncActiveAboutSectionFromHash)
  if (aboutScrollFrame) window.cancelAnimationFrame(aboutScrollFrame)
})

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
.about-content .font-200 {
  color: #44403c;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1.0625rem;
  font-weight: 400;
  line-height: 1.7;
}

:global(html.dark) .about-content .font-200 {
  color: #e7e5e4;
}

.about-copy > .about-lede {
  color: #292524;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.375rem, 1.2rem + 0.45vw, 1.75rem);
  font-weight: 400;
  line-height: 1.45;
}

:global(html.dark) .about-copy > .about-lede {
  color: #f5f5f4;
}

.about-content :deep(h2) {
  scroll-margin-top: 7rem;
}

.about-toc {
  max-height: calc(100dvh - 7rem);
  overflow-y: auto;
  scrollbar-width: thin;
  padding-left: 1rem;
  border-left: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  grid-column: 2;
  grid-row: 1;
}

.about-toc-heading {
  margin: 0 0 0.75rem;
  font-family: 'Nunito', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  opacity: 0.8;
}

.about-toc-link {
  display: block;
  padding: 0.35rem 0;
  color: inherit;
  font-size: 0.8125rem;
  line-height: 1.4;
  opacity: 0.72;
  text-decoration: none;
  text-underline-offset: 0.2em;
  transition: opacity 160ms ease, text-decoration-color 160ms ease;
}

.about-toc-link:hover,
.about-toc-link:focus-visible {
  opacity: 1;
  text-decoration: underline;
}

.about-toc-link[aria-current='location'] {
  font-weight: 650;
  opacity: 1;
}

.about-toc-link:focus-visible {
  border-radius: 2px;
  outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
  outline-offset: 3px;
}

.about-sections {
  grid-column: 1;
  grid-row: 1;
}

@media (max-width: 1023px) {
  .about-toc {
    position: static;
    max-height: none;
    padding: 0 0 1.25rem;
    border-left: 0;
    grid-column: auto;
    grid-row: auto;
  }

  .about-toc ol {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .about-sections {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 640px) {
  .about-toc ol {
    grid-template-columns: minmax(0, 1fr);
  }
}

:global(.dark .about-content .font-200) {
  color: #e7e5e4;
}

:global(.dark .about-copy > .about-lede) {
  color: #f5f5f4;
}

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

::view-transition-group(profile-zoom) {
  z-index: 2;
}

::view-transition-group(drawing-zoom) {
  z-index: 1;
}
</style>
