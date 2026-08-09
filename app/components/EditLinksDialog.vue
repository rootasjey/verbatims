<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    :submit-text="$t('common.save') as string"
    :submitting="submitting"
    max-width="md"
    scrollable
    @submit="save"
  >
    <div class="space-y-4 m-1">
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400">
        {{ $t('edit_links.hint') }}
      </p>

      <div v-if="rows.length === 0" class="py-10 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <NIcon name="i-ph-link-simple" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p class="font-serif text-base text-gray-400 dark:text-gray-500">{{ $t('edit_links.empty') }}</p>
      </div>

      <div v-for="(row, index) in rows" :key="index" class="flex items-center gap-2">
        <div class="w-40 flex-shrink-0">
          <NInput
            v-model="row.platform"
            list="verbatims-known-links"
            :placeholder="$t('edit_links.platform_placeholder') as string"
            :disabled="submitting"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          />
        </div>
        <div class="flex-1 min-w-0">
          <NInput
            v-model="row.url"
            :placeholder="$t('edit_links.url_placeholder') as string"
            :disabled="submitting"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          />
        </div>
        <button
          type="button"
          class="flex-shrink-0 p-1.5 rounded-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          :disabled="submitting"
          :title="$t('edit_links.remove') as string"
          @click="removeRow(index)"
        >
          <NIcon name="i-ph-trash" class="w-4 h-4" />
        </button>
      </div>

      <datalist id="verbatims-known-links">
        <option v-for="opt in platformOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </datalist>

      <button
        type="button"
        class="w-full py-2 font-sans text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        :disabled="submitting"
        @click="addRow"
      >
        <span class="inline-flex items-center gap-1.5">
          <NIcon name="i-ph-plus" class="w-3.5 h-3.5" />
          {{ $t('edit_links.add') }}
        </span>
      </button>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
interface LinkRow {
  platform: string
  url: string
}

type LinksInput =
  | Record<string, string | null | undefined>
  | Array<{ platform?: string; key?: string; url?: string; href?: string }>
  | string
  | null

interface Props {
  modelValue: boolean
  entityType: 'author' | 'reference'
  entityId?: number
  links?: LinksInput
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', links: Record<string, string>): void
}

const props = withDefaults(defineProps<Props>(), {
  entityId: undefined,
  links: null,
})

const emit = defineEmits<Emits>()

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const submitting = ref(false)
const rows = ref<LinkRow[]>([])

const platformOptions = [
  { value: 'wikipedia', label: 'Wikipedia' },
  { value: 'website', label: 'Website' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'imdb', label: 'IMDb' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'prime_video', label: 'Prime Video' },
  { value: 'twitch', label: 'Twitch' },
]

const dialogTitle = computed(() =>
  props.entityType === 'author'
    ? String($t('edit_links.title_author'))
    : String($t('edit_links.title_reference')),
)

const toRows = (links: LinksInput | null | undefined): LinkRow[] => {
  if (!links) return []

  if (typeof links === 'string') {
    try {
      const parsed = JSON.parse(links)
      return toRows(parsed)
    } catch {
      return []
    }
  }

  if (Array.isArray(links)) {
    return links
      .map((item) => ({
        platform: String(item.platform || item.key || '').trim(),
        url: String(item.url || item.href || '').trim(),
      }))
      .filter((row) => row.platform && row.url)
  }

  if (typeof links === 'object') {
    return Object.entries(links)
      .map(([platform, url]) => ({
        platform: platform.trim(),
        url: String(url ?? '').trim(),
      }))
      .filter((row) => row.platform && row.url)
  }

  return []
}

const initRows = () => {
  rows.value = toRows(props.links)
}

watch(isOpen, (open) => {
  if (open) initRows()
})

watch(() => props.links, () => {
  if (isOpen.value) initRows()
})

const addRow = () => {
  rows.value.push({ platform: '', url: '' })
}

const removeRow = (index: number) => {
  rows.value.splice(index, 1)
}

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const buildRecord = (): Record<string, string> => {
  const record: Record<string, string> = {}
  for (const row of rows.value) {
    const platform = row.platform.trim().toLowerCase().replace(/\s+/g, '_')
    const url = normalizeUrl(row.url)
    if (!platform || !url) continue
    record[platform] = url
  }
  return record
}

const save = async () => {
  if (!props.entityId || submitting.value) return

  submitting.value = true
  const record = buildRecord()
  const isAuthor = props.entityType === 'author'

  try {
    const url = isAuthor
      ? `/api/admin/authors/${props.entityId}`
      : `/api/admin/references/${props.entityId}`

    await $fetch(url, {
      method: 'PUT',
      body: isAuthor ? { socials: record } : { urls: record },
    })

    useToast().toast({
      toast: 'soft-success',
      title: String($t(isAuthor ? 'edit_links.save_success_author' : 'edit_links.save_success_reference')),
    })

    emit('saved', record)
    isOpen.value = false
  } catch (error) {
    console.error('Failed to update links:', error)
    showErrorToast(error, String($t(isAuthor ? 'edit_links.save_error_author' : 'edit_links.save_error_reference')))
  } finally {
    submitting.value = false
  }
}
</script>
