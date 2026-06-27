<template>
  <div class="mb-8 border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
    <div class="flex items-center gap-3 mb-2">
      <span class="font-mono text-xs font-600 px-2 py-1 rounded-sm shrink-0"
        :class="methodClass"
      >
        {{ method }}
      </span>
      <code class="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{{ path }}</code>
    </div>
    <p class="font-body text-sm text-gray-600 dark:text-gray-400 mb-3">{{ description }}</p>
    <div v-if="$slots.params" class="ml-1">
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="font-sans font-500 text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left py-1.5 pr-4">Parameter</th>
            <th class="font-sans font-500 text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left py-1.5 pr-4">Type</th>
            <th class="font-sans font-500 text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left py-1.5 pr-4">Default</th>
            <th class="font-sans font-500 text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left py-1.5">Description</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
          <slot name="params" />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  method: string
  path: string
  description: string
}

const props = defineProps<Props>()

const methodClass = computed(() => {
  switch (props.method) {
    case 'GET': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'POST': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'PUT': return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
    case 'DELETE': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
})
</script>
