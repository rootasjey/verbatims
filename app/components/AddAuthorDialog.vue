<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitButtonText as string"
    :submitting="submitting"
    :can-submit="!!nameQuery.trim()"
    max-width="md"
    scrollable
    @submit="submitAuthor"
  >
    <form @submit.prevent="submitAuthor" @keydown.ctrl.enter.prevent="submitAuthor" @keydown.meta.enter.prevent="submitAuthor" class="space-y-6 m-1">
      <div>
        <div class="relative">
          <NInput
            ref="nameInputRef"
            v-model="nameQuery"
            :placeholder="$t('components.dialogs.placeholder_name') as string"
            :disabled="submitting"
            required
            autofocus
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{
              inputTrailingWrapper: 'pr-1.5'
            }"
            @input="searchAuthors"
            @focus="handleNameInputFocus"
            @blur="handleNameInputBlur"
            @keydown="handleNameKeydown"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('components.dialogs.name') }}
              </NBadge>
            </template>
          </NInput>
          <div
            v-if="showNameSuggestions && (nameSuggestions.length > 0 || nameQuery)"
            ref="nameSuggestionsRef"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
            tabindex="-1"
            @blur="handleNameSuggestionsBlur"
            @keydown="handleNameKeydown"
          >
            <div
              v-for="(author, index) in nameSuggestions"
              :key="author.id"
              :class="[
                'px-3 py-2 cursor-pointer flex items-center space-x-2',
                selectedNameIndex === index
                  ? 'bg-blue-100 dark:bg-blue-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="selectExistingAuthor(author)"
              @mouseenter="selectedNameIndex = index"
            >
              <div class="flex-1">
                <div class="text-sm font-medium">{{ author.name }}</div>
                <div v-if="author.job" class="text-xs text-gray-500">{{ author.job }}</div>
              </div>
            </div>
            <div
              v-if="nameQuery && !nameSuggestions.some(a => a.name.toLowerCase() === nameQuery.toLowerCase())"
              :class="[
                'px-3 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700',
                selectedNameIndex === nameSuggestions.length
                  ? 'bg-blue-100 dark:bg-blue-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="useNewAuthorName"
              @mouseenter="selectedNameIndex = nameSuggestions.length"
            >
              <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                {{ $t('components.dialogs.create_new_author', { name: nameQuery }) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <NInput
        v-model="form.job"
        :placeholder="$t('components.dialogs.job_title') as string"
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{
          inputTrailingWrapper: 'pr-1.5'
        }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            {{ $t('components.dialogs.job_title') }}
          </NBadge>
        </template>
      </NInput>

      <div class="grid gap-4 sm:grid-cols-2">
        <AuthorLifeDateInput v-model="form.birth_life_date" :label="$t('components.dialogs.birth_date') as string" :disabled="submitting" />
        <AuthorLifeDateInput v-model="form.death_life_date" :label="$t('components.dialogs.death_date') as string" :disabled="submitting" />
      </div>
      <p class="-mt-4 text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.alive_hint') }}</p>

      <div>
        <NInput
          v-model="form.image_url"
          type="url"
          :placeholder="$t('components.dialogs.placeholder_url') as string"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{
            inputTrailingWrapper: 'pr-1.5'
          }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('components.dialogs.image_url') }}
            </NBadge>
          </template>
        </NInput>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">

        <div class="mt-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 p-3">
          <div class="flex items-center gap-3">
            <div
              class="relative h-14 w-14 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 cursor-pointer group"
              @click="fileInputRef?.click()"
            >
              <img
                v-if="authorPreviewUrl && !authorPreviewErrored"
                :src="authorPreviewUrl"
                :alt="$t('components.dialogs.avatar_preview') as string"
                class="h-full w-full object-cover"
                @error="authorPreviewErrored = true"
              />
              <div v-else class="h-full w-full flex items-center justify-center">
                <NIcon name="i-ph-user" class="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div class="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/0 group-hover:bg-black/40">
                <NIcon :name="uploading ? 'i-ph-circle-notch' : 'i-ph-upload'" class="w-5 h-5 text-white drop-shadow" :class="uploading ? 'animate-spin' : ''" />
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('components.dialogs.avatar_preview') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                <span class="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline" @click="fileInputRef?.click()">{{ $t('components.dialogs.upload_hint') }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <AdminImageAttributionFields v-model="form.image_attribution" :disabled="submitting" />

      <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3">
        <label class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t('components.dialogs.fictional_char') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ $t('components.dialogs.fictional_hint') }}
            </p>
          </div>
          <NSwitch
            v-model="form.is_fictional"
            :disabled="submitting"
          />
        </label>
      </div>

      <NInput
        type="textarea"
        v-model="form.description"
        :placeholder="$t('components.dialogs.placeholder_desc') as string"
        :rows="6"
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{
          inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial'
        }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            {{ $t('components.dialogs.description') }}
          </NBadge>
        </template>
      </NInput>

      <details class="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
        <summary class="cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200">{{ $t('components.dialogs.translations_title') }}</summary>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.translations_hint') }}</p>
        <div class="mt-4 space-y-4">
          <section v-for="language in translationLanguages" :key="language" class="space-y-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ language === 'en' ? $t('components.dialogs.translation_english') : $t('components.dialogs.translation_french') }}</h4>
            <NInput v-model="form.translations[language].job" :placeholder="$t('components.dialogs.job_title') as string" :disabled="submitting" />
            <NInput v-model="form.translations[language].description" type="textarea" :placeholder="$t('components.dialogs.description') as string" :rows="3" :disabled="submitting" />
          </section>
        </div>
      </details>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import type { AuthorLifeDate } from '#shared/types/author-life-date'
import { parseAuthorLifeDate, serializeAuthorLifeDate } from '#shared/utils/author-life-date'

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

const emptyImageAttribution = () => ({ image_alt: '', image_credit: '', image_source_url: '', image_license: '', image_date: '', image_location: '' })
const translationLanguages = ['en', 'fr'] as const
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
  if (relatedTarget && nameInputRef.value?.$el?.contains(relatedTarget)) {
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
