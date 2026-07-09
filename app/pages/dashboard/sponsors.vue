<template>
  <div>
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
        My Sponsorships
      </h1>
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ sponsors.length }} {{ sponsors.length === 1 ? 'sponsored message' : 'sponsored messages' }}
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      </div>
    </div>

    <div v-else-if="sponsors.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        No sponsorships yet
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        Sponsor a message to see it here.
      </p>
      <NuxtLink
        to="/sponsor"
        class="inline-flex items-center gap-1.5 font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
      >
        Sponsor a Message &rarr;
      </NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="sponsor in sponsors"
        :key="sponsor.id"
        class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 italic leading-relaxed line-clamp-2 mb-1">
              {{ sponsor.leading_icon }}&ldquo;{{ sponsor.message }}&rdquo;{{ sponsor.trailing_icon }}
            </blockquote>
            <div v-if="sponsor.url" class="font-sans text-xs text-gray-400 dark:text-gray-500 truncate mb-2">
              {{ sponsor.url }}
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span
                class="font-sans px-1.5 py-0.5"
                :class="statusClass(sponsor)"
              >
                {{ statusLabel(sponsor) }}
              </span>
              <span v-if="sponsor.paid" class="font-sans text-green-600 dark:text-green-400 flex items-center gap-0.5">
                <NIcon name="i-ph-check" class="w-3 h-3" /> Paid
              </span>
              <span class="font-sans text-gray-400 dark:text-gray-500">
                {{ formatDate(sponsor.created_at) }}
              </span>
            </div>
            <p v-if="sponsor.status === 'rejected' && sponsor.rejectionReason" class="font-sans text-xs text-red-600 dark:text-red-400 mt-1.5">
              Rejection reason: {{ sponsor.rejectionReason }}
            </p>
          </div>
          <button
            v-if="canEdit(sponsor)"
            class="flex-shrink-0 p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 -mt-1 -mr-1"
            @click="openEdit(sponsor)"
          >
            <NIcon name="i-ph-pencil-simple" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <ClientOnly>
      <NDialog
        v-model:open="showEditDialog"
        :title="'Edit Sponsored Message'"
        :description="'Update your message while it awaits moderation.'"
        class="max-w-md"
      >
        <div v-if="editingSponsor" class="space-y-4">
          <div>
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-1 block">Message *</label>
            <NInput
              v-model="editForm.message"
              input="gray"
              placeholder="Your sponsored message"
            />
          </div>
          <div>
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-1 block">Leading icon</label>
            <NInput
              v-model="editForm.leading_icon"
              input="gray"
              placeholder="e.g. 🔥"
            />
          </div>
          <div>
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-1 block">Trailing icon</label>
            <NInput
              v-model="editForm.trailing_icon"
              input="gray"
              placeholder="e.g. ✨"
            />
          </div>
          <div>
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-1 block">URL (optional)</label>
            <NInput
              v-model="editForm.url"
              input="gray"
              placeholder="https://example.com"
            />
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <NButton label="Cancel" btn="outline-gray" size="sm" @click="showEditDialog = false" />
            <NButton label="Save" btn="solid-gray" size="sm" :loading="saving" @click="saveEdit" />
          </div>
        </template>
      </NDialog>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

useHead({
  title: 'My Sponsorships - Dashboard - Verbatims',
})

const pageHeader = usePageHeader()

const loading = ref(true)
const sponsors = ref<any[]>([])
const showEditDialog = ref(false)
const editingSponsor = ref<any | null>(null)
const saving = ref(false)
const editForm = reactive({
  message: '',
  leading_icon: '',
  trailing_icon: '',
  url: '',
})

const loadSponsors = async () => {
  try {
    const res = await $fetch<{ data: any[] }>('/api/dashboard/sponsors')
    sponsors.value = res.data || []
  } catch (error) {
    console.error('Failed to load sponsors:', error)
  } finally {
    loading.value = false
  }
}

const canEdit = (sponsor: any) => {
  return sponsor.status !== 'approved' && (!sponsor.ends_at || new Date(sponsor.ends_at) >= new Date())
}

const openEdit = (sponsor: any) => {
  editingSponsor.value = sponsor
  editForm.message = sponsor.message || ''
  editForm.leading_icon = sponsor.leading_icon || ''
  editForm.trailing_icon = sponsor.trailing_icon || ''
  editForm.url = sponsor.url || ''
  showEditDialog.value = true
}

const saveEdit = async () => {
  if (!editingSponsor.value) return
  try {
    saving.value = true
    const res = await $fetch<{ data: any }>(`/api/dashboard/sponsors/${editingSponsor.value.id}`, {
      method: 'PUT',
      body: {
        message: editForm.message,
        leading_icon: editForm.leading_icon || null,
        trailing_icon: editForm.trailing_icon || null,
        url: editForm.url || null,
      },
    })
    const idx = sponsors.value.findIndex(s => s.id === editingSponsor.value.id)
    if (idx !== -1) sponsors.value[idx] = res.data
    showEditDialog.value = false
    editingSponsor.value = null
  } catch (error) {
    console.error('Failed to update sponsor:', error)
  } finally {
    saving.value = false
  }
}

const statusClass = (sponsor: any) => {
  if (sponsor.ends_at && new Date(sponsor.ends_at) < new Date()) return 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  if (sponsor.status === 'approved') return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
  if (sponsor.status === 'rejected') return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
}

const statusLabel = (sponsor: any) => {
  if (sponsor.ends_at && new Date(sponsor.ends_at) < new Date()) return 'Expired'
  if (sponsor.status === 'approved') return 'Active'
  if (sponsor.status === 'rejected') return 'Rejected'
  return 'Pending Moderation'
}

const formatDate = (date: string | number | undefined) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(() => {
  pageHeader.setHeaderFromRoute()
  loadSponsors()
})
</script>
