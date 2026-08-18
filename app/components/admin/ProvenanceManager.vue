<template>
  <section class="border-t b-dashed border-gray-200 dark:border-gray-700 pt-5">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-title text-sm font-600 uppercase text-gray-700 dark:text-gray-300">Provenance</h3>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Manage the people, references, and sources attached to this quote.</p>
      </div>
      <NButton btn="soft-blue" size="xs" @click="startAttribution()">Add attribution</NButton>
    </div>

    <div v-if="attributions.length" class="space-y-3">
      <div v-for="attribution in attributions" :key="attribution.id" class="border border-gray-200 dark:border-gray-700 p-3">
        <div v-if="editingAttribution !== attribution.id" class="flex items-start justify-between gap-3">
          <div class="min-w-0 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex flex-wrap items-center gap-2">
              <span>{{ attribution.author?.name || 'Unknown author' }}</span>
              <span class="text-gray-400">·</span>
              <span>{{ attribution.reference?.name || 'Unknown reference' }}</span>
              <NBadge v-if="attribution.is_primary" badge="soft-blue" size="xs">Primary</NBadge>
              <NBadge :badge="statusBadge(attribution.status)" size="xs">{{ statusLabel(attribution.status) }}</NBadge>
            </div>
            <p v-if="attribution.notes" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ attribution.notes }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button class="text-xs text-blue-600 hover:underline dark:text-blue-400" @click="editAttribution(attribution)">Edit</button>
            <template v-if="confirmingAttribution === attribution.id">
              <button class="text-xs font-600 text-red-600 hover:underline dark:text-red-400" @click="removeAttribution(attribution)">Confirm?</button>
              <button class="text-xs text-gray-500 hover:underline dark:text-gray-400" @click="confirmingAttribution = null">Cancel</button>
            </template>
            <button v-else class="text-xs text-red-600 hover:underline dark:text-red-400" @click="confirmingAttribution = attribution.id">Delete</button>
          </div>
        </div>

        <div v-else class="space-y-3">
          <AdminEntitySearch v-model="attributionForm.author" label="Author" endpoint="/api/authors/search" />
          <AdminEntitySearch v-model="attributionForm.reference" label="Reference" endpoint="/api/references/search" />
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs text-gray-600 dark:text-gray-400">Status
              <select v-model="attributionForm.status" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
                <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
              </select>
            </label>
            <label class="flex items-center gap-2 self-end text-xs text-gray-600 dark:text-gray-400">
              <input v-model="attributionForm.is_primary" type="checkbox"> Primary attribution
            </label>
          </div>
          <textarea v-model="attributionForm.notes" rows="2" placeholder="Notes" class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
          <div class="flex justify-end gap-2">
            <NButton btn="link-gray" size="xs" @click="cancelAttribution">Cancel</NButton>
            <NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveAttribution">Save</NButton>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-xs text-gray-500 dark:text-gray-400">No attribution recorded.</p>

    <div v-if="creatingAttribution" class="mt-3 border border-gray-200 p-3 dark:border-gray-700">
      <div class="space-y-3">
        <AdminEntitySearch v-model="attributionForm.author" label="Author" endpoint="/api/authors/search" />
        <AdminEntitySearch v-model="attributionForm.reference" label="Reference" endpoint="/api/references/search" />
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-xs text-gray-600 dark:text-gray-400">Status
            <select v-model="attributionForm.status" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select>
          </label>
          <label class="flex items-center gap-2 self-end text-xs text-gray-600 dark:text-gray-400"><input v-model="attributionForm.is_primary" type="checkbox"> Primary attribution</label>
        </div>
        <textarea v-model="attributionForm.notes" rows="2" placeholder="Notes" class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
        <div class="flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelAttribution">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveAttribution">Save</NButton></div>
      </div>
    </div>

    <div class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="text-xs font-600 uppercase tracking-wide text-gray-600 dark:text-gray-400">Sources</h4>
        <NButton btn="link-blue" size="xs" @click="startSource()">Add source</NButton>
      </div>
      <div v-if="sources.length" class="space-y-2">
        <div v-for="source in sources" :key="source.id" class="flex items-start justify-between gap-3 text-xs">
          <div v-if="editingSource !== source.id" class="min-w-0">
            <a v-if="source.source_url" :href="source.source_url" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline dark:text-blue-400">{{ source.label || source.source_type }}</a>
            <span v-else class="text-gray-700 dark:text-gray-300">{{ source.label || source.source_type }}</span>
            <span class="ml-2 text-gray-400">{{ statusLabel(source.verification_status) }}</span>
          </div>
          <div v-else class="w-full space-y-2">
            <div class="grid gap-2 sm:grid-cols-2">
              <input v-model="sourceForm.source_type" placeholder="Source type" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
              <input v-model="sourceForm.label" placeholder="Label" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
            </div>
            <input v-model="sourceForm.source_url" type="url" placeholder="https://..." class="w-full border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
            <div class="flex items-center justify-between gap-3">
              <select v-model="sourceForm.verification_status" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
                <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
              </select>
              <label class="text-gray-500"><input v-model="sourceForm.is_primary" type="checkbox"> Primary</label>
            </div>
            <div class="flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelSource">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveSource">Save</NButton></div>
          </div>
          <div v-if="editingSource !== source.id" class="flex shrink-0 gap-2">
            <button class="text-blue-600 hover:underline dark:text-blue-400" @click="editSource(source)">Edit</button>
            <template v-if="confirmingSource === source.id">
              <button class="font-600 text-red-600 hover:underline dark:text-red-400" @click="removeSource(source)">Confirm?</button>
              <button class="text-gray-500 hover:underline dark:text-gray-400" @click="confirmingSource = null">Cancel</button>
            </template>
            <button v-else class="text-red-600 hover:underline dark:text-red-400" @click="confirmingSource = source.id">Delete</button>
          </div>
        </div>
      </div>
      <p v-else-if="editingSource === null" class="text-xs text-gray-500 dark:text-gray-400">No source recorded.</p>
    </div>

    <div v-if="creatingSource" class="mt-3 border border-gray-200 p-3 dark:border-gray-700">
      <div class="grid gap-2 sm:grid-cols-2"><input v-model="sourceForm.source_type" placeholder="Source type" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><input v-model="sourceForm.label" placeholder="Label" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"></div>
      <input v-model="sourceForm.source_url" type="url" placeholder="https://..." class="mt-2 w-full border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
      <div class="mt-2 flex items-center justify-between"><select v-model="sourceForm.attribution_id" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><option :value="null">No attribution</option><option v-for="item in attributions" :key="item.id" :value="item.id">{{ item.author?.name || 'Unknown author' }}</option></select><select v-model="sourceForm.verification_status" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select></div>
      <div class="mt-2 flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelSource">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveSource">Save</NButton></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const props = defineProps<{ quoteId: number; attributions: QuoteAttribution[]; sources: QuoteSource[] }>()
const emit = defineEmits<{ changed: [] }>()
const toast = useToast()
const statuses: QuoteProvenanceStatus[] = ['unverified', 'manually_verified', 'externally_verified', 'disputed']
const editingAttribution = ref<number | null>(null)
const creatingAttribution = ref(false)
const editingSource = ref<number | null>(null)
const creatingSource = ref(false)
const confirmingAttribution = ref<number | null>(null)
const confirmingSource = ref<number | null>(null)
const saving = ref(false)
const attributionForm = reactive<{ author: Author | null; reference: QuoteReference | null; status: QuoteProvenanceStatus; notes: string; is_primary: boolean }>({ author: null, reference: null, status: 'unverified', notes: '', is_primary: false })
const sourceForm = reactive<{ attribution_id: number | null; source_type: string; source_url: string; label: string; verification_status: QuoteProvenanceStatus; is_primary: boolean }>({ attribution_id: null, source_type: '', source_url: '', label: '', verification_status: 'unverified', is_primary: false })

const statusLabel = (status: string) => ({ unverified: 'Unverified', manually_verified: 'Manually verified', externally_verified: 'Externally verified', disputed: 'Disputed' }[status] || status)
const statusBadge = (status: string) => status === 'disputed' ? 'soft-error' : status === 'externally_verified' ? 'soft-success' : status === 'manually_verified' ? 'soft-blue' : 'soft-gray'
const fail = (error: unknown) => { console.error(error); toast.toast({ title: 'Could not save provenance', description: 'Please try again.', toast: 'soft-error' }) }
const resetAttribution = () => { editingAttribution.value = null; creatingAttribution.value = false; confirmingAttribution.value = null }
const startAttribution = () => { Object.assign(attributionForm, { author: null, reference: null, status: 'unverified', notes: '', is_primary: false }); creatingAttribution.value = true; editingAttribution.value = -1 }
const editAttribution = (item: QuoteAttribution) => { Object.assign(attributionForm, { author: item.author || null, reference: item.reference || null, status: item.status, notes: item.notes || '', is_primary: item.is_primary }); editingAttribution.value = item.id; creatingAttribution.value = false }
const cancelAttribution = resetAttribution
const saveAttribution = async () => { saving.value = true; try { const body = { author_id: attributionForm.author?.id || null, reference_id: attributionForm.reference?.id || null, status: attributionForm.status, notes: attributionForm.notes || null, is_primary: attributionForm.is_primary }; if (creatingAttribution.value) await $fetch(`/api/admin/quotes/${props.quoteId}/attributions`, { method: 'POST', body }); else await $fetch(`/api/admin/quotes/${props.quoteId}/attributions/${editingAttribution.value}`, { method: 'PUT', body }); resetAttribution(); emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const removeAttribution = async (item: QuoteAttribution) => { saving.value = true; try { await $fetch(`/api/admin/quotes/${props.quoteId}/attributions/${item.id}`, { method: 'DELETE' }); confirmingAttribution.value = null; emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const resetSource = () => { editingSource.value = null; creatingSource.value = false; confirmingSource.value = null }
const startSource = () => { Object.assign(sourceForm, { attribution_id: props.attributions.find(item => item.is_primary)?.id || null, source_type: '', source_url: '', label: '', verification_status: 'unverified', is_primary: false }); creatingSource.value = true; editingSource.value = null }
const editSource = (item: QuoteSource) => { Object.assign(sourceForm, { attribution_id: item.attribution_id || null, source_type: item.source_type, source_url: item.source_url || '', label: item.label || '', verification_status: item.verification_status, is_primary: item.is_primary }); editingSource.value = item.id; creatingSource.value = false }
const cancelSource = resetSource
const saveSource = async () => { saving.value = true; try { const body = { ...sourceForm, source_url: sourceForm.source_url || null, label: sourceForm.label || null }; if (creatingSource.value) await $fetch(`/api/admin/quotes/${props.quoteId}/sources`, { method: 'POST', body }); else await $fetch(`/api/admin/quotes/${props.quoteId}/sources/${editingSource.value}`, { method: 'PUT', body }); resetSource(); emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const removeSource = async (item: QuoteSource) => { saving.value = true; try { await $fetch(`/api/admin/quotes/${props.quoteId}/sources/${item.id}`, { method: 'DELETE' }); confirmingSource.value = null; emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
</script>
