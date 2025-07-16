<template>
  <UDialog v-if="isOpen" v-model:open="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Submit a New Quote</h3>
      </template>

      <form @submit.prevent="submitQuote" class="space-y-4">
        <UFormGroup label="Quote Text" required>
          <UInput
            type="textarea"
            v-model="form.name"
            placeholder="Enter the quote text..."
            :rows="4"
            :maxlength="3000"
          />
          <template #help>
            {{ form.name.length }}/3000 characters
          </template>
        </UFormGroup>

        <UFormGroup label="Author">
          <USelect
            v-model="form.author_id"
            :items="authors"
            item-key="name"
            searchable
            placeholder="Select or search for an author"
          />
        </UFormGroup>

        <UFormGroup label="Reference (Book, Movie, etc.)">
          <USelect
            v-model="form.reference_id"
            :items="references"
            item-key="name"
            searchable
            placeholder="Select or search for a reference"
          />
        </UFormGroup>

        <UFormGroup label="Language">
          <USelect
            v-model="form.language"
            :items="languages"
          />
        </UFormGroup>

        <UFormGroup label="Tags">
          <USelect
            v-model="form.tags"
            :items="tags"
            item-key="name"
            multiple
            placeholder="Add tags..."
          />
        </UFormGroup>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton variant="ghost" @click="isOpen = false">Cancel</UButton>
          <UButton 
            @click="submitQuote" 
            :loading="submitting"
            :disabled="!form.name || form.name.length < 10"
          >
            Submit Quote
          </UButton>
        </div>
      </template>
    </UCard>
  </UDialog>
</template>

<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  name: '',
  author_id: null,
  reference_id: null,
  language: 'en',
  tags: []
})

const submitting = ref(false)

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' }
]

// Load data for dropdowns
const authors = ref([])
const references = ref([])
const tags = ref([])

const loadData = async () => {
  try {
    const [authorsData, referencesData, tagsData] = await Promise.all([
      $fetch('/api/authors'),
      $fetch('/api/references'),
      $fetch('/api/tags')
    ])

    authors.value = authorsData.data || []
    references.value = referencesData.data || []
    tags.value = tagsData.data || []
  } catch (error) {
    console.error('Failed to load form data:', error)
  }
}

// Load data when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    loadData()
  }
})

const submitQuote = async () => {
  submitting.value = true
  try {
    await $fetch('/api/quotes', {
      method: 'POST',
      body: form
    })
    
    // Reset form and close modal
    Object.assign(form, {
      name: '',
      author_id: null,
      reference_id: null,
      language: 'en',
      tags: []
    })
    
    isOpen.value = false
    
    // Show success message
    // TODO: Add toast notification
  } catch (error) {
    // TODO: Handle error
  } finally {
    submitting.value = false
  }
}
</script>
