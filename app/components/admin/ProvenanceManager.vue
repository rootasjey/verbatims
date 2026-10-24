<template>
  <section class="border-t b-dashed border-gray-200 pt-4 dark:border-gray-700">
    <div class="mb-3 flex justify-end">
      <NButton btn="soft-blue" size="xs" @click="panel === 'sources' ? startSource() : startAttribution()">{{ panel === 'sources' ? 'Add source' : 'Add attribution' }}</NButton>
    </div>

    <div :class="['grid min-w-0 gap-6', panel === 'all' ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]' : '']">
    <div v-if="panel !== 'sources'">
    <div v-if="attributions.length" class="space-y-3">
      <div v-for="attribution in attributions" :key="attribution.id" class="min-w-0 border border-gray-200 p-4 dark:border-gray-700">
        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div class="min-w-0 flex-1 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            <div class="text-base font-600 text-gray-900 dark:text-white">{{ attribution.author?.name || 'Unknown author' }}</div>
            <div class="flex min-w-0 items-start gap-2 text-sm text-gray-500 dark:text-gray-400"><NIcon name="i-ph-book-open-text" class="mt-0.5 h-4 w-4 shrink-0" /><span class="min-w-0 break-words">{{ attribution.reference?.name || 'Unknown reference' }}</span></div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <div class="flex flex-wrap justify-end gap-1.5">
              <NTooltip v-if="attribution.is_primary" content="Primary attribution"><NBadge badge="soft-blue" size="xs"><NIcon name="i-lucide-trophy" aria-label="Primary attribution" class="h-4 w-4" /></NBadge></NTooltip>
              <NTooltip :content="statusLabel(attribution.status)"><NBadge :badge="statusBadge(attribution.status)" size="xs"><NIcon :name="statusIcon(attribution.status)" :aria-label="statusLabel(attribution.status)" class="h-4 w-4" /></NBadge></NTooltip>
            </div>
          </div>
        </div>
        <div class="mt-4 flex min-h-8 items-end justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          <p v-if="attribution.notes" class="min-w-0 break-words text-xs text-gray-500 dark:text-gray-400">{{ attribution.notes }}</p>
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <NTooltip content="Edit attribution"><NButton btn="ghost-gray" size="xs" icon label="i-ph-pencil-simple" aria-label="Edit attribution" @click="editAttribution(attribution)" /></NTooltip>
            <template v-if="confirmingAttribution === attribution.id">
              <button class="text-xs font-600 text-red-600 hover:underline dark:text-red-400" @click="removeAttribution(attribution)">Confirm?</button>
              <button class="text-xs text-gray-500 hover:underline dark:text-gray-400" @click="confirmingAttribution = null">Cancel</button>
            </template>
            <NTooltip v-else content="Delete attribution"><NButton btn="ghost-gray" size="xs" icon label="i-ph-trash" aria-label="Delete attribution" @click="confirmingAttribution = attribution.id" /></NTooltip>
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
    </div>

    <div v-if="panel !== 'attributions'" class="border-t border-gray-200 pt-4 dark:border-gray-700 lg:border-l lg:border-t-0 lg:pl-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="text-xs font-600 uppercase tracking-wide text-gray-600 dark:text-gray-400">Sources</h4>
      </div>
      <div v-if="sources.length" class="space-y-2">
        <div v-for="source in sources" :key="source.id" class="min-w-0 border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex min-w-0 items-start justify-between gap-4">
            <div class="min-w-0 break-words text-sm">
              <a v-if="source.source_url" :href="source.source_url" target="_blank" rel="noopener noreferrer" class="break-words text-blue-600 hover:underline dark:text-blue-400">{{ source.label || source.source_type }}</a>
              <span v-else class="break-words text-gray-700 dark:text-gray-300">{{ source.label || source.source_type }}</span>
              <p v-if="source.translator_name" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Translator: {{ source.translator_name }}</p>
            </div>
            <NTooltip :content="statusLabel(source.verification_status)"><NBadge :badge="statusBadge(source.verification_status)" size="xs"><NIcon :name="statusIcon(source.verification_status)" :aria-label="statusLabel(source.verification_status)" class="h-4 w-4" /></NBadge></NTooltip>
          </div>
          <div class="mt-4 flex justify-end gap-1.5 border-t border-gray-200 pt-3 dark:border-gray-700">
            <NTooltip content="Edit source"><NButton btn="ghost-gray" size="xs" icon label="i-ph-pencil-simple" aria-label="Edit source" @click="editSource(source)" /></NTooltip>
            <template v-if="confirmingSource === source.id">
              <button class="font-600 text-red-600 hover:underline dark:text-red-400" @click="removeSource(source)">Confirm?</button>
              <button class="text-gray-500 hover:underline dark:text-gray-400" @click="confirmingSource = null">Cancel</button>
            </template>
            <NTooltip v-else content="Delete source"><NButton btn="ghost-gray" size="xs" icon label="i-ph-trash" aria-label="Delete source" @click="confirmingSource = source.id" /></NTooltip>
          </div>
        </div>
      </div>
      <p v-else-if="editingSource === null" class="text-xs text-gray-500 dark:text-gray-400">No source recorded.</p>
    <div v-if="creatingSource" class="mt-3 border border-gray-200 p-3 dark:border-gray-700">
      <div class="grid gap-2 sm:grid-cols-2"><input v-model="sourceForm.source_type" placeholder="Source type" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><input v-model="sourceForm.label" placeholder="Label" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"></div>
      <input v-model="sourceForm.translator_name" placeholder="Translator name" class="mt-2 w-full border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
      <input v-model="sourceForm.source_url" type="url" placeholder="https://..." class="mt-2 w-full border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600">
      <div class="mt-2 flex items-center justify-between"><select v-model="sourceForm.attribution_id" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><option :value="null" disabled>Select an attribution</option><option v-for="item in attributions" :key="item.id" :value="item.id">{{ item.author?.name || 'Unknown author' }}</option></select><select v-model="sourceForm.verification_status" class="border border-gray-300 bg-transparent px-2 py-1.5 dark:border-gray-600"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select></div>
      <div class="mt-2 flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelSource">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveSource">Save</NButton></div>
    </div>
    </div>
    </div>

    <NDialog v-model:open="attributionEditOpen">
      <div class="w-[min(32rem,calc(100vw-2rem))] space-y-4 p-5">
        <div>
          <h3 class="font-title text-base font-600 text-gray-900 dark:text-white">Edit attribution</h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Update the author, reference, and verification details.</p>
        </div>
        <AdminEntitySearch v-model="attributionForm.author" label="Author" endpoint="/api/authors/search" />
        <AdminEntitySearch v-model="attributionForm.reference" label="Reference" endpoint="/api/references/search" />
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-xs text-gray-600 dark:text-gray-400">Status
            <select v-model="attributionForm.status" class="mt-1 w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select>
          </label>
          <label class="flex items-center gap-2 self-end text-xs text-gray-600 dark:text-gray-400"><input v-model="attributionForm.is_primary" type="checkbox"> Primary attribution</label>
        </div>
        <textarea v-model="attributionForm.notes" rows="3" placeholder="Notes" class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600" />
        <div class="flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelAttributionEdit">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveAttribution">Save</NButton></div>
      </div>
    </NDialog>

    <NDialog v-model:open="sourceEditOpen">
      <div class="w-[min(32rem,calc(100vw-2rem))] space-y-4 p-5">
        <div>
          <h3 class="font-title text-base font-600 text-gray-900 dark:text-white">Edit source</h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Update the source details and verification status.</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="sourceForm.source_type" placeholder="Source type" class="border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
          <input v-model="sourceForm.label" placeholder="Label" class="border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
        </div>
        <input v-model="sourceForm.translator_name" placeholder="Translator name" class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
        <input v-model="sourceForm.source_url" type="url" placeholder="https://..." class="w-full border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600">
        <div class="flex items-center justify-between gap-3">
          <select v-model="sourceForm.verification_status" class="border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select>
          <label class="text-xs text-gray-500"><input v-model="sourceForm.is_primary" type="checkbox"> Primary</label>
        </div>
        <div class="flex justify-end gap-2"><NButton btn="link-gray" size="xs" @click="cancelSourceEdit">Cancel</NButton><NButton btn="soft-blue" size="xs" :disabled="saving" @click="saveSource">Save</NButton></div>
      </div>
    </NDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

const props = withDefaults(defineProps<{ quoteId: number; attributions: QuoteAttribution[]; sources: QuoteSource[]; panel?: 'attributions' | 'sources' | 'all' }>(), { panel: 'all' })
const emit = defineEmits<{ changed: [] }>()
const panel = computed(() => props.panel)
const toast = useToast()
const statuses: QuoteProvenanceStatus[] = ['unverified', 'manually_verified', 'externally_verified', 'disputed']
const editingAttribution = ref<number | null>(null)
const creatingAttribution = ref(false)
const attributionEditOpen = ref(false)
const editingSource = ref<number | null>(null)
const creatingSource = ref(false)
const sourceEditOpen = ref(false)
const confirmingAttribution = ref<number | null>(null)
const confirmingSource = ref<number | null>(null)
const saving = ref(false)
const attributionForm = reactive<{ author: Author | null; reference: QuoteReference | null; status: QuoteProvenanceStatus; notes: string; is_primary: boolean }>({ author: null, reference: null, status: 'unverified', notes: '', is_primary: false })
const sourceForm = reactive<{ attribution_id: number | null; source_type: string; source_url: string; label: string; translator_name: string; verification_status: QuoteProvenanceStatus; is_primary: boolean }>({ attribution_id: null, source_type: '', source_url: '', label: '', translator_name: '', verification_status: 'unverified', is_primary: false })

const statusLabel = (status: string) => ({ unverified: 'Unverified', manually_verified: 'Manually verified', externally_verified: 'Externally verified', disputed: 'Disputed' }[status] || status)
const statusBadge = (status: string) => status === 'disputed' ? 'soft-error' : status === 'externally_verified' ? 'soft-success' : status === 'manually_verified' ? 'soft-blue' : 'soft-gray'
const statusIcon = (status: string) => status === 'disputed' ? 'i-lucide-message-circle-warning' : status === 'unverified' ? 'i-lucide-badge-question-mark' : 'i-lucide-check'
const fail = (error: unknown) => { console.error(error); toast.toast({ title: 'Could not save provenance', description: 'Please try again.', toast: 'soft-error' }) }
const resetAttribution = () => { editingAttribution.value = null; creatingAttribution.value = false; confirmingAttribution.value = null }
const startAttribution = () => { Object.assign(attributionForm, { author: null, reference: null, status: 'unverified', notes: '', is_primary: false }); creatingAttribution.value = true; editingAttribution.value = -1 }
const editAttribution = (item: QuoteAttribution) => { Object.assign(attributionForm, { author: item.author || null, reference: item.reference || null, status: item.status, notes: item.notes || '', is_primary: item.is_primary }); editingAttribution.value = item.id; creatingAttribution.value = false; attributionEditOpen.value = true }
const cancelAttribution = resetAttribution
const cancelAttributionEdit = () => { attributionEditOpen.value = false; resetAttribution() }
const saveAttribution = async () => { saving.value = true; try { const body = { author_id: attributionForm.author?.id || null, reference_id: attributionForm.reference?.id || null, status: attributionForm.status, notes: attributionForm.notes || null, is_primary: attributionForm.is_primary }; if (creatingAttribution.value) await $fetch(`/api/admin/quotes/${props.quoteId}/attributions`, { method: 'POST', body }); else await $fetch(`/api/admin/quotes/${props.quoteId}/attributions/${editingAttribution.value}`, { method: 'PUT', body }); attributionEditOpen.value = false; resetAttribution(); emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const removeAttribution = async (item: QuoteAttribution) => { saving.value = true; try { await $fetch(`/api/admin/quotes/${props.quoteId}/attributions/${item.id}`, { method: 'DELETE' }); confirmingAttribution.value = null; emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const resetSource = () => { editingSource.value = null; creatingSource.value = false; confirmingSource.value = null }
const startSource = () => { Object.assign(sourceForm, { attribution_id: props.attributions.find(item => item.is_primary)?.id || null, source_type: '', source_url: '', label: '', translator_name: '', verification_status: 'unverified', is_primary: false }); creatingSource.value = true; editingSource.value = null }
const editSource = (item: QuoteSource) => { Object.assign(sourceForm, { attribution_id: item.attribution_id || null, source_type: item.source_type, source_url: item.source_url || '', label: item.label || '', translator_name: item.translator_name || '', verification_status: item.verification_status, is_primary: item.is_primary }); editingSource.value = item.id; creatingSource.value = false; sourceEditOpen.value = true }
const cancelSource = resetSource
const cancelSourceEdit = () => { sourceEditOpen.value = false; resetSource() }
const saveSource = async () => { if (!sourceForm.attribution_id) { fail(new Error('Select an attribution')); return }; saving.value = true; try { const body = { ...sourceForm, source_url: sourceForm.source_url || null, label: sourceForm.label || null, translator_name: sourceForm.translator_name.trim() || null }; if (creatingSource.value) await $fetch(`/api/admin/quotes/${props.quoteId}/sources`, { method: 'POST', body }); else await $fetch(`/api/admin/quotes/${props.quoteId}/sources/${editingSource.value}`, { method: 'PUT', body }); sourceEditOpen.value = false; resetSource(); emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
const removeSource = async (item: QuoteSource) => { saving.value = true; try { await $fetch(`/api/admin/quotes/${props.quoteId}/sources/${item.id}`, { method: 'DELETE' }); confirmingSource.value = null; emit('changed') } catch (error) { fail(error) } finally { saving.value = false } }
</script>
