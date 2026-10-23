<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitButtonText as string"
    :submitting="submitting"
    :can-submit="!!nameQuery.trim()"
    title-class="sr-only"
    hide-header-border
    max-width="2xl"
    scrollable
    @submit="submitAuthor"
  >
    <template #header-title>
      <div class="min-w-0 flex-1">
        <div role="tablist" :aria-label="$t('components.dialogs.author_sections') as string" class="flex min-w-0 gap-2 overflow-x-auto px-2 sm:gap-7 sm:px-3">
          <button
            v-for="(tab, index) in authorTabs"
            :key="tab.id"
            :ref="element => setTabRef(tab.id, element)"
            type="button"
            role="tab"
            :id="`author-tab-${tab.id}`"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`author-panel-${tab.id}`"
            :tabindex="activeTab === tab.id ? 0 : -1"
            :class="['flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 font-sans text-xs transition-colors focus-visible:outline-none focus-visible:ring-0 sm:text-sm', activeTab === tab.id ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']"
            @click="activeTab = tab.id"
            @keydown="onTabKeydown($event, index)"
          >
            <NAvatar v-if="tab.id === 'image'" :src="authorPreviewUrl" :alt="$t('components.dialogs.avatar_preview') as string" size="xs" rounded="full" class="h-5 w-5 shrink-0" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </template>

    <form @submit.prevent="submitAuthor" @keydown.ctrl.enter.prevent="submitAuthor" @keydown.meta.enter.prevent="submitAuthor" class="space-y-5 px-1 sm:px-2">
      <div ref="panelViewportRef" :style="panelHeight ? { height: `${panelHeight}px` } : undefined" class="relative overflow-hidden px-1 transition-[height] duration-300 ease-in-out motion-reduce:transition-none">
      <section :ref="element => setPanelRef('profile', element)" v-show="activeTab === 'profile'" id="author-panel-profile" role="tabpanel" aria-labelledby="author-tab-profile" class="space-y-5 py-1">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block min-w-0 space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.name') }}</span>
            <div class="relative">
              <input
                ref="nameInputRef"
                v-model="nameQuery"
                type="text"
                :placeholder="$t('components.dialogs.placeholder_name') as string"
                :disabled="submitting"
                required
                autofocus
                class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100"
                @input="searchAuthors"
                @focus="handleNameInputFocus"
                @blur="handleNameInputBlur"
                @keydown="handleNameKeydown"
              >
              <div v-if="showNameSuggestions && (nameSuggestions.length > 0 || nameQuery)" ref="nameSuggestionsRef" class="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleNameSuggestionsBlur" @keydown="handleNameKeydown">
                <button v-for="(author, index) in nameSuggestions" :key="author.id" type="button" :class="['flex w-full items-center px-3 py-2 text-left transition-colors', selectedNameIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectExistingAuthor(author)" @mouseenter="selectedNameIndex = index">
                  <span class="min-w-0 flex-1"><span class="block truncate font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ author.name }}</span><span v-if="author.job" class="block truncate font-sans text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</span></span>
                </button>
                <button v-if="nameQuery && !nameSuggestions.some(author => author.name.toLowerCase() === nameQuery.toLowerCase())" type="button" :class="['w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm dark:border-neutral-700', selectedNameIndex === nameSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="useNewAuthorName" @mouseenter="selectedNameIndex = nameSuggestions.length">{{ $t('components.dialogs.create_new_author', { name: nameQuery }) }}</button>
              </div>
            </div>
          </label>
          <label class="block min-w-0 space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.job_title') }}</span>
            <input v-model="form.job" type="text" :placeholder="$t('components.dialogs.job_title') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-base text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
          </label>
        </div>

        <div class="grid gap-5 rounded-xl bg-gray-100/60 p-4 dark:bg-neutral-900/60 sm:grid-cols-2">
          <AuthorLifeDateInput v-model="form.birth_life_date" :label="$t('components.dialogs.birth_date') as string" :disabled="submitting" />
          <AuthorLifeDateInput v-model="form.death_life_date" :label="$t('components.dialogs.death_date') as string" :disabled="submitting" />
          <p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:col-span-2">{{ $t('components.dialogs.alive_hint') }}</p>
        </div>

        <label class="flex items-center justify-between gap-4 border-y border-gray-200/80 py-3 dark:border-neutral-700/80">
          <span class="min-w-0"><span class="block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('components.dialogs.fictional_char') }}</span><span class="mt-0.5 block font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.fictional_hint') }}</span></span>
          <NSwitch v-model="form.is_fictional" :disabled="submitting" :style="{ backgroundColor: form.is_fictional ? '#ADFA1B' : undefined }" />
        </label>

        <label class="block space-y-1.5">
          <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.description') }}</span>
          <textarea v-model="form.description" :placeholder="$t('components.dialogs.placeholder_desc') as string" rows="5" :disabled="submitting" class="min-h-32 w-full resize-y rounded-xl bg-gray-100/80 px-4 py-3 font-sans text-sm leading-relaxed text-gray-900 outline-none placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-500" />
        </label>
      </section>

      <section :ref="element => setPanelRef('image', element)" v-show="activeTab === 'image'" id="author-panel-image" role="tabpanel" aria-labelledby="author-tab-image" class="space-y-5 py-1">
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
          <label class="block min-w-0 space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.image_url') }}</span>
            <input v-model="form.image_url" type="url" :placeholder="$t('components.dialogs.placeholder_url') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100">
            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">
          </label>
          <div class="flex min-w-0 items-center gap-4 rounded-xl bg-gray-100/60 p-4 dark:bg-neutral-900/60">
            <button type="button" class="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:bg-neutral-800" :aria-label="$t('components.dialogs.upload_hint') as string" :disabled="submitting || uploading" @click="fileInputRef?.click()">
              <img v-if="authorPreviewUrl && !authorPreviewErrored" :src="authorPreviewUrl" :alt="$t('components.dialogs.avatar_preview') as string" class="h-full w-full object-cover" @error="authorPreviewErrored = true">
              <span v-else class="flex h-full w-full items-center justify-center"><NIcon name="i-ph-user" class="h-8 w-8 text-gray-500 dark:text-gray-400" /></span>
              <span class="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"><NIcon :name="uploading ? 'i-ph-circle-notch' : 'i-ph-upload'" class="h-5 w-5" :class="uploading ? 'animate-spin' : ''" /></span>
            </button>
            <div class="min-w-0"><p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.avatar_preview') }}</p><button type="button" class="mt-1 text-left font-sans text-sm text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" @click="fileInputRef?.click()">{{ $t('components.dialogs.upload_hint') }}</button></div>
          </div>
        </div>
        <AdminImageAttributionFields v-model="form.image_attribution" :disabled="submitting" />
      </section>

      <section :ref="element => setPanelRef('translations', element)" v-show="activeTab === 'translations'" id="author-panel-translations" role="tabpanel" aria-labelledby="author-tab-translations" class="space-y-5 py-1">
        <div><h3 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.translations_title') }}</h3><p class="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.translations_hint') }}</p></div>
        <div role="tablist" :aria-label="$t('components.dialogs.translation_languages') as string" class="flex gap-5 border-b border-gray-200/80 dark:border-neutral-700/80">
              <button v-for="(language, index) in translationLanguages" :key="language" :ref="element => setLanguageTabRef(language, element)" type="button" role="tab" :aria-selected="activeTranslationLanguage === language" :tabindex="activeTranslationLanguage === language ? 0 : -1" :class="['border-b-2 pb-2.5 font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0', activeTranslationLanguage === language ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200']" @click="activeTranslationLanguage = language" @keydown="onLanguageTabKeydown($event, index)">{{ language === 'en' ? $t('components.dialogs.translation_english') : $t('components.dialogs.translation_french') }}</button>
        </div>
        <section :aria-label="activeTranslationLanguage === 'en' ? $t('components.dialogs.translation_english') as string : $t('components.dialogs.translation_french') as string" class="space-y-3 pt-1">
          <label class="block space-y-1.5"><span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.job_title') }}</span><input v-model="form.translations[activeTranslationLanguage].job" type="text" :placeholder="$t('components.dialogs.job_title') as string" :disabled="submitting" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100"></label>
          <label class="block space-y-1.5"><span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.description') }}</span><textarea v-model="form.translations[activeTranslationLanguage].description" :placeholder="$t('components.dialogs.description') as string" rows="4" :disabled="submitting" class="min-h-28 w-full resize-y rounded-xl bg-gray-100/80 px-4 py-3 font-sans text-sm leading-relaxed text-gray-900 outline-none placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-500" /></label>
        </section>
      </section>
      </div>
    </form>

    <template #footer>
      <div class="w-full flex justify-end gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
        <NButton btn="ghost-gray" class="min-h-10 rounded-1 px-4 font-600" :disabled="submitting" @click="isOpen = false">
          {{ $t('components.app_dialog.cancel') }}
        </NButton>
        <NButton btn="solid-black" type="button" :disabled="!nameQuery.trim() || submitting" :loading="submitting" class="min-h-10 rounded-1 px-4" @click="submitAuthor">
          {{ submitButtonText }}
          <NIcon v-if="!submitting" name="i-ph-check" class="ml-2 h-4 w-4" />
        </NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { AuthorLifeDate } from '#shared/types/author-life-date'
import { parseAuthorLifeDate, serializeAuthorLifeDate } from '#shared/utils/author-life-date'

type AuthorEditorTab = 'profile' | 'image' | 'translations'
type AuthorTranslationLanguage = 'en' | 'fr'

interface Props {
  modelValue: boolean
  editAuthor?: Author | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'author-added'): void
  (e: 'author-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editAuthor)
const dialogTitle = computed(() => isEditMode.value ? String($t('components.dialogs.edit_author')) : String($t('components.dialogs.add_author')))
const submitButtonText = computed(() => isEditMode.value ? String($t('components.dialogs.update_author')) : String($t('components.dialogs.create_author')))
const activeTab = ref<AuthorEditorTab>('profile')
const activeTranslationLanguage = ref<AuthorTranslationLanguage>('en')
const authorTabs = computed(() => [
  { id: 'profile' as const, label: String($t('components.dialogs.author_tab_profile')) },
  { id: 'image' as const, label: String($t('components.dialogs.author_tab_image')) },
  { id: 'translations' as const, label: String($t('components.dialogs.author_tab_translations')) }
])
const tabButtonRefs = ref<Record<AuthorEditorTab, HTMLButtonElement | null>>({ profile: null, image: null, translations: null })
const panelRefs = ref<Record<AuthorEditorTab, HTMLElement | null>>({ profile: null, image: null, translations: null })
const panelHeight = ref(0)
const panelViewportRef = ref<HTMLElement | null>(null)
const languageTabButtonRefs = ref<Record<AuthorTranslationLanguage, HTMLButtonElement | null>>({ en: null, fr: null })

const setPanelRef = (tab: AuthorEditorTab, element: Element | ComponentPublicInstance | null) => {
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

const setTabRef = (tab: AuthorEditorTab, element: Element | ComponentPublicInstance | null) => {
  tabButtonRefs.value[tab] = element as HTMLButtonElement | null
}

const setLanguageTabRef = (language: AuthorTranslationLanguage, element: Element | ComponentPublicInstance | null) => {
  languageTabButtonRefs.value[language] = element as HTMLButtonElement | null
}

const onTabKeydown = (event: KeyboardEvent, currentIndex: number) => {
  const lastIndex = authorTabs.value.length - 1
  const nextIndex = event.key === 'ArrowRight'
    ? (currentIndex + 1) % authorTabs.value.length
    : event.key === 'ArrowLeft'
      ? (currentIndex - 1 + authorTabs.value.length) % authorTabs.value.length
      : event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : -1
  if (nextIndex < 0) return
  event.preventDefault()
  const tab = authorTabs.value[nextIndex]!
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
const translationLanguages: AuthorTranslationLanguage[] = ['en', 'fr']
const emptyTranslations = () => ({ en: { job: '', description: '' }, fr: { job: '', description: '' } })
const readTranslations = (rows?: Author['translations']) => {
  const result = emptyTranslations()
  for (const row of rows || []) {
    if (row.language === 'en' || row.language === 'fr') {
      result[row.language] = { job: row.job || '', description: row.description || '' }
    }
  }
  return result
}

const form = ref({
  name: '',
  job: '',
  birth_life_date: null as AuthorLifeDate | null,
  death_life_date: null as AuthorLifeDate | null,
  image_url: '',
  image_attribution: emptyImageAttribution(),
  is_fictional: false,
  description: '',
  translations: emptyTranslations()
})

const nameQuery = ref('')
const nameSuggestions = ref<Author[]>([])
const showNameSuggestions = ref(false)
const submitting = ref(false)

const selectedNameIndex = ref(-1)

const nameInputRef = ref()
const nameSuggestionsRef = ref()
const authorPreviewErrored = ref(false)
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

const authorPreviewUrl = computed(() => {
  const value = form.value.image_url.trim()
  return value || ''
})

const searchAuthors = useDebounceFn(async () => {
  if (!nameQuery.value.trim() || nameQuery.value.trim().length < 2) {
    nameSuggestions.value = []
    return
  }

  try {
    const response = await $fetch('/api/authors/search', {
      query: { q: nameQuery.value, limit: 5 }
    })
    nameSuggestions.value = response.data || []
  } catch (error) {
    console.error('Error searching authors:', error)
    nameSuggestions.value = []
  }
}, 300)

const handleNameInputFocus = () => {
  showNameSuggestions.value = true
  selectedNameIndex.value = -1
}

const handleNameInputBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && nameSuggestionsRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }, 150)
}

const handleNameSuggestionsBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && nameInputRef.value?.contains(relatedTarget)) {
    return
  }
  setTimeout(() => {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }, 150)
}

const handleNameKeydown = (event: KeyboardEvent) => {
  if (!showNameSuggestions.value) return

  const totalItems = nameSuggestions.value.length + (nameQuery.value && !nameSuggestions.value.some(a => a.name.toLowerCase() === nameQuery.value.toLowerCase()) ? 1 : 0)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedNameIndex.value = selectedNameIndex.value < totalItems - 1 ? selectedNameIndex.value + 1 : 0
      scrollToSelectedNameItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedNameIndex.value = selectedNameIndex.value > 0 ? selectedNameIndex.value - 1 : totalItems - 1
      scrollToSelectedNameItem()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedNameIndex.value >= 0) {
        if (selectedNameIndex.value < nameSuggestions.value.length) {
          selectExistingAuthor(nameSuggestions.value[selectedNameIndex.value]!)
        } else {
          useNewAuthorName()
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      showNameSuggestions.value = false
      selectedNameIndex.value = -1
      nameInputRef.value?.$el?.focus()
      break
  }
}

const scrollToSelectedNameItem = () => {
  nextTick(() => {
    if (selectedNameIndex.value >= 0 && nameSuggestionsRef.value) {
      const items = nameSuggestionsRef.value.children
      const selectedItem = items[selectedNameIndex.value]
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

const selectExistingAuthor = (author: Author) => {
  form.value = {
    name: author.name,
    job: author.job || '',
    birth_life_date: author.birth_year ? { year: author.birth_year, era: author.birth_era || 'ce', month: author.birth_month, day: author.birth_day, approximate: author.birth_is_approximate, calendar: author.birth_calendar } : parseAuthorLifeDate(author.birth_date),
    death_life_date: author.death_year ? { year: author.death_year, era: author.death_era || 'ce', month: author.death_month, day: author.death_day, approximate: author.death_is_approximate, calendar: author.death_calendar } : parseAuthorLifeDate(author.death_date),
    image_url: author.image_url || '',
    image_attribution: {
      image_alt: author.image_alt || '', image_credit: author.image_credit || '', image_source_url: author.image_source_url || '',
      image_license: author.image_license || '', image_date: author.image_date || '', image_location: author.image_location || ''
    },
    is_fictional: author.is_fictional,
    description: author.description || '',
    translations: emptyTranslations()
  }
  nameQuery.value = author.name
  showNameSuggestions.value = false
  selectedNameIndex.value = -1
}

const useNewAuthorName = () => {
  form.value.name = nameQuery.value
  showNameSuggestions.value = false
  selectedNameIndex.value = -1
}

const resetForm = () => {
  form.value = {
    name: '',
    job: '',
    birth_life_date: null,
    death_life_date: null,
    image_url: '',
    image_attribution: emptyImageAttribution(),
    is_fictional: false,
    description: '',
    translations: emptyTranslations()
  }
  nameQuery.value = ''
  nameSuggestions.value = []
  selectedNameIndex.value = -1
  authorPreviewErrored.value = false
}

const initializeFormForEdit = () => {
  if (!props.editAuthor) return

  const author = props.editAuthor
  form.value = {
    name: author.name,
    job: author.job || '',
    birth_life_date: author.birth_year ? { year: author.birth_year, era: author.birth_era || 'ce', month: author.birth_month, day: author.birth_day, approximate: author.birth_is_approximate, calendar: author.birth_calendar } : parseAuthorLifeDate(author.birth_date),
    death_life_date: author.death_year ? { year: author.death_year, era: author.death_era || 'ce', month: author.death_month, day: author.death_day, approximate: author.death_is_approximate, calendar: author.death_calendar } : parseAuthorLifeDate(author.death_date),
    image_url: author.image_url || '',
    image_attribution: {
      image_alt: author.image_alt || '', image_credit: author.image_credit || '', image_source_url: author.image_source_url || '',
      image_license: author.image_license || '', image_date: author.image_date || '', image_location: author.image_location || ''
    },
    is_fictional: author.is_fictional,
    description: author.description || '',
    translations: readTranslations(author.translations)
  }
  nameQuery.value = author.name
}

const closeDialog = () => {
  isOpen.value = false
}

watch(() => form.value.image_url, () => {
  authorPreviewErrored.value = false
})

watch(() => props.editAuthor, (newAuthor) => {
  if (newAuthor) {
    initializeFormForEdit()
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (open) => {
  if (open) {
    activeTab.value = 'profile'
    activeTranslationLanguage.value = 'en'
    void measureActivePanel()
  } else {
    panelHeight.value = 0
  }
})

watch(activeTab, () => { void measureActivePanel(true) })
watch(activeTranslationLanguage, () => { void measureActivePanel() })

const submitAuthor = async () => {
  if (!nameQuery.value.trim()) return

  submitting.value = true
  try {
    form.value.name = nameQuery.value.trim()

    const payload: CreateAuthorData | UpdateAuthorData = {
      name: form.value.name,
      job: form.value.job.trim() || null,
      ...lifeDatePayload('birth', form.value.birth_life_date),
      ...lifeDatePayload('death', form.value.death_life_date),
      image_url: form.value.image_url.trim() || null,
      image_alt: form.value.image_attribution.image_alt.trim() || null,
      image_credit: form.value.image_attribution.image_credit.trim() || null,
      image_source_url: form.value.image_attribution.image_source_url.trim() || null,
      image_license: form.value.image_attribution.image_license.trim() || null,
      image_date: form.value.image_attribution.image_date.trim() || null,
      image_location: form.value.image_attribution.image_location.trim() || null,
      is_fictional: form.value.is_fictional,
      description: form.value.description.trim() || null,
      translations: {
        en: { job: form.value.translations.en.job.trim() || null, description: form.value.translations.en.description.trim() || null },
        fr: { job: form.value.translations.fr.job.trim() || null, description: form.value.translations.fr.description.trim() || null }
      }
    }

    if (isEditMode.value && props.editAuthor) {
      const updateAuthorPath = `/api/admin/authors/${props.editAuthor.id}` as '/api/admin/authors/:id'
      await $fetch<{ success: boolean }, '/api/admin/authors/:id'>(updateAuthorPath, {
        method: 'PUT',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: String($t('components.dialogs.toast_updated')),
        description: String($t('components.dialogs.toast_updated'))
      })

      emit('author-updated')
    } else {
      await $fetch<{ success: boolean }, '/api/admin/authors'>('/api/admin/authors', {
        method: 'POST',
        body: payload
      })

      useToast().toast({
        toast: 'success',
        title: String($t('components.dialogs.toast_created')),
        description: String($t('components.dialogs.toast_created'))
      })

      emit('author-added')
    }

    closeDialog()
  } catch (error) {
    console.error('Error submitting author:', error)
    showErrorToast(error, isEditMode.value ? String($t('components.dialogs.toast_error')) : String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
  }
}

function lifeDatePayload(prefix: 'birth' | 'death', date: AuthorLifeDate | null) {
  return {
    [`${prefix}_date`]: serializeAuthorLifeDate(date),
    [`${prefix}_year`]: date?.year ?? null,
    [`${prefix}_era`]: date?.era ?? 'ce',
    [`${prefix}_month`]: date?.month ?? null,
    [`${prefix}_day`]: date?.day ?? null,
    [`${prefix}_is_approximate`]: date?.approximate ?? false,
    [`${prefix}_calendar`]: date?.calendar ?? 'gregorian-proleptic',
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showNameSuggestions.value = false
    selectedNameIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
