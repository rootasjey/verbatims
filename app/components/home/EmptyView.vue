<template>
  <div class="px-8 py-24 sm:py-32">
    <div class="max-w-xl mx-auto text-center">
      <!-- Primary message -->
      <p class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        No quotes yet.
      </p>
      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        Be the first to share one.
      </p>

      <!-- CTA -->
      <div class="mt-8">
        <NButton
          v-if="needsOnboarding && (onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser)"
          size="lg"
          to="/onboarding/admin"
          btn="light:soft-secondary dark:soft-blue"
          class="font-sans hover:scale-102 active:scale-99 transition-[transform] duration-150"
        >
          <NIcon name="i-ph-rocket-launch" class="w-4 h-4" />
          Get Started
        </NButton>
        <NButton
          v-else-if="needsOnboarding && (onboardingStatus?.step === 'database_data' || !onboardingStatus?.hasData)"
          size="lg"
          to="/onboarding/database"
          btn="soft-secondary"
          class="font-sans"
        >
          <NIcon name="i-ph-database" class="w-4 h-4" />
          Initialize Database
        </NButton>
        <NButton
          v-else
          @click="$emit('openSubmitModal')"
          size="lg"
          btn="soft-secondary"
          class="font-sans"
        >
          <NIcon name="i-ph-plus-circle" class="w-4 h-4" />
          Add a Quote
        </NButton>
      </div>

      <!-- Divider -->
      <div class="mt-16 mb-8 w-12 h-px bg-gray-300 dark:bg-gray-700 mx-auto" />

      <!-- Story -->
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-sm mx-auto">
        Verbatims is the 8th iteration of a 15-year obsession to build the right quotes platform.
        Simple. Focused. Built to last.
      </p>
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

defineEmits(['openSubmitModal'])
</script>
