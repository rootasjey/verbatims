<template>
  <section class="space-y-4 border-t border-dashed border-gray-200 pt-4 dark:border-gray-700">
    <div class="flex justify-end">
      <NButton btn="soft-blue" size="xs" @click="startCreate">Add occurrence</NButton>
    </div>

    <div v-if="occurrences.length" class="space-y-3">
      <article v-for="occurrence in occurrences" :key="occurrence.id" class="border border-gray-200 p-4 dark:border-gray-700">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 space-y-1">
            <p class="text-xs font-600 uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ occurrenceTypeLabel(occurrence.occurrence_type) }}</p>
            <p class="text-sm font-600 text-gray-900 dark:text-white">{{ occurrence.author?.name || 'Unknown person' }}<span v-if="occurrence.reference"> · {{ occurrence.reference.name }}</span></p>
            <p v-if="occurrence.occurred_at || occurrence.date_notes" class="text-xs text-gray-500 dark:text-gray-400">{{ [occurrence.occurred_at, occurrence.date_notes].filter(Boolean).join(' — ') }}</p>
            <p v-if="occurrence.context" class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{{ occurrence.context }}</p>
            <blockquote v-if="occurrence.excerpt" class="border-l-2 border-gray-300 pl-3 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-400">{{ occurrence.excerpt }}</blockquote>
            <p v-if="occurrence.notes" class="text-xs text-gray-500 dark:text-gray-400">{{ occurrence.notes }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <NTooltip content="Edit occurrence"><NButton btn="ghost-gray" size="xs" icon label="i-ph-pencil-simple" aria-label="Edit occurrence" @click="startEdit(occurrence)" /></NTooltip>
            <template v-if="confirmingDelete === occurrence.id">
              <button class="text-xs font-600 text-red-600 hover:underline dark:text-red-400" @click="removeOccurrence(occurrence)">Confirm?</button>
              <button class="text-xs text-gray-500 hover:underline dark:text-gray-400" @click="confirmingDelete = null">Cancel</button>
            </template>
            <NTooltip v-else content="Delete occurrence"><NButton btn="ghost-gray" size="xs" icon label="i-ph-trash" aria-label="Delete occurrence" @click="confirmingDelete = occurrence.id" /></NTooltip>
          </div>
        </div>
      </article>
    </div>
    <p v-else-if="!editingId" class="text-xs text-gray-500 dark:text-gray-400">No occurrences recorded.</p>

    <div v-if="formOpen" class="space-y-3 border border-gray-200 p-4 dark:border-gray-700">
      <label class="block text-xs text-gray-600 dark:text-gray-400">Related attribution (optional)
        <select v-model.number="form.attribution_id" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
          <option :value="null">No specific attribution</option>
          <option v-for="attribution in attributions" :key="attribution.id" :value="attribution.id">{{ attributionLabel(attribution) }}</option>
        </select>
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <AdminEntitySearch v-model="form.author" label="Person associated with this occurrence (optional)" endpoint="/api/authors/search" />
        <AdminEntitySearch v-model="form.reference" label="Work (optional)" endpoint="/api/references/search" />
      </div>
      <label class="block text-xs text-gray-600 dark:text-gray-400">Occurrence type
        <select v-model="form.occurrence_type" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
          <option v-for="type in occurrenceTypes" :key="type" :value="type">{{ occurrenceTypeLabel(type) }}</option>
        </select>
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-xs text-gray-600 dark:text-gray-400">Date
          <input v-model="form.occurred_at" type="date" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
        </label>
        <label class="block text-xs text-gray-600 dark:text-gray-400">Date details (approximate date, source of date)
          <input v-model="form.date_notes" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
        </label>
      </div>
      <label class="block text-xs text-gray-600 dark:text-gray-400">Context
        <textarea v-model="form.context" rows="2" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
      </label>
      <label class="block text-xs text-gray-600 dark:text-gray-400">Exact passage
        <textarea v-model="form.excerpt" rows="2" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
      </label>
      <label class="block text-xs text-gray-600 dark:text-gray-400">Notes
        <textarea v-model="form.notes" rows="2" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
      </label>
      <div class="flex justify-end gap-2">
        <NButton btn="link-gray" size="xs" @click="cancel">Cancel</NButton>
        <NButton btn="soft-blue" size="xs" :disabled="saving" @click="save">Save</NButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const props = defineProps<{ quoteId: number; attributions: QuoteAttribution[]; occurrences: QuoteOccurrence[] }>()
const emit = defineEmits<{ changed: [] }>()
const toast = useToast()
const occurrenceTypes: QuoteOccurrenceType[] = ['origin', 'quotation', 'adaptation', 'performance', 'other']
const editingId = ref<number | null>(null)
const formOpen = ref(false)
const confirmingDelete = ref<number | null>(null)
const saving = ref(false)
const form = reactive({
  attribution_id: null as number | null,
  author: null as Author | null,
  reference: null as QuoteReference | null,
  occurrence_type: 'quotation' as QuoteOccurrenceType,
  occurred_at: '',
  date_notes: '',
  context: '',
  excerpt: '',
  notes: '',
})

const occurrenceTypeLabel = (type: QuoteOccurrenceType) => ({ origin: 'Original appearance', quotation: 'Quotation', adaptation: 'Adaptation', performance: 'Performance', other: 'Other occurrence' })[type]
const attributionLabel = (attribution: QuoteAttribution) => [attribution.author?.name, attribution.reference?.name].filter(Boolean).join(' · ') || `Attribution #${attribution.id}`
const reset = () => {
  editingId.value = null
  formOpen.value = false
  confirmingDelete.value = null
}
const startCreate = () => {
  Object.assign(form, { attribution_id: null, author: null, reference: null, occurrence_type: 'quotation', occurred_at: '', date_notes: '', context: '', excerpt: '', notes: '' })
  editingId.value = null
  formOpen.value = true
}
const startEdit = (occurrence: QuoteOccurrence) => {
  Object.assign(form, {
    attribution_id: occurrence.attribution_id,
    author: occurrence.author ? { id: occurrence.author.id, name: occurrence.author.name } as Author : null,
    reference: occurrence.reference ? { id: occurrence.reference.id, name: occurrence.reference.name } as QuoteReference : null,
    occurrence_type: occurrence.occurrence_type,
    occurred_at: occurrence.occurred_at || '',
    date_notes: occurrence.date_notes || '',
    context: occurrence.context || '',
    excerpt: occurrence.excerpt || '',
    notes: occurrence.notes || '',
  })
  editingId.value = occurrence.id
  formOpen.value = true
}
const cancel = reset
const save = async () => {
  saving.value = true
  try {
    const body = {
      attribution_id: form.attribution_id,
      author_id: form.author?.id ?? null,
      reference_id: form.reference?.id ?? null,
      occurrence_type: form.occurrence_type,
      occurred_at: form.occurred_at || null,
      date_notes: form.date_notes.trim() || null,
      context: form.context.trim() || null,
      excerpt: form.excerpt.trim() || null,
      notes: form.notes.trim() || null,
    }
    if (editingId.value) await $fetch(`/api/admin/quotes/${props.quoteId}/occurrences`, { method: 'PUT', body: { ...body, occurrence_id: editingId.value } })
    else await $fetch(`/api/admin/quotes/${props.quoteId}/occurrences`, { method: 'POST', body })
    reset()
    emit('changed')
  } catch (error) {
    console.error(error)
    toast.toast({ title: 'Could not save occurrence', description: 'Please try again.', toast: 'soft-error' })
  } finally {
    saving.value = false
  }
}
const removeOccurrence = async (occurrence: QuoteOccurrence) => {
  saving.value = true
  try {
    await $fetch(`/api/admin/quotes/${props.quoteId}/occurrences`, { method: 'DELETE', body: { occurrence_id: occurrence.id } })
    confirmingDelete.value = null
    emit('changed')
  } catch (error) {
    console.error(error)
    toast.toast({ title: 'Could not delete occurrence', description: 'Please try again.', toast: 'soft-error' })
  } finally {
    saving.value = false
  }
}
</script>
