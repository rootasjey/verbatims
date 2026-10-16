<template>
  <fieldset class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
    <legend class="px-1 text-sm font-semibold text-gray-800 dark:text-gray-200">Image attribution</legend>
    <div class="grid gap-3 sm:grid-cols-2">
      <label v-for="field in fields" :key="field.key" class="block min-w-0">
        <span class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ field.label }}</span>
        <input
          :value="modelValue[field.key]"
          :type="field.key === 'image_source_url' ? 'url' : 'text'"
          :disabled="disabled"
          :placeholder="field.placeholder"
          class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          @input="update(field.key, ($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
interface ImageAttributionForm {
  image_alt: string
  image_credit: string
  image_source_url: string
  image_license: string
  image_date: string
  image_location: string
}

const emit = defineEmits<{
  'update:modelValue': [value: ImageAttributionForm]
}>()

const props = defineProps<{
  modelValue: ImageAttributionForm
  disabled?: boolean
}>()

const fields = [
  { key: 'image_alt', label: 'Alternative text', placeholder: 'Describe the image for screen readers' },
  { key: 'image_credit', label: 'Creator / credit', placeholder: 'Photographer, artist, publisher…' },
  { key: 'image_source_url', label: 'Source URL', placeholder: 'https://…' },
  { key: 'image_license', label: 'License / rights', placeholder: 'Public domain, CC BY…' },
  { key: 'image_date', label: 'Image date', placeholder: 'Year or approximate date' },
  { key: 'image_location', label: 'Image location', placeholder: 'Place or collection' },
] as const

const update = (key: keyof ImageAttributionForm, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
