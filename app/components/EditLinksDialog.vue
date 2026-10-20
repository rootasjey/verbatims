<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    :submit-text="$t('common.save') as string"
    :submitting="submitting"
    max-width="2xl"
    scrollable
    @submit="save"
  >
    <div ref="dialogContentRef" class="m-1 space-y-5" @keydown="handleDialogKeydown">
      <p class="font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('edit_links.hint') }}
      </p>

      <div v-if="rows.length === 0" class="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
        <NIcon name="i-ph-link-simple" class="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('edit_links.empty') }}</p>
      </div>

      <div ref="rowsContainerRef" class="space-y-3">
        <div
          v-for="(row, index) in rows"
          :key="row.id"
          data-link-row
          :data-link-index="index"
          class="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 sm:grid-cols-[2rem_minmax(9rem,0.8fr)_minmax(14rem,1.2fr)_auto] sm:gap-x-3"
        >
          <span class="row-span-2 flex h-9 w-8 items-center justify-center text-gray-500 dark:text-gray-400 sm:row-span-1" aria-hidden="true">
            <NIcon :name="platformIcon(row.platform)" class="h-5 w-5" />
          </span>
          <div class="col-start-2 min-w-0 sm:col-start-2">
            <NInput
              v-model="row.platform"
              list="verbatims-known-links"
              :placeholder="$t('edit_links.platform_placeholder') as string"
              :disabled="submitting"
              class="min-w-0 bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:border-stone-400 dark:focus-visible:ring-stone-500/60 dark:focus-visible:border-stone-500', inputTrailingWrapper: 'pr-1.5' }"
            />
          </div>
          <div class="col-start-2 min-w-0 sm:col-start-3">
            <NInput
              v-model="row.url"
              :placeholder="$t('edit_links.url_placeholder') as string"
              :disabled="submitting"
              class="min-w-0 bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ input: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 focus-visible:border-stone-400 dark:focus-visible:ring-stone-500/60 dark:focus-visible:border-stone-500', inputTrailingWrapper: 'pr-1.5' }"
            />
          </div>
          <div class="col-start-3 row-span-2 flex items-center justify-center sm:col-start-4 sm:row-span-1">
            <NTooltip :content="String($t('edit_links.remove'))">
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:text-gray-400 dark:hover:bg-red-400/10 dark:hover:text-red-400 dark:focus-visible:ring-stone-400"
                :disabled="submitting"
                :aria-label="String($t('edit_links.remove'))"
                @click="removeRow(index)"
              >
                <NIcon name="i-ph-trash" class="h-4 w-4" />
              </button>
            </NTooltip>
          </div>
        </div>
      </div>

      <datalist id="verbatims-known-links">
        <option v-for="opt in platformOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </datalist>

      <button
        ref="addButtonRef"
        type="button"
        class="inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 font-sans text-sm font-600 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-stone-400"
        :disabled="submitting"
        @click="addRow()"
      >
        <NIcon name="i-ph-plus" class="h-4 w-4" />
        {{ $t('edit_links.add') }}
      </button>

      <p class="font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {{ $t('edit_links.keyboard_shortcuts') }}
      </p>
    </div>

    <template #submit>
      <NButton
        btn="solid-black"
        type="button"
        :disabled="submitting"
        :loading="submitting"
        class="h-9 rounded-1 px-4 font-sans text-sm font-600"
        @click="save"
      >
        {{ $t('common.save') }}
      </NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface LinkRow {
  id: number
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
const dialogContentRef = ref<HTMLElement | null>(null)
const rowsContainerRef = ref<HTMLElement | null>(null)
const addButtonRef = ref<HTMLButtonElement | null>(null)
let rowId = 0
let dialogResizePanel: HTMLElement | null = null
let dialogResizeStartHeight: number | null = null
let dialogResizeFrame: number | null = null
let dialogResizeTimer: number | null = null
let dialogResizeEndHandler: ((event: TransitionEvent) => void) | null = null

const createRow = (platform = '', url = ''): LinkRow => ({
  id: rowId++,
  platform,
  url,
})

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

const platformIcons: Record<string, string> = {
  amazon: 'i-ph-shopping-cart',
  facebook: 'i-ph-facebook-logo',
  github: 'i-ph-github-logo',
  image: 'i-ph-image',
  imagename: 'i-ph-image',
  image_name: 'i-ph-image',
  imdb: 'i-ph-film-slate',
  instagram: 'i-ph-instagram-logo',
  linkedin: 'i-ph-linkedin-logo',
  netflix: 'i-tabler-brand-netflix',
  prime_video: 'i-ph-video-camera',
  twitch: 'i-ph-twitch-logo',
  twitter: 'i-ph-twitter-logo',
  website: 'i-ph-globe-hemisphere-west-bold',
  wikipedia: 'i-ph-book-bookmark-duotone',
  youtube: 'i-ph-youtube-logo',
}

const platformIcon = (platform: string) => {
  const key = platform.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return platformIcons[key] || platformIcons[key.replace(/_/g, '')] || 'i-ph-link-simple'
}

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
      .map((item) => createRow(
        String(item.platform || item.key || '').trim(),
        String(item.url || item.href || '').trim(),
      ))
      .filter((row) => row.platform && row.url)
  }

  if (typeof links === 'object') {
    return Object.entries(links)
      .map(([platform, url]) => createRow(platform.trim(), String(url ?? '').trim()))
      .filter((row) => row.platform && row.url)
  }

  return []
}

const initRows = () => {
  rows.value = toRows(props.links)
}

watch(isOpen, (open) => {
  if (open) initRows()
  else clearDialogResize()
})

watch(() => props.links, () => {
  if (isOpen.value) initRows()
})

const clearDialogResize = () => {
  if (!dialogResizePanel) return
  if (dialogResizeEndHandler) dialogResizePanel.removeEventListener('transitionend', dialogResizeEndHandler)
  if (dialogResizeFrame !== null) window.cancelAnimationFrame(dialogResizeFrame)
  if (dialogResizeTimer !== null) window.clearTimeout(dialogResizeTimer)
  dialogResizePanel.style.height = ''
  dialogResizePanel.style.transition = ''
  dialogResizePanel = null
  dialogResizeStartHeight = null
  dialogResizeFrame = null
  dialogResizeTimer = null
  dialogResizeEndHandler = null
}

const prepareDialogResize = () => {
  if (!import.meta.client || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  clearDialogResize()
  const panel = dialogContentRef.value?.closest<HTMLElement>('[role="dialog"]')
  if (!panel) return
  const startHeight = panel.getBoundingClientRect().height
  panel.style.transition = 'none'
  panel.style.height = `${startHeight}px`
  void panel.offsetHeight
  dialogResizePanel = panel
  dialogResizeStartHeight = startHeight
}

const animateDialogResize = () => {
  const panel = dialogResizePanel
  const startHeight = dialogResizeStartHeight
  if (!panel || startHeight === null) return
  panel.style.height = 'auto'
  const targetHeight = panel.getBoundingClientRect().height
  panel.style.height = `${startHeight}px`
  void panel.offsetHeight
  panel.style.transition = 'height 240ms cubic-bezier(0.22, 1, 0.36, 1)'
  const finish = (event?: TransitionEvent) => {
    if (event && (event.target !== panel || event.propertyName !== 'height')) return
    clearDialogResize()
  }
  dialogResizeEndHandler = finish
  panel.addEventListener('transitionend', finish)
  dialogResizeTimer = window.setTimeout(() => finish(), 400)
  dialogResizeFrame = window.requestAnimationFrame(() => {
    if (dialogResizePanel === panel) panel.style.height = `${targetHeight}px`
  })
}

type LinkField = 'platform' | 'url'

const focusLinkField = async (index: number, field: LinkField) => {
  await nextTick()
  const row = rowsContainerRef.value?.querySelectorAll<HTMLElement>('[data-link-row]')[index]
  const selector = field === 'platform'
    ? 'input[list="verbatims-known-links"]'
    : 'input:not([list])'
  const input = row?.querySelector<HTMLInputElement>(selector)
  input?.focus()
  if (input) input.setSelectionRange(input.value.length, input.value.length)
}

const focusPlatformInput = (index: number) => focusLinkField(index, 'platform')

const addRow = async (focus = true) => {
  prepareDialogResize()
  rows.value.push(createRow())
  await nextTick()
  animateDialogResize()
  if (focus) await focusPlatformInput(rows.value.length - 1)
}

const removeRow = async (index: number, focusTarget?: { index: number; field: LinkField }) => {
  prepareDialogResize()
  rows.value.splice(index, 1)
  await nextTick()
  animateDialogResize()
  if (rows.value.length) {
    if (focusTarget) await focusLinkField(focusTarget.index, focusTarget.field)
    else await focusPlatformInput(Math.min(index, rows.value.length - 1))
  }
  else addButtonRef.value?.focus()
}

const handleDialogKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' && event.target instanceof HTMLInputElement && event.target.value === '') {
    const row = event.target.closest<HTMLElement>('[data-link-row]')
    if (!row) return

    event.preventDefault()
    const index = Number(row.dataset.linkIndex)
    if (event.target.matches('input[list="verbatims-known-links"]')) {
      if (index === 0) return

      const currentRow = rows.value[index]
      if (currentRow && !currentRow.platform.trim() && !currentRow.url.trim()) {
        void removeRow(index, { index: index - 1, field: 'url' })
      } else {
        void focusLinkField(index - 1, 'url')
      }
    } else {
      void focusLinkField(index, 'platform')
    }
    return
  }

  if (event.key !== 'Enter') return
  if (event.metaKey || event.ctrlKey) {
    event.preventDefault()
    event.stopPropagation()
    void save()
    return
  }
  if (!(event.target instanceof HTMLInputElement)) return
  const row = event.target.closest<HTMLElement>('[data-link-row]')
  if (!row) return
  event.preventDefault()
  const index = Number(row.dataset.linkIndex)
  if (index + 1 < rows.value.length) {
    void focusPlatformInput(index + 1)
  } else {
    void addRow()
  }
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
    if (isAuthor) {
      const authorPath = `/api/admin/authors/${props.entityId}` as '/api/admin/authors/:id'
      await $fetch<{ success: boolean }, '/api/admin/authors/:id'>(authorPath, {
        method: 'PUT',
        body: { socials: record },
      })
    } else {
      const referencePath = `/api/admin/references/${props.entityId}` as '/api/admin/references/:id'
      await $fetch<{ success: boolean }, '/api/admin/references/:id'>(referencePath, {
        method: 'PUT',
        body: { urls: record },
      })
    }

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

onUnmounted(clearDialogResize)
</script>
