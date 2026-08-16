<template>
  <label class="block text-xs text-gray-600 dark:text-gray-400">
    {{ label }}
    <div class="relative mt-1">
      <input v-model="query" class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" @input="search" @focus="open = true">
      <div v-if="open && results.length" class="absolute z-20 w-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <button v-for="item in results" :key="item.id" type="button" class="block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700" @click="select(item)">{{ item.name }}</button>
      </div>
    </div>
  </label>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: { id: number; name: string } | null; label: string; endpoint: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: { id: number; name: string }] }>()
const query = ref(props.modelValue?.name || '')
const results = ref<Array<{ id: number; name: string }>>([])
const open = ref(false)
watch(() => props.modelValue, value => { query.value = value?.name || '' })
const search = async () => {
  if (!query.value.trim()) { results.value = []; return }
  try {
    const response = await $fetch<ApiResponse<Array<{ id: number; name: string }>>>(props.endpoint, { query: { q: query.value, limit: 6 } })
    results.value = response.data || []
    open.value = true
  } catch { results.value = [] }
}
const select = (item: { id: number; name: string }) => { emit('update:modelValue', item); query.value = item.name; open.value = false }
</script>
