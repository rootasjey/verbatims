<template>
  <div class="px-8 font-serif">
    <!-- Onboarding Section (Centered when database is empty) -->
    <div v-if="needsOnboarding" class="text-center py-16 mb-16">
      <div class="max-w-2xl mx-auto">
        <NIcon name="i-ph-rocket-launch" class="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h2 class="text-3xl font-600 line-height-none mb-4">Welcome to Verbatims!</h2>
        <p class="text-gray-600 dark:text-gray-400 text-lg mb-8">
          Get started by setting up your universal quotes service:
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NButton
            v-if="onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser"
            size="lg"
            to="/onboarding/admin"
            class="px-8 py-4"
          >
            <NIcon name="i-ph-user-plus" />
            <span>1. Create Admin User</span>
          </NButton>
          <NButton
            v-else-if="onboardingStatus?.step === 'database_data' || !onboardingStatus?.hasData"
            size="lg"
            to="/onboarding/database"
            class="px-8 py-4"
          >
            <NIcon name="i-ph-database" />
            <span>2. Initialize Database</span>
          </NButton>
          <NButton
            v-if="onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser"
            size="lg"
            to="/onboarding/database"
            class="px-8 py-4"
            btn="outline"
          >
            <NIcon name="i-ph-skip-forward" />
            <span>Skip • Import Backup</span>
          </NButton>
        </div>
      </div>
    </div>

    <!-- Empty State (when onboarding is complete but no quotes) -->
    <div v-else-if="stats.quotes === 0" class="text-center py-16 mb-16">
      <div class="max-w-2xl mx-auto">
        <NIcon name="i-ph-quotes" class="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h2 class="text-3xl font-600 line-height-none mb-4">Ready to start collecting quotes!</h2>
        <p class="text-gray-600 dark:text-gray-400 text-lg mb-8">
          Your database is set up. Start by submitting your first quote and begin building your universal quotes collection.
        </p>
        <NButton
          @click="$emit('openSubmitModal')"
          size="lg"
          class="px-8 py-4"
        >
          <NIcon name="i-ph-plus" />
          <span>Submit Your First Quote</span>
        </NButton>
      </div>
    </div>

    <!-- Features Bento Grid -->
    <div class="mb-20">
      <HomeEmptyBentoGrid />
    </div>

    <!-- Personal Manifesto Section -->
    <div class="max-w-3xl mx-auto mt-42 mb-16">
      <div class="text-center mb-8 border-b b-dashed pb-8">
        <NIcon name="i-ph-heart" class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 class="font-subtitle text-3xl font-600 line-height-none mb-2">The Journey Behind Verbatims</h2>
        <p class="font-sans text-gray-600 dark:text-gray-400 text-lg">
          This is my 8th attempt at building something meaningful. Here's why it matters.
        </p>
      </div>

      <div class="font-body font-400 text-size-8 text-center prose prose-gray dark:prose-invert">
        <p class="leading-relaxed">
          The project started with <i class="color-pink-6">Citamour</i> on Windows Phone 7, taking quotes from Evene.fr.
          Then I rebuilt <i class="color-blue-6">Citations 365</i> on Windows 8. After, I rebranded as <i class="color-purple-6">Memorare</i>
          coded with Svelte in 2020. Moved to Flutter in 2021 for universal app (Android, iOS, web) and renamed
          <i class="color-orange-6">kwotes</i>. Finally, after working on other projects, I released only on iOS.
        </p>

        <p>...</p>
        <p class="leading-relaxed mb-6">
          Now I understand two things:
        </p>

        <div class="font-body font-400 text-size-5 rounded-lg p-6 mb-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-8 h-8 bg-lime-300 text-black rounded-full flex items-center justify-center font-600">
              1
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>I lost myself in overly complicated considerations.</strong> Let's build a simple quotes web app
                with the easiest technologies. No complicated notification system or paywall for search features.
                Just focused on delivering emotional quotes.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-lime-300 text-black rounded-full flex items-center justify-center font-600">
              2
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>I seem obsessed with this project.</strong> I cannot let it go until it's finished.
                Plus I don't find a viable alternative even with hundreds of quotes apps. None cover the features I desire.
                So here we are again.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 items-center">
          <div v-for="i in 9" :key="i" class="w-1 h-1 bg-black dark:bg-gray-2 rounded-full"></div>
        </div>

        <div class="mt-12 font-subtitle font-400 text-size-12 text-center">
          Welcome to Verbatims — built with passion, designed for simplicity.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
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

const emit = defineEmits(['openSubmitModal'])
</script>
