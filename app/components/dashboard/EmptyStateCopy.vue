<template>
  <div>
    <p class="mb-2 font-serif text-2xl leading-snug text-gray-800 dark:text-gray-100 sm:text-3xl">
      <span class="sr-only">{{ heading }}</span>
      <span aria-hidden="true">{{ typedHeading }}</span>
    </p>
    <p class="mb-6 font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400">
      <span class="sr-only">{{ description }}</span>
      <span aria-hidden="true">{{ typedDescription }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  heading: string
  description: string
}>()

const headingText = computed(() => props.heading)
const descriptionText = computed(() => props.description)
const animationEnabled = computed(() => true)

const { displayedText: typedHeading } = useTypewriterText(headingText, animationEnabled)
const { displayedText: typedDescription } = useTypewriterText(descriptionText, animationEnabled)
</script>
