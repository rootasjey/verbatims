<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitButtonText as string"
    :submitting="submitting"
    :can-submit="!!titleQuery.trim()"
    title-class="sr-only"
    hide-header-border
    max-width="2xl"
    scrollable
    @submit="submitReference"
  >
    <template #header-title>
      <div class="min-w-0 flex-1">
        <div role="tablist" :aria-label="$t('components.dialogs.reference_sections') as string" class="flex min-w-0 gap-2 overflow-x-auto px-2 sm:gap-7 sm:px-3">
          <button v-for="(tab, index) in referenceTabs" :key="tab.id" :ref="element => setTabRef(tab.id, element)" type="button" role="tab" :id="`reference-tab-${tab.id}`" :aria-selected="activeTab === tab.id" :aria-controls="`reference-panel-${tab.id}`" :tabindex="activeTab === tab.id ? 0 : -1" :class="['flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 font-sans text-xs transition-colors focus-visible:outline-none focus-visible:ring-0 sm:text-sm', activeTab === tab.id ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']" @click="activeTab = tab.id" @keydown="onTabKeydown($event, index)">
            <span v-if="tab.id === 'image'" class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gray-200 dark:bg-neutral-800"><img v-if="referencePreviewUrl" :src="referencePreviewUrl" :alt="$t('components.dialogs.cover_preview') as string" class="h-full w-full object-cover"><NIcon v-else name="i-ph-image" class="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" /></span>
            {{ tab.label }}
          </button>
        </div>
      </div>
    </template>

    <form @submit.prevent="submitReference" @keydown.ctrl.enter.prevent="submitReference" @keydown.meta.enter.prevent="submitReference" class="space-y-5 px-1 sm:px-2">
      <div ref="panelViewportRef" :style="panelHeight ? { height: `${panelHeight}px` } : undefined" class="relative overflow-hidden px-1 transition-[height] duration-300 ease-in-out motion-reduce:transition-none">
        <section :ref="element => setPanelRef('details', element)" v-show="activeTab === 'details'" id="reference-panel-details" role="tabpanel" aria-labelledby="reference-tab-details" class="space-y-5 py-1">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.title') }}</span>
              <div class="relative">
                <input ref="titleInputRef" v-model="titleQuery" type="text" :placeholder="$t('components.dialogs.placeholder_title') as string" :disabled="submitting" required autofocus class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100" @input="searchReferences" @focus="handleTitleInputFocus" @blur="handleTitleInputBlur" @keydown="handleTitleKeydown">
                <div v-if="showTitleSuggestions && (titleSuggestions.length > 0 || titleQuery)" ref="titleSuggestionsRef" class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleTitleSuggestionsBlur" @keydown="handleTitleKeydown">
                  <button v-for="(reference, index) in titleSuggestions" :key="reference.id" type="button" :class="['flex w-full items-center px-3 py-2 text-left transition-colors', selectedTitleIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectExistingReference(reference)" @mouseenter="selectedTitleIndex = index">
                    <span class="min-w-0 flex-1"><span class="block truncate font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ reference.name }}</span><span v-if="reference.primary_type" class="block font-sans text-xs capitalize text-gray-500 dark:text-gray-400">{{ reference.primary_type.replace('_', ' ') }}</span></span>
                  </button>
                  <button v-if="titleQuery && !titleSuggestions.some(reference => reference.name.toLowerCase() === titleQuery.toLowerCase())" type="button" :class="['w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm dark:border-neutral-700', selectedTitleIndex === titleSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="useNewReferenceTitle" @mouseenter="selectedTitleIndex = titleSuggestions.length">{{ $t('components.dialogs.create_new_reference', { name: titleQuery }) }}</button>
                </div>
              </div>
            </label>
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.genre') }}</span>
              <NSelect v-model="form.primary_type" :items="primaryTypeOptions" :placeholder="$t('common.search') as string" :disabled="submitting" item-key="label" value-key="label" required select="outline-gray" :_select-content="{ bodyLock: false }" />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.genre') }}</span>
              <input v-model="form.secondary_type" type="text" :placeholder="$t('components.dialogs.genre') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
            </label>
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.release_date') }}</span>
              <input v-model="form.release_date" type="date" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
            </label>
          </div>

          <label class="block max-w-md space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.original_language') }}</span>
            <NSelect v-model="form.original_language" :items="languageOptions" :placeholder="$t('components.dialogs.select_language') as string" :disabled="submitting" item-key="label" value-key="label" select="outline-gray" :_select-content="{ bodyLock: false }" />
          </label>

          <label class="block space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.description') }}</span>
            <textarea v-model="form.description" :placeholder="$t('components.dialogs.placeholder_desc') as string" rows="5" :disabled="submitting" class="min-h-32 w-full resize-y rounded-xl bg-gray-100/80 px-4 py-3 font-sans text-sm leading-relaxed text-gray-900 outline-none placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-500" />
          </label>
        </section>

        <section :ref="element => setPanelRef('image', element)" v-show="activeTab === 'image'" id="reference-panel-image" role="tabpanel" aria-labelledby="reference-tab-image" class="space-y-4 py-1">
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.image_url') }}</span>
              <input v-model="form.image_url" type="url" :placeholder="$t('components.dialogs.placeholder_url') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
              <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">
            </label>
            <div class="flex min-w-0 items-center gap-4 rounded-xl bg-gray-100/60 p-4 dark:bg-neutral-900/60">
              <button type="button" class="group relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:bg-neutral-800" :aria-label="$t('components.dialogs.upload_hint') as string" :disabled="submitting || uploading" @click="fileInputRef?.click()">
                <img v-if="referencePreviewUrl && !referencePreviewErrored" :src="referencePreviewUrl" :alt="$t('components.dialogs.cover_preview') as string" class="h-full w-full object-cover" @error="referencePreviewErrored = true">
                <span v-else class="flex h-full w-full items-center justify-center"><NIcon name="i-ph-image" class="h-7 w-7 text-gray-500 dark:text-gray-400" /></span>
                <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"><NIcon :name="uploading ? 'i-ph-circle-notch' : 'i-ph-upload'" class="h-5 w-5" :class="uploading ? 'animate-spin' : ''" /></span>
              </button>
              <div class="min-w-0"><p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.cover_preview') }}</p><button type="button" class="mt-1 text-left font-sans text-sm text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" @click="fileInputRef?.click()">{{ $t('components.dialogs.upload_hint') }}</button></div>
            </div>
          </div>
          <AdminImageAttributionFields v-model="form.image_attribution" :disabled="submitting" />
          <fieldset class="grid gap-3 rounded-xl border border-gray-200/80 p-3 dark:border-neutral-700/80 sm:grid-cols-2">
            <legend class="col-span-full px-1 font-sans text-sm font-600 text-gray-800 dark:text-gray-200">{{ $t('components.dialogs.image_attribution_status_title') }}</legend>
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.image_credit_status') }}</span>
              <select v-model="form.image_credit_status" :disabled="submitting" class="min-h-9 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
                <option value="">{{ $t('components.dialogs.image_status_unspecified') }}</option>
                <option value="creator_known">{{ $t('components.dialogs.image_credit_creator_known') }}</option>
                <option value="source_known">{{ $t('components.dialogs.image_credit_source_known') }}</option>
                <option value="unknown">{{ $t('components.dialogs.image_credit_unknown') }}</option>
              </select>
            </label>
            <label class="block min-w-0 space-y-1.5">
              <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.image_license_status') }}</span>
              <select v-model="form.image_license_status" :disabled="submitting" class="min-h-9 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
                <option value="">{{ $t('components.dialogs.image_status_unspecified') }}</option>
                <option value="documented">{{ $t('components.dialogs.image_license_documented') }}</option>
                <option value="undocumented">{{ $t('components.dialogs.image_license_undocumented') }}</option>
                <option value="territory_limited">{{ $t('components.dialogs.image_license_territory_limited') }}</option>
              </select>
            </label>
          </fieldset>
        </section>

        <section :ref="element => setPanelRef('translations', element)" v-show="activeTab === 'translations'" id="reference-panel-translations" role="tabpanel" aria-labelledby="reference-tab-translations" class="space-y-5 py-1">
          <div><h3 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.translations_title') }}</h3><p class="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.translations_hint') }}</p></div>
          <div role="tablist" :aria-label="$t('components.dialogs.translation_languages') as string" class="flex gap-5 border-b border-gray-200/80 dark:border-neutral-700/80">
            <button v-for="(language, index) in translationLanguages" :key="language" :ref="element => setLanguageTabRef(language, element)" type="button" role="tab" :aria-selected="activeTranslationLanguage === language" :tabindex="activeTranslationLanguage === language ? 0 : -1" :class="['border-b-2 pb-2.5 font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0', activeTranslationLanguage === language ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']" @click="activeTranslationLanguage = language" @keydown="onLanguageTabKeydown($event, index)">{{ language === 'en' ? $t('components.dialogs.translation_english') : $t('components.dialogs.translation_french') }}</button>
          </div>
          <section :aria-label="activeTranslationLanguage === 'en' ? $t('components.dialogs.translation_english') as string : $t('components.dialogs.translation_french') as string" class="space-y-3 pt-1">
            <label class="block space-y-1.5"><span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.translated_title') }}</span><input v-model="form.translations[activeTranslationLanguage].name" type="text" :placeholder="$t('components.dialogs.translated_title') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100"></label>
            <label class="block space-y-1.5"><span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.description') }}</span><textarea v-model="form.translations[activeTranslationLanguage].description" :placeholder="$t('components.dialogs.description') as string" rows="4" :disabled="submitting" class="min-h-28 w-full resize-y rounded-xl bg-gray-100/80 px-4 py-3 font-sans text-sm leading-relaxed text-gray-900 outline-none placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-500" /></label>
          </section>
        </section>
      </div>
    </form>

    <template #footer>
      <div class="w-full flex justify-end gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
        <NButton btn="ghost-gray" class="min-h-10 rounded-1 px-4 font-600" :disabled="submitting" @click="isOpen = false">{{ $t('components.app_dialog.cancel') }}</NButton>
        <NButton btn="solid-black" type="button" :disabled="!titleQuery.trim() || submitting" :loading="submitting" class="min-h-10 rounded-1 px-4" @click="submitReference">{{ submitButtonText }}<NIcon v-if="!submitting" name="i-ph-check" class="ml-2 h-4 w-4" /></NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

type ReferenceEditorTab = 'details' | 'image' | 'translations'
type ReferenceTranslationLanguage = 'en' | 'fr'

interface Props {
  modelValue: boolean
  editReference?: QuoteReference | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'reference-added'): void
  (e: 'reference-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editReference)
const dialogTitle = computed(() => isEditMode.value ? $t('components.dialogs.edit_reference') : $t('components.dialogs.add_reference'))
const submitButtonText = computed(() => isEditMode.value ? $t('components.dialogs.update_reference') : $t('components.dialogs.create_reference'))
const activeTab = ref<ReferenceEditorTab>('details')
const activeTranslationLanguage = ref<ReferenceTranslationLanguage>('en')
const referenceTabs = computed(() => [
  { id: 'details' as const, label: String($t('components.dialogs.reference_tab_details')) },
  { id: 'image' as const, label: String($t('components.dialogs.reference_tab_image')) },
  { id: 'translations' as const, label: String($t('components.dialogs.reference_tab_translations')) }
])
const tabButtonRefs = ref<Record<ReferenceEditorTab, HTMLButtonElement | null>>({ details: null, image: null, translations: null })
const panelRefs = ref<Record<ReferenceEditorTab, HTMLElement | null>>({ details: null, image: null, translations: null })
const panelHeight = ref(0)
const panelViewportRef = ref<HTMLElement | null>(null)
const languageTabButtonRefs = ref<Record<ReferenceTranslationLanguage, HTMLButtonElement | null>>({ en: null, fr: null })

const setPanelRef = (tab: ReferenceEditorTab, element: Element | ComponentPublicInstance | null) => {
  panelRefs.value[tab] = element as HTMLElement | null
}

const measureActivePanel = async (preserveCurrentHeight = false) => {
  if (preserveCurrentHeight && props.modelValue && panelViewportRef.value) {
    panelHeight.value = panelViewportRef.value.getBoundingClientRect().height
    await nextTick()
    panelViewportRef.value.getBoundingClientRect()
  }

  await nextTick()
  if (!props.modelValue) return
  panelHeight.value = panelRefs.value[activeTab.value]?.scrollHeight ?? 0
}

const setTabRef = (tab: ReferenceEditorTab, element: Element | ComponentPublicInstance | null) => {
  tabButtonRefs.value[tab] = element as HTMLButtonElement | null
}

const setLanguageTabRef = (language: ReferenceTranslationLanguage, element: Element | ComponentPublicInstance | null) => {
  languageTabButtonRefs.value[language] = element as HTMLButtonElement | null
}

const onTabKeydown = (event: KeyboardEvent, currentIndex: number) => {
  const lastIndex = referenceTabs.value.length - 1
  const nextIndex = event.key === 'ArrowRight'
    ? (currentIndex + 1) % referenceTabs.value.length
    : event.key === 'ArrowLeft'
      ? (currentIndex - 1 + referenceTabs.value.length) % referenceTabs.value.length
      : event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : -1
  if (nextIndex < 0) return
  event.preventDefault()
  const tab = referenceTabs.value[nextIndex]!
  activeTab.value = tab.id
  nextTick(() => tabButtonRefs.value[tab.id]?.focus())
}

const onLanguageTabKeydown = (event: KeyboardEvent, currentIndex: number) => {
  const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    ? (currentIndex + 1) % translationLanguages.length
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      ? (currentIndex - 1 + translationLanguages.length) % translationLanguages.length
      : event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? translationLanguages.length - 1
          : -1
  if (nextIndex < 0) return
  event.preventDefault()
  const language = translationLanguages[nextIndex]!
  activeTranslationLanguage.value = language
  nextTick(() => languageTabButtonRefs.value[language]?.focus())
}

const emptyImageAttribution = () => ({ image_alt: '', image_credit: '', image_source_url: '', image_license: '', image_date: '', image_location: '' })
type ReferenceImageCreditStatus = NonNullable<QuoteReference['image_credit_status']>
type ReferenceImageLicenseStatus = NonNullable<QuoteReference['image_license_status']>
const translationLanguages: ReferenceTranslationLanguage[] = ['en', 'fr']
const emptyTranslations = () => ({ en: { name: '', description: '' }, fr: { name: '', description: '' } })
const readTranslations = (rows?: QuoteReference['translations']) => {
  const result = emptyTranslations()
  for (const row of rows || []) {
    if (row.language === 'en' || row.language === 'fr') {
      result[row.language] = { name: row.name || '', description: row.description || '' }
    }
  }
  return result
}

const form = ref({
  name: '',
  primary_type: { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
  secondary_type: '',
  release_date: '',
  original_language: { label: 'English', value: 'en' },
  image_url: '',
  image_credit_status: '' as ReferenceImageCreditStatus | '',
  image_license_status: '' as ReferenceImageLicenseStatus | '',
  image_attribution: emptyImageAttribution(),
  description: '',
  translations: emptyTranslations()
})

const titleQuery = ref('')
const titleSuggestions = ref<QuoteReference[]>([])
const showTitleSuggestions = ref(false)
const submitting = ref(false)

const selectedTitleIndex = ref(-1)

const titleInputRef = ref<HTMLInputElement | null>(null)
const titleSuggestionsRef = ref()
const referencePreviewErrored = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const { uploading, uploadImage } = useImageUpload()
const { showErrorToast } = useErrorToast()

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const url = await uploadImage(file)
  if (url) {
    form.value.image_url = url
  }
  target.value = ''
}

const referencePreviewUrl = computed(() => {
  const value = form.value.image_url.trim()
  return value || ''
})

const primaryTypeOptions = [
  { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
  { label: 'Film', value: 'film' as QuoteReferencePrimaryType },
  { label: 'TV Series', value: 'tv_series' as QuoteReferencePrimaryType },
  { label: 'Music', value: 'music' as QuoteReferencePrimaryType },
  { label: 'Speech', value: 'speech' as QuoteReferencePrimaryType },
  { label: 'Podcast', value: 'podcast' as QuoteReferencePrimaryType },
  { label: 'Interview', value: 'interview' as QuoteReferencePrimaryType },
  { label: 'Documentary', value: 'documentary' as QuoteReferencePrimaryType },
  { label: 'Media Stream', value: 'media_stream' as QuoteReferencePrimaryType },
  { label: 'Writings', value: 'writings' as QuoteReferencePrimaryType },
  { label: 'Video Game', value: 'video_game' as QuoteReferencePrimaryType },
  { label: 'Other', value: 'other' as QuoteReferencePrimaryType }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' }
]

const searchReferences = useDebounceFn(async () => {
  if (!titleQuery.value.trim() || titleQuery.value.trim().length < 2) {
    titleSuggestions.value = []
    return
  }

  try {
    const response = await $fetch<ApiResponse<QuoteReference[]>, '/api/references/search'>('/api/references/search', {
      query: { q: titleQuery.value, limit: 5 }
    })
    titleSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching references:', error)
    titleSuggestions.value = []
  }
}, 300)

const handleTitleInputFocus = () => {
  showTitleSuggestions.value = true
  selectedTitleIndex.value = -1
}

const handleTitleInputBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && titleSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }, 150)
}

const handleTitleSuggestionsBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && titleInputRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }, 150)
}

const handleTitleKeydown = (event: KeyboardEvent) => {
  if (!showTitleSuggestions.value) return

  const totalItems = titleSuggestions.value.length + (titleQuery.value && !titleSuggestions.value.some(r => r.name.toLowerCase() === titleQuery.value.toLowerCase()) ? 1 : 0)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedTitleIndex.value = selectedTitleIndex.value < totalItems - 1 ? selectedTitleIndex.value + 1 : 0
      scrollToSelectedTitleItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedTitleIndex.value = selectedTitleIndex.value > 0 ? selectedTitleIndex.value - 1 : totalItems - 1
      scrollToSelectedTitleItem()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedTitleIndex.value >= 0) {
        if (selectedTitleIndex.value < titleSuggestions.value.length) {
           selectExistingReference(titleSuggestions.value[selectedTitleIndex.value]!)
        } else {
          useNewReferenceTitle()
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      showTitleSuggestions.value = false
      selectedTitleIndex.value = -1
      titleInputRef.value?.focus()
      break
  }
}

const scrollToSelectedTitleItem = () => {
  nextTick(() => {
    if (selectedTitleIndex.value >= 0 && titleSuggestionsRef.value) {
      const items = titleSuggestionsRef.value.children
      const selectedItem = items[selectedTitleIndex.value]
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      }
    }
  })
}

const selectExistingReference = (reference: QuoteReference) => {
  const primaryTypeOption = primaryTypeOptions.find(opt => opt.value === reference.primary_type)
  const languageOption = languageOptions.find(opt => opt.value === reference.original_language)

  form.value = {
    name: reference.name,
    primary_type: primaryTypeOption || { label: 'Other', value: 'other' as QuoteReferencePrimaryType },
    secondary_type: reference.secondary_type || '',
    release_date: reference.release_date || '',
    original_language: languageOption || { label: 'English', value: 'en' },
    image_url: reference.image_url || '',
    image_credit_status: reference.image_credit_status || '',
    image_license_status: reference.image_license_status || '',
    image_attribution: {
      image_alt: reference.image_alt || '', image_credit: reference.image_credit || '', image_source_url: reference.image_source_url || '',
      image_license: reference.image_license || '', image_date: reference.image_date || '', image_location: reference.image_location || ''
    },
    description: reference.description || '',
    translations: emptyTranslations()
  }
  titleQuery.value = reference.name
  showTitleSuggestions.value = false
  selectedTitleIndex.value = -1
}

const useNewReferenceTitle = () => {
  form.value.name = titleQuery.value
  showTitleSuggestions.value = false
  selectedTitleIndex.value = -1
}

const resetForm = () => {
  form.value = {
    name: '',
    primary_type: { label: 'Book', value: 'book' as QuoteReferencePrimaryType },
    secondary_type: '',
    release_date: '',
    original_language: { label: 'English', value: 'en' },
    image_url: '',
    image_credit_status: '' as ReferenceImageCreditStatus | '',
    image_license_status: '' as ReferenceImageLicenseStatus | '',
    image_attribution: emptyImageAttribution(),
    description: '',
    translations: emptyTranslations()
  }
  titleQuery.value = ''
  titleSuggestions.value = []
  selectedTitleIndex.value = -1
  referencePreviewErrored.value = false
}

const initializeFormForEdit = () => {
  if (!props.editReference) return

  const reference = props.editReference
  const primaryTypeOption = primaryTypeOptions.find(opt => opt.value === reference.primary_type)
  const languageOption = languageOptions.find(opt => opt.value === reference.original_language)

  form.value = {
    name: reference.name,
    primary_type: primaryTypeOption || { label: 'Other', value: 'other' as QuoteReferencePrimaryType },
    secondary_type: reference.secondary_type || '',
    release_date: reference.release_date || '',
    original_language: languageOption || { label: 'English', value: 'en' },
    image_url: reference.image_url || '',
    image_credit_status: reference.image_credit_status || '',
    image_license_status: reference.image_license_status || '',
    image_attribution: {
      image_alt: reference.image_alt || '', image_credit: reference.image_credit || '', image_source_url: reference.image_source_url || '',
      image_license: reference.image_license || '', image_date: reference.image_date || '', image_location: reference.image_location || ''
    },
    description: reference.description || '',
    translations: readTranslations(reference.translations)
  }
  titleQuery.value = reference.name
}

const closeDialog = () => {
  isOpen.value = false
  resetForm()
}

watch(() => form.value.image_url, () => {
  referencePreviewErrored.value = false
})

watch(() => props.editReference, (newReference) => {
  if (newReference) {
    initializeFormForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (open) => {
  if (open) {
    activeTab.value = 'details'
    activeTranslationLanguage.value = 'en'
    void measureActivePanel()
  } else {
    panelHeight.value = 0
  }
})

watch(activeTab, () => { void measureActivePanel(true) })
watch(activeTranslationLanguage, () => { void measureActivePanel() })

const submitReference = async () => {
  if (!titleQuery.value.trim() || !form.value.primary_type.value) return

  submitting.value = true
  try {
    form.value.name = titleQuery.value.trim()

    const payload: CreateQuoteReferenceData | UpdateQuoteReferenceData = {
      name: form.value.name,
      primary_type: form.value.primary_type.value,
      secondary_type: form.value.secondary_type.trim() || null,
      release_date: form.value.release_date || null,
      original_language: form.value.original_language.value,
      image_url: form.value.image_url.trim() || null,
      image_credit_status: form.value.image_credit_status || null,
      image_license_status: form.value.image_license_status || null,
      image_alt: form.value.image_attribution.image_alt.trim() || null,
      image_credit: form.value.image_attribution.image_credit.trim() || null,
      image_source_url: form.value.image_attribution.image_source_url.trim() || null,
      image_license: form.value.image_attribution.image_license.trim() || null,
      image_date: form.value.image_attribution.image_date.trim() || null,
      image_location: form.value.image_attribution.image_location.trim() || null,
      description: form.value.description.trim() || null,
      translations: {
        en: { name: form.value.translations.en.name.trim() || null, description: form.value.translations.en.description.trim() || null },
        fr: { name: form.value.translations.fr.name.trim() || null, description: form.value.translations.fr.description.trim() || null }
      }
    }

    if (isEditMode.value && props.editReference) {
      const updateReferencePath = `/api/admin/references/${props.editReference.id}` as '/api/admin/references/:id'
      await $fetch<{ success: boolean }, '/api/admin/references/:id'>(updateReferencePath, {
        method: 'PUT',
        body: payload
      })

      emit('reference-updated')
    } else {
      await $fetch<{ success: boolean }, '/api/admin/references'>('/api/admin/references', {
        method: 'POST',
        body: payload
      })

      emit('reference-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting reference:', error)
    showErrorToast(error, isEditMode.value ? String($t('components.dialogs.toast_error')) : String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showTitleSuggestions.value = false
    selectedTitleIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
