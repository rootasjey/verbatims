<template>
  <section class="space-y-4" aria-labelledby="quote-sources-heading">
    <div>
      <h2 id="quote-sources-heading" class="font-serif text-xl text-gray-900 dark:text-gray-100">
        {{ $t('components.dialogs.source_step') }}
      </h2>
      <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('components.dialogs.source_step_hint') }}
      </p>
    </div>

    <ol v-if="sources.length" class="space-y-4">
      <li
        v-for="(source, index) in sources"
        :key="index"
        class="space-y-4 border-b border-gray-200 pb-4 last:border-b-0 dark:border-neutral-700"
      >
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">
            {{ $t('components.dialogs.source_number', { number: index + 1 }) }}
          </h3>
          <button
            type="button"
            class="rounded px-2 py-1 font-sans text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-gray-100"
            :disabled="disabled"
            @click="removeSource(index)"
          >
            {{ $t('components.dialogs.remove_source') }}
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300">
            {{ $t('components.dialogs.source_medium') }}
            <select
              v-model="source.source_medium"
              :disabled="disabled"
              class="mt-1.5 min-h-10 w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100"
            >
              <option :value="null">{{ $t('components.dialogs.source_medium_optional') }}</option>
              <option value="book">{{ $t('components.dialogs.source_medium_book') }}</option>
              <option value="web_page">{{ $t('components.dialogs.source_medium_web_page') }}</option>
              <option value="transcript">{{ $t('components.dialogs.source_medium_transcript') }}</option>
              <option value="audio">{{ $t('components.dialogs.source_medium_audio') }}</option>
              <option value="audiovisual">{{ $t('components.dialogs.source_medium_audiovisual') }}</option>
              <option value="document">{{ $t('components.dialogs.source_medium_document') }}</option>
              <option value="other">{{ $t('components.dialogs.source_medium_other') }}</option>
            </select>
          </label>

          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300">
            {{ $t('components.dialogs.source_label') }}
            <input
              v-model="source.label"
              type="text"
              maxlength="200"
              :placeholder="String($t('components.dialogs.source_label_placeholder'))"
              :disabled="disabled"
              class="mt-1.5 min-h-10 w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </label>
        </div>

        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300">
          {{ $t('components.dialogs.source_url') }}
          <input
            v-model="source.source_url"
            type="url"
            inputmode="url"
            :placeholder="String($t('components.dialogs.source_url_placeholder'))"
            :disabled="disabled"
            class="mt-1.5 min-h-10 w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </label>
        <p class="-mt-2 font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {{ $t('components.dialogs.source_required_hint') }}
        </p>

        <div class="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300">
            {{ $t('components.dialogs.locator_type') }}
            <select
              v-model="source.locator_type"
              :disabled="disabled"
              class="mt-1.5 min-h-10 w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-600 dark:text-gray-100"
              @change="source.locator_value = ''"
            >
              <option :value="null">{{ $t('components.dialogs.locator_optional') }}</option>
              <option value="page">{{ $t('components.dialogs.locator_page') }}</option>
              <option value="chapter">{{ $t('components.dialogs.locator_chapter') }}</option>
              <option value="timecode">{{ $t('components.dialogs.locator_timecode') }}</option>
            </select>
          </label>
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300">
            {{ $t('components.dialogs.locator_value') }}
            <input
              v-model="source.locator_value"
              type="text"
              maxlength="250"
              :placeholder="locatorPlaceholder(source.locator_type)"
              :disabled="disabled || !source.locator_type"
              :aria-describedby="source.locator_type === 'timecode' ? 'quote-timecode-hint' : undefined"
              class="mt-1.5 min-h-10 w-full rounded-1 border border-gray-300 bg-transparent px-3 py-2 text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 disabled:opacity-60 dark:border-neutral-600 dark:text-gray-100 dark:placeholder-gray-500"
              @blur="normalizeLocator(source)"
            />
          </label>
        </div>
        <p v-if="source.locator_type === 'timecode'" id="quote-timecode-hint" class="-mt-2 font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {{ $t('components.dialogs.timecode_format_hint') }}
        </p>
      </li>
    </ol>

    <button
      type="button"
      class="inline-flex min-h-10 items-center gap-2 rounded-1 border border-gray-300 px-3 py-2 font-sans text-sm font-500 text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-800"
      :disabled="disabled || sources.length >= 10"
      @click="addSource"
    >
      <NIcon name="i-ph-plus" class="h-4 w-4" />
      {{ $t('components.dialogs.add_source') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { normalizeTimecode } from '~~/shared/utils/timecode'

const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
const sources = defineModel<CreateQuoteSourceData[]>({ default: () => [] })
const { $t } = useI18n()

const locatorPlaceholder = (type: QuoteSourceLocatorType | null | undefined) => {
  if (type === 'page') return String($t('components.dialogs.locator_page_placeholder'))
  if (type === 'chapter') return String($t('components.dialogs.locator_chapter_placeholder'))
  if (type === 'timecode') return '83:45'
  return String($t('components.dialogs.locator_value_placeholder'))
}

const addSource = () => {
  sources.value = [...sources.value, {
    source_medium: null,
    source_url: '',
    label: '',
    locator_type: null,
    locator_value: '',
  }]
}

const removeSource = (index: number) => {
  sources.value = sources.value.filter((_, sourceIndex) => sourceIndex !== index)
}

const normalizeLocator = (source: CreateQuoteSourceData) => {
  if (source.locator_type !== 'timecode' || !source.locator_value) return
  const normalized = normalizeTimecode(source.locator_value)
  if (normalized) source.locator_value = normalized
}
</script>
