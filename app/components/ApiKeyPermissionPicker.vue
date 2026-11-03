<script setup lang="ts">
interface PermissionColumn {
  label: string
}

interface PermissionRow {
  label: string
  note?: string
  noteTooltip?: string
  scopes: Array<string | null>
}

export interface PermissionPickerSection {
  label: string
  columns: PermissionColumn[]
  rows: PermissionRow[]
}

const props = defineProps<{
  modelValue: string[]
  sections: PermissionPickerSection[]
}>()

const emit = defineEmits<{
  'update:modelValue': [permissions: string[]]
}>()

function togglePermission(scope: string) {
  const permissions = props.modelValue.includes(scope)
    ? props.modelValue.filter(permission => permission !== scope)
    : [...props.modelValue, scope]

  emit('update:modelValue', permissions)
}
</script>

<template>
  <div class="space-y-3">
    <fieldset
      v-for="section in sections"
      :key="section.label"
      class="min-w-0 rounded-lg border border-gray-200 px-3 pb-2.5 pt-1 dark:border-neutral-700"
    >
      <legend class="px-1 font-sans text-xs font-600 text-gray-800 dark:text-gray-200">
        {{ section.label }}
      </legend>

      <table class="w-full table-fixed">
        <thead>
          <tr>
            <th scope="col" class="py-1 text-left font-sans text-[11px] font-400 text-gray-400 dark:text-gray-500" />
            <th
              v-for="column in section.columns"
              :key="column.label"
              scope="col"
              class="w-16 py-1 text-center font-sans text-[11px] font-400 text-gray-500 dark:text-gray-400 sm:w-20"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in section.rows"
            :key="row.label"
            class="border-t border-gray-100 dark:border-neutral-800"
          >
            <th scope="row" class="py-2 text-left font-sans text-xs font-400 text-gray-700 dark:text-gray-300">
              <span>{{ row.label }}</span>
              <NTooltip
                v-if="row.note && row.noteTooltip"
                :content="row.noteTooltip"
                :_tooltip-content="{ class: 'max-w-xs whitespace-normal text-left' }"
              >
                <button
                  type="button"
                  class="ml-1 cursor-help text-[10px] text-gray-400 underline decoration-dotted underline-offset-2 dark:text-gray-500"
                  :aria-label="`${row.note}: ${row.label}`"
                >
                  {{ row.note }}
                </button>
              </NTooltip>
              <span v-else-if="row.note" class="ml-1 text-[10px] text-gray-400 dark:text-gray-500">{{ row.note }}</span>
            </th>
            <td v-for="(scope, index) in row.scopes" :key="section.columns[index]?.label ?? index" class="py-2 text-center">
              <label
                v-if="scope"
                class="inline-flex min-h-7 min-w-8 cursor-pointer items-center justify-center rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-500"
                :aria-label="`${row.label}: ${section.columns[index]?.label ?? ''}`"
              >
                <input
                  type="checkbox"
                  :checked="modelValue.includes(scope)"
                  class="h-4 w-4 cursor-pointer accent-gray-800 dark:accent-gray-200"
                  @change="togglePermission(scope)"
                />
                <span class="sr-only">{{ section.columns[index]?.label }}</span>
              </label>
              <span v-else aria-hidden="true" class="text-gray-300 dark:text-gray-700">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  </div>
</template>
