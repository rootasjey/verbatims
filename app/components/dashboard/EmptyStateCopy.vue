<template>
  <div>
    <p class="mb-2 font-serif text-2xl leading-snug text-gray-800 dark:text-gray-100 sm:text-3xl">
      <span class="sr-only">{{ heading }}</span>
      <span aria-hidden="true">{{ typedHeading }}</span>
    </p>
    <p class="mb-6 font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400">
      <span class="sr-only">{{ description }}</span>
      <template v-if="usesInlineAction">
        <span aria-hidden="true">{{ typedDescriptionBeforeAction }}</span>
        <slot v-if="showInlineAction" name="description-action" />
        <span aria-hidden="true">{{ typedDescriptionAfterAction }}</span>
      </template>
      <span v-else aria-hidden="true">{{ typedDescription }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  heading: string
  description: string
  interactivePhrase?: string
}>()

const slots = useSlots()
const headingText = computed(() => props.heading)
const descriptionText = computed(() => props.description)
const animationEnabled = computed(() => true)

const { displayedText: typedHeading } = useTypewriterText(headingText, animationEnabled)
const { displayedText: typedDescription } = useTypewriterText(descriptionText, animationEnabled)

const interactivePhraseIndex = computed(() =>
  props.interactivePhrase ? props.description.indexOf(props.interactivePhrase) : -1
)
const usesInlineAction = computed(() =>
  interactivePhraseIndex.value >= 0 && Boolean(slots['description-action'])
)
const showInlineAction = computed(() =>
  usesInlineAction.value
  && typedDescription.value.length >= interactivePhraseIndex.value + (props.interactivePhrase?.length ?? 0)
)
const typedDescriptionBeforeAction = computed(() => {
  if (!usesInlineAction.value) return typedDescription.value
  return typedDescription.value.slice(0, Math.min(typedDescription.value.length, interactivePhraseIndex.value))
})
const typedDescriptionAfterAction = computed(() => {
  if (!showInlineAction.value) return ''
  return typedDescription.value.slice(interactivePhraseIndex.value + (props.interactivePhrase?.length ?? 0))
})
</script>
