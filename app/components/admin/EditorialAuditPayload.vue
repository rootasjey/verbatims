<template>
  <section class="space-y-3 lg:col-span-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-800" role="group" :aria-label="viewLabel">
        <button
          type="button"
          class="min-h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          :class="view === 'diff' ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'"
          :aria-pressed="view === 'diff'"
          @click="view = 'diff'"
        >
          {{ diffLabel }}
        </button>
        <button
          type="button"
          class="min-h-8 rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          :class="view === 'json' ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'"
          :aria-pressed="view === 'json'"
          @click="view = 'json'"
        >
          {{ jsonLabel }}
        </button>
      </div>
      <span v-if="view === 'diff' && action === 'update' && changes.length" class="text-xs text-gray-500 dark:text-gray-400">
        {{ changes.length }} {{ changedLabel.toLocaleLowerCase() }}
      </span>
    </div>

    <div v-if="view === 'diff' && action === 'create' && afterJson" class="overflow-hidden rounded-lg border border-emerald-200 dark:border-emerald-900">
      <div class="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        {{ addedLabel }}
      </div>
      <pre class="max-h-96 overflow-auto bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"><code><span v-for="(token, index) in highlight(formatSnapshot(afterJson))" :key="index" :class="tokenClass(token.kind)">{{ token.value }}</span></code></pre>
    </div>
    <div v-else-if="view === 'diff' && action === 'delete' && beforeJson" class="overflow-hidden rounded-lg border border-rose-200 dark:border-rose-900">
      <div class="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        {{ removedLabel }}
      </div>
      <pre class="max-h-96 overflow-auto bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"><code><span v-for="(token, index) in highlight(formatSnapshot(beforeJson))" :key="index" :class="tokenClass(token.kind)">{{ token.value }}</span></code></pre>
    </div>
    <div v-else-if="view === 'diff' && changes.length" class="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
      <div
        v-for="change in changes"
        :key="change.key"
        class="grid gap-3 p-3 md:grid-cols-[minmax(7rem,0.45fr)_minmax(0,1fr)_minmax(0,1fr)]"
        :class="change.kind === 'added' ? 'bg-emerald-50/60 dark:bg-emerald-950/15' : change.kind === 'removed' ? 'bg-rose-50/60 dark:bg-rose-950/15' : 'bg-white dark:bg-gray-950'"
      >
        <div class="flex flex-wrap items-start justify-between gap-2 md:flex-col md:justify-start">
          <code class="break-all text-xs font-medium text-gray-800 dark:text-gray-200">{{ change.key }}</code>
          <span class="rounded-full px-2 py-0.5 text-[11px]" :class="change.kind === 'added' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : change.kind === 'removed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'">
            {{ change.kind === 'added' ? addedLabel : change.kind === 'removed' ? removedLabel : changedLabel }}
          </span>
        </div>
        <div>
          <span class="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">{{ beforeLabel }}</span>
          <pre v-if="change.kind !== 'added'" class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-rose-100/70 p-2 text-xs text-gray-800 dark:bg-rose-950/30 dark:text-gray-200">{{ formatValue(change.before) }}</pre>
          <span v-else class="text-xs text-gray-400">—</span>
        </div>
        <div>
          <span class="mb-1 block text-[11px] text-gray-500 dark:text-gray-400">{{ afterLabel }}</span>
          <pre v-if="change.kind !== 'removed'" class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-emerald-100/70 p-2 text-xs text-gray-800 dark:bg-emerald-950/30 dark:text-gray-200">{{ formatValue(change.after) }}</pre>
          <span v-else class="text-xs text-gray-400">—</span>
        </div>
      </div>
    </div>
    <p v-else-if="view === 'diff'" class="rounded-lg border border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
      {{ noChangesLabel }}
    </p>

    <div v-else class="grid gap-4 lg:grid-cols-2">
      <section v-if="beforeJson">
        <h3 class="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{{ beforeLabel }}</h3>
        <pre class="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"><code><span v-for="(token, index) in highlight(formatSnapshot(beforeJson))" :key="index" :class="tokenClass(token.kind)">{{ token.value }}</span></code></pre>
      </section>
      <section v-if="afterJson">
        <h3 class="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{{ afterLabel }}</h3>
        <pre class="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"><code><span v-for="(token, index) in highlight(formatSnapshot(afterJson))" :key="index" :class="tokenClass(token.kind)">{{ token.value }}</span></code></pre>
      </section>
      <p v-if="!beforeJson && !afterJson" class="text-sm text-gray-500 dark:text-gray-400">{{ noChangesLabel }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  action: string
  beforeJson: string | null
  afterJson: string | null
  beforeLabel: string
  afterLabel: string
  viewLabel: string
  diffLabel: string
  jsonLabel: string
  addedLabel: string
  removedLabel: string
  changedLabel: string
  noChangesLabel: string
}

interface JsonToken {
  value: string
  kind: 'key' | 'string' | 'number' | 'literal' | 'punctuation' | 'plain'
}

interface FieldChange {
  key: string
  kind: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

const props = defineProps<Props>()
const view = ref<'diff' | 'json'>('diff')

const changes = computed(() => {
  const before = parseSnapshot(props.beforeJson)
  const after = parseSnapshot(props.afterJson)
  const beforeFields = toFields(before)
  const afterFields = toFields(after)
  const keys = [...new Set([...Object.keys(beforeFields), ...Object.keys(afterFields)])]

  return keys.flatMap((key): FieldChange[] => {
    const inBefore = Object.prototype.hasOwnProperty.call(beforeFields, key)
    const inAfter = Object.prototype.hasOwnProperty.call(afterFields, key)
    if (!inBefore) return [{ key, kind: 'added', after: afterFields[key] }]
    if (!inAfter) return [{ key, kind: 'removed', before: beforeFields[key] }]
    if (sameValue(beforeFields[key], afterFields[key])) return []
    return [{ key, kind: 'changed', before: beforeFields[key], after: afterFields[key] }]
  })
})

function parseSnapshot(source: string | null): unknown {
  if (!source) return {}
  try {
    return JSON.parse(source) as unknown
  } catch {
    return { $: source }
  }
}

function toFields(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return value === undefined ? {} : { $: value }
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function formatSnapshot(source: string | null): string {
  if (!source) return ''
  try {
    return JSON.stringify(JSON.parse(source), null, 2)
  } catch {
    return source
  }
}

function formatValue(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? String(value)
}

function highlight(source: string): JsonToken[] {
  const pattern = /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\b(?:true|false|null)\b)|([{}\[\],:])|(\s+)|([\s\S])/g
  return [...source.matchAll(pattern)].map((match) => {
    const value = match[0]
    const kind: JsonToken['kind'] = match[1]
      ? 'key'
      : match[2]
        ? 'string'
        : match[3]
          ? 'number'
          : match[4]
            ? 'literal'
            : match[5]
              ? 'punctuation'
              : 'plain'
    return { value, kind }
  })
}

function tokenClass(kind: JsonToken['kind']): string {
  return ({
    key: 'text-sky-700 dark:text-sky-300',
    string: 'text-emerald-700 dark:text-emerald-300',
    number: 'text-violet-700 dark:text-violet-300',
    literal: 'text-amber-700 dark:text-amber-300',
    punctuation: 'text-gray-500 dark:text-gray-400',
    plain: '',
  })[kind]
}
</script>
