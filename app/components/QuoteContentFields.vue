<template>
	<div class="relative">
		<textarea
			ref="textareaRef"
			v-model="model"
			autofocus
			:placeholder="placeholder"
			rows="5"
			:disabled="disabled"
			required
			class="min-h-40 w-full resize-y rounded-1.5 bg-gray-100/80 px-4 pb-10 pt-4 font-serif text-xl leading-snug text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-600 dark:focus-visible:ring-gray-500"
			@input="$emit('input')"
		/>
		<span
			class="pointer-events-none absolute bottom-3 right-4 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400"
			aria-live="polite"
			:aria-label="String($t('components.dialogs.character_count', { count: model.length }))"
		>{{ model.length }}</span>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
	placeholder: string
	disabled?: boolean
}>(), {
	disabled: false,
})

defineEmits<{
	(e: 'input'): void
}>()

const model = defineModel<string>({ required: true })
const textareaRef = ref<HTMLTextAreaElement | null>(null)

defineExpose({
	focus: () => textareaRef.value?.focus(),
})
</script>
