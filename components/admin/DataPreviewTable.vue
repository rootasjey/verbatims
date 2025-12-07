<template>
  <NCard v-if="data && data.length > 0">
    <template #header>
      <h3 class="text-lg font-semibold">Data Preview (First {{ maxRows }} Records)</h3>
    </template>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-for="col in columns" :key="col.label" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="(item, index) in data.slice(0, maxRows)" :key="index">
            <td v-for="col in columns" :key="col.label" class="px-3 py-2 text-sm max-w-xs truncate">
              <template v-if="col.type === 'date'">{{ formatDate(getField(item, col.keys)) || '-' }}</template>
              <template v-else-if="col.type === 'list'">{{ formatList(getField(item, col.keys)) || '-' }}</template>
              <template v-else>{{ getField(item, col.keys) || '-' }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </NCard>
</template>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-for="col in columns" :key="col.label" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="(item, index) in data.slice(0, maxRows)" :key="index">
            <td v-for="col in columns" :key="col.label" class="px-3 py-2 text-sm max-w-xs truncate">
              <template v-if="col.type === 'date'">{{ formatDate(getField(item, col.keys)) || '-' }}</template>
              <template v-else-if="col.type === 'list'">{{ formatList(getField(item, col.keys)) || '-' }}</template>
              <template v-else>{{ getField(item, col.keys) || '-' }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </NCard>
</template>

<script setup lang="ts">
type ColumnType = 'text' | 'date' | 'list'

interface Column {
  label: string
  keys: string[]
  type?: ColumnType
}

const props = withDefaults(defineProps<{
  data: Record<string, any>[]
  type: string
  maxRows: number
}>(), {
  data: () => [],
  type: 'references',
  maxRows: 5
})

const columns = computed<Column[]>((): Column[] => {
  const dataType = (props.type || 'references').toLowerCase()
  switch (dataType) {
    case 'authors':
      return [
        { label: 'Name', keys: ['name', 'full_name'], type: 'text' },
        { label: 'Born', keys: ['birth_date', 'born'], type: 'date' },
        { label: 'Died', keys: ['death_date', 'died'], type: 'date' },
        { label: 'Nationality', keys: ['nationality', 'country'], type: 'text' },
        { label: 'Bio', keys: ['bio', 'description', 'about'], type: 'text' }
      ]
    case 'tags':
      return [
        { label: 'Tag', keys: ['name', 'tag'], type: 'text' },
        { label: 'Slug', keys: ['slug'], type: 'text' },
        { label: 'Description', keys: ['description', 'desc'], type: 'text' }
      ]
    case 'users':
      return [
        { label: 'Name', keys: ['name', 'full_name'], type: 'text' },
        { label: 'Email', keys: ['email'], type: 'text' },
        { label: 'Role', keys: ['role'], type: 'text' },
        { label: 'Created At', keys: ['created_at', 'createdAt', 'signup_date'], type: 'date' },
        { label: 'Status', keys: ['status', 'state'], type: 'text' }
      ]
    case 'quotes':
      return [
        { label: 'Quote', keys: ['text', 'quote', 'content'], type: 'text' },
        { label: 'Author', keys: ['author', 'author_name', 'author_id'], type: 'text' },
        { label: 'Reference', keys: ['reference', 'reference_name', 'reference_id'], type: 'text' },
        { label: 'Tags', keys: ['tags'], type: 'list' },
        { label: 'Created At', keys: ['created_at', 'createdAt'], type: 'date' }
      ]
    default:
      return [
        { label: 'Name', keys: ['name', 'title'], type: 'text' },
        { label: 'Type', keys: ['primary_type', 'type'], type: 'text' },
        { label: 'Language', keys: ['original_language', 'language'], type: 'text' },
        { label: 'Release Date', keys: ['release_date', 'published_at', 'published'], type: 'date' },
        { label: 'Description', keys: ['description', 'desc', 'summary'], type: 'text' }
      ]
  }
})

function getField(item: Record<string, any> | undefined, keys: string[] | undefined): unknown {
  if (!item || !keys) return ''
  for (const key of keys) {
    // Support nested dot paths like 'author.name'
    if (key.includes('.')) {
      const parts = key.split('.')
      let val: any = item
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) val = val[p]
        else { val = undefined; break }
      }
      if (val !== undefined && val !== null && val !== '') return val
    } else {
      if (key in item && item[key] !== null && item[key] !== '') return item[key]
    }
  }
  return ''
}

function formatList(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'string') return value
  if (typeof value === 'object') return Object.values(value as Record<string, any>).join(', ')
  return String(value)
}

function formatDate(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  const date = new Date(String(value))
  
  if (isNaN(date.getTime())) return String(value)
  return date.toISOString().split('T')[0]
}
</script>
