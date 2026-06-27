<template>
  <tr>
    <td class="py-1.5 pr-4">
      <code class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ name }}</code>
      <span v-if="required" class="text-red-500 dark:text-red-400 ml-0.5">*</span>
    </td>
    <td class="py-1.5 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ type }}</td>
    <td class="py-1.5 pr-4 font-mono text-xs text-gray-400 dark:text-gray-500">{{ defaultVal }}</td>
    <td class="py-1.5 font-body text-xs text-gray-600 dark:text-gray-400">{{ desc }}</td>
  </tr>
</template>

<script setup lang="ts">
interface Props {
  name: string
  type: string
  defaultVal?: string
  desc: string
  required?: boolean
}

defineProps<Props>()
</script>
