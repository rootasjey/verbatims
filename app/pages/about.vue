<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        {{ $t('about_title') }}
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        {{ $t('about_subtitle') }}
      </p>
      <div class="flex justify-center mt-4">
        <NBadge badge="outline-gray" size="sm" :label="$ts('about_version_label', { v: version })" class="px-4 font-600 font-sans" rounded="6" />
      </div>
    </header>

    <div class="mt-16 max-w-4xl mx-auto px-8 pb-16">
      <section class="mb-16">
        <div class="flex justify-center mb-6">
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
            :class="['rounded-full grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer', { 'profile-zoom': !showProfilePreview }]"
          />
        </div>

        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto space-y-4">
          <p>{{ $t('about_intro_1') }}</p>
          <p>{{ $t('about_intro_2') }}</p>
          <p>{{ $t('about_intro_3') }}</p>
        </div>

        <div class="flex justify-center items-center gap-3 mt-12">
          <NTooltip :content="$ts('about_social_github')">
            <NButton icon label="i-ph-github-logo" btn="outline-gray" size="sm" to="https://github.com/rootasjey" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip :content="$ts('about_social_twitter')">
            <NButton icon label="i-ph-twitter-logo" btn="outline-gray" size="sm" to="https://twitter.com/rootasjey" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip :content="$ts('about_social_bluesky')">
            <NButton icon label="i-ph-butterfly" btn="outline-gray" size="sm" to="https://bsky.app/profile/corpinot.bsky.social" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip :content="$ts('about_social_linkedin')">
            <NButton icon label="i-ph-linkedin-logo" btn="outline-gray" size="sm" to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip :content="$ts('about_social_facebook')">
            <NButton icon label="i-ph-facebook-logo" btn="outline-gray" size="sm" to="https://www.facebook.com/jeremiecorpinot/" target="_blank" class="decoration-none" />
          </NTooltip>
          <NTooltip :content="$ts('about_social_instagram')">
            <NButton icon label="i-ph-instagram-logo" btn="outline-gray" size="sm" to="https://www.instagram.com/rootasjey/" target="_blank" class="decoration-none" />
          </NTooltip>
        </div>

        <div class="mt-16 text-center">
          <img
            src="/images/more-than-words.jpeg"
            :alt="$ts('about_drawing_alt')"
            role="button"
            tabindex="0"
            :aria-label="$ts('about_drawing_aria')"
            @click="openDrawingPreview"
            @keyup.enter.prevent="openDrawingPreview"
            @keyup.space.prevent="openDrawingPreview"
            class="drawing-zoom rounded-2 grayscale hover:grayscale-0 transition-all duration-300 mx-auto cursor-pointer"
          />
          <p class="text-sm italic text-gray-500 dark:text-gray-400 mt-3">
            {{ $t('about_drawing_caption') }}
            <a href="https://zimablue.cc" target="_blank" class="font-600 hover:underline text-gray-700 dark:text-gray-300">{{ $t('about_drawing_link') }}</a>.
          </p>
        </div>
      </section>

      <!-- Section divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Purpose -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_purpose_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_purpose_1') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- A short history -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_history_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_history_1') }}</p>
          <p>{{ $t('about_history_2') }}</p>
          <p>{{ $t('about_history_3') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- What you can do -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_features_title') }}</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
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
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_curation_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_curation_1') }}</p>
          <p>{{ $t('about_curation_2') }}</p>
          <p>{{ $t('about_curation_3') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Community & contribution -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_community_title') }}</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
          <li>{{ $t('about_community_1') }}</li>
          <li>{{ $t('about_community_2') }}</li>
          <li>{{ $t('about_community_3') }}</li>
          <li>{{ $t('about_community_4') }}</li>
        </ul>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Accessibility & inclusivity -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_accessibility_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_accessibility_1') }}</p>
          <p>{{ $t('about_accessibility_2') }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Privacy & data -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_privacy_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
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
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_roadmap_title') }}</h2>
        <ul class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 list-disc pl-5">
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
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-2">{{ $t('about_tech_title') }}</h2>
        <div class="font-body text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
          <p>{{ $t('about_tech_intro') }}</p>
          <ul class="list-disc font-600 pl-7 space-y-2 py-6">
            <li>{{ $t('about_tech_1') }}</li>
            <li>{{ $t('about_tech_2') }}</li>
            <li>{{ $t('about_tech_3') }}</li>
            <li>{{ $t('about_tech_4') }}</li>
            <li>{{ $t('about_tech_5') }}</li>
          </ul>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('about_tech_note', { file1: 'package.json', file2: 'nuxt.config.ts' }) }}</p>
        </div>
      </section>

      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-16" />

      <!-- Suggestions & next steps -->
      <section class="mb-16">
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_suggestions_title') }}</h2>
        <div class="font-body text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
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
        <h2 class="font-title text-3xl md:text-4xl font-600 mb-6">{{ $t('about_contact_title') }}</h2>
        <div class="font-body text-2xl font-200 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl space-y-4">
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
        <p class="font-body font-medium text-gray-700 dark:text-gray-300 mt-8">{{ $t('about_contact_tagline') }}</p>
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
const { $t, $ts } = useI18n()

const config = useRuntimeConfig()
const version = config.public.appVersion
definePageMeta({
  layout: 'default'
})

useHead({
  title: $ts('about_meta_title'),
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: $ts('about_meta_desc') },
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
