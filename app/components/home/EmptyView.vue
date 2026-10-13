<template>
  <section class="px-6 py-24 sm:py-32" aria-labelledby="home-empty-title">
    <div class="mx-auto max-w-xl text-center">
      <h1 id="home-empty-title" class="font-serif text-4xl font-400 leading-tight tracking-[-0.025em] text-gray-900 dark:text-gray-100 sm:text-5xl">
        {{ $t('home.empty.no_quotes') }}
      </h1>
      <p class="mx-auto mt-4 max-w-sm font-sans text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
        {{ $t('home.empty.be_first') }}
      </p>

      <div class="mt-8 flex justify-center">
        <NButton
          v-if="needsOnboarding && (onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser)"
          size="lg"
          to="/onboarding/admin"
          btn="solid-black"
          class="min-h-12 gap-3 rounded-1 px-7 font-sans transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-96"
        >
          <NIcon name="i-ph-rocket-launch" class="h-4 w-4" />
          {{ $t('home.empty.get_started') }}
        </NButton>
        <NButton
          v-else-if="needsOnboarding && (onboardingStatus?.step === 'database_data' || !onboardingStatus?.hasData)"
          size="lg"
          to="/onboarding/database"
          btn="solid-black"
          class="min-h-12 gap-3 rounded-1 px-7 font-sans transition-[transform] duration-150 hover:-translate-y-0.5 active:scale-96"
        >
          <NIcon name="i-ph-database" class="h-4 w-4" />
          {{ $t('home.empty.init_db') }}
        </NButton>
        <NButton
          v-else
          @click="$emit('openSubmitModal')"
          size="md"
          btn="solid-black"
          class="min-h-10 gap-2 rounded-1 px-7 font-sans transition-[transform] duration-150 hover:-translate-y-0.5 hover:scale-105 active:scale-99"
        >
          {{ $t('home.empty.add_quote') }}
          <NIcon name="i-lucide-message-square-quote" class="h-4 w-4" />
        </NButton>
      </div>

      <div class="mx-auto mt-14 max-w-sm">
        <svg
          aria-hidden="true"
          class="block h-4 w-full text-gray-300 dark:text-white/20"
          viewBox="0 0 386.5 16"
          preserveAspectRatio="none"
        >
          <path
            :d="wavePath"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        <p class="mt-4 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {{ $t('home.empty.story') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
const { $t } = useI18n()

const wavePath = (() => {
  const curve = 'c2.667 -2.199 5.333 -4.2 8 -4.2 s5.333 2.001 8 4.2 s5.333 4.2 8 4.2 s5.333 -2.001 8 -4.2'
  return [`M 1.25 8`, ...Array.from({ length: 12 }, () => curve)].join(' ')
})()

interface Props {
  needsOnboarding: boolean
  onboardingStatus: {
    step?: string
    hasAdminUser?: boolean
    hasData?: boolean
  }
  stats: {
    quotes: number
    authors: number
    references: number
    users: number
  }
}

withDefaults(defineProps<Props>(), {
  needsOnboarding: false,
  onboardingStatus: () => ({}),
  stats: () => ({ quotes: 0, authors: 0, references: 0, users: 0 })
})

defineEmits(['openSubmitModal'])
</script>
