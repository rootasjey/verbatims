<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-5 pb-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-600 text-gray-900 dark:text-white">Quick actions</h3>
          <NBadge 
            :color="statusColor" 
            variant="subtle" 
            size="xs"
          >
            {{ statusLabel }}
          </NBadge>
        </div>

        <!-- Action Cards in Grid -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <!-- Custom Actions -->
          <template v-if="actions && actions.length > 0">
            <div
              v-for="(action, index) in actions"
              :key="index"
              :class="`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border hover:border-${getActionColor(action.label)}-100 hover:dark:border-${getActionColor(action.label)}-800 cursor-pointer transition-all hover:scale-105 active:scale-95`"
              @click="handleCustomAction(action)"
            >
              <div :class="`flex items-center justify-center w-12 h-12 rounded-xl`">
                <NIcon 
                  :name="action.leading || getActionIcon(action.label)" 
                  :class="`w-6 h-6 text-${getActionColor(action.label)}-600`"
                />
              </div>
              <span :class="`text-xs font-600 text-${getActionColor(action.label)}-900 dark:text-${getActionColor(action.label)}-100 text-center`">{{ action.label }}</span>
            </div>
          </template>
          
          <!-- Default Actions (fallback) -->
          <template v-else>
            <!-- Edit Card -->
            <div
              v-if="showEdit"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              @click="handleEdit"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-800">
                <NIcon name="i-ph-pencil" class="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <span class="text-xs font-600 text-blue-900 dark:text-blue-100 text-center">Edit</span>
            </div>

            <!-- Submit Card -->
            <div
              v-if="showSubmit"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              :class="{ 'opacity-50 pointer-events-none': submitting }"
              @click="handleSubmit"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-800">
                <NIcon 
                  :name="submitting ? 'i-ph-circle-notch' : 'i-ph-paper-plane-tilt'" 
                  class="w-6 h-6 text-green-600 dark:text-green-300"
                  :class="{ 'animate-spin': submitting }"
                />
              </div>
              <span class="text-xs font-600 text-green-900 dark:text-green-100 text-center">Submit</span>
            </div>

            <!-- Delete/Remove Card -->
            <div
              v-if="showDelete"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl border border-pink-100 dark:border-pink-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              @click="handleDelete"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-800">
                <NIcon :name="deleteIcon" class="w-6 h-6 text-pink-600 dark:text-pink-300" />
              </div>
              <span class="text-xs font-600 text-pink-900 dark:text-pink-100 text-center">{{ deleteLabel }}</span>
            </div>

            <!-- Share Card -->
            <div
              v-if="showShare"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              @click="handleShare"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-800">
                <NIcon name="i-ph-share-network" class="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <span class="text-xs font-600 text-purple-900 dark:text-purple-100 text-center">Share</span>
            </div>

            <!-- Download Card -->
            <div
              v-if="showDownload"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              @click="handleDownload"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800">
                <NIcon name="i-ph-download-simple" class="w-6 h-6 text-amber-600 dark:text-amber-300" />
              </div>
              <span class="text-xs font-600 text-amber-900 dark:text-amber-100 text-center">Download</span>
            </div>

            <!-- Report Card -->
            <div
              v-if="showReport"
              class="flex flex-col items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 cursor-pointer transition-all hover:scale-105 active:scale-95"
              @click="handleReport"
            >
              <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-800">
                <NIcon name="i-ph-flag" class="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
              <span class="text-xs font-600 text-red-900 dark:text-red-100 text-center">Report</span>
            </div>
          </template>
        </div>

        <!-- Cancel Button -->
        <NButton block btn="ghost-gray" size="md" class="rounded-xl" @click="handleClose">
          Cancel
        </NButton>
      </div>
    </template>
  </NDrawer>
</template><script lang="ts" setup>
interface CustomAction {
  label: string
  leading?: string
  color?: string
  onclick?: () => void
}

interface Props {
  open?: boolean
  submitting?: boolean
  status?: 'draft' | 'pending' | 'approved' | 'rejected'
  // Action visibility (deprecated in favor of actions prop)
  showEdit?: boolean
  showSubmit?: boolean
  showDelete?: boolean
  showShare?: boolean
  showDownload?: boolean
  showReport?: boolean
  // Customization
  deleteLabel?: string
  deleteIcon?: string
  // Custom actions
  actions?: CustomAction[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'edit'): void
  (e: 'submit'): void
  (e: 'delete'): void
  (e: 'share'): void
  (e: 'download'): void
  (e: 'report'): void
  (e: 'unlike'): void
  (e: 'add-to-collection'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  submitting: false,
  status: 'draft',
  showEdit: true,
  showSubmit: true,
  showDelete: true,
  showShare: false,
  showDownload: false,
  showReport: false,
  deleteLabel: 'Delete',
  deleteIcon: 'i-ph-trash',
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  return labels[props.status] || 'Draft'
})

const statusColor = computed(() => {
  const colors: Record<string, string> = {
    draft: 'gray',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red'
  }
  return colors[props.status] || 'gray'
})

// Color mapping for custom actions
const getActionColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    'edit': 'blue',
    'share': 'orange',
    'unlike': 'pink',
    'add to collection': 'indigo',
    'remove from collection': 'indigo',
    'add to list': 'indigo',
    'delete': 'pink',
    'remove': 'pink',
    'submit': 'green',
    'download': 'amber',
    'report': 'red'
  }
  return colorMap[label.toLowerCase()] || 'gray'
}

// Icon mapping for custom actions
const getActionIcon = (label: string): string => {
  const iconMap: Record<string, string> = {
    'edit': 'i-ph-pencil',
    'share': 'i-ph-share-network',
    'unlike': 'i-ph-heart-break',
    'add to collection': 'i-ph-folder-plus',
    'add to list': 'i-ph-folder-plus',
    'delete': 'i-ph-trash',
    'remove': 'i-ph-trash',
    'submit': 'i-ph-paper-plane-tilt',
    'download': 'i-ph-download-simple',
    'report': 'i-ph-flag'
  }
  return iconMap[label.toLowerCase()] || 'i-ph-circle'
}

const handleEdit = () => {
  isOpen.value = false
  emit('edit')
}

const handleSubmit = () => {
  if (props.submitting) return
  isOpen.value = false
  emit('submit')
}

const handleDelete = () => {
  isOpen.value = false
  emit('delete')
}

const handleShare = () => {
  isOpen.value = false
  emit('share')
}

const handleDownload = () => {
  isOpen.value = false
  emit('download')
}

const handleReport = () => {
  isOpen.value = false
  emit('report')
}

const handleCustomAction = (action: CustomAction) => {
  isOpen.value = false
  if (action.onclick) {
    action.onclick()
    return
  }
  
  // Map common actions to emits
  const label = action.label.toLowerCase()
  if (label === 'edit') emit('edit')
  else if (label === 'share') emit('share')
  else if (label === 'unlike') emit('unlike')
  else if (label === 'add to collection' || label === 'add to list') emit('add-to-collection')
  else if (label === 'delete' || label === 'remove') emit('delete')
  else if (label === 'submit') emit('submit')
  else if (label === 'download') emit('download')
  else if (label === 'report') emit('report')
}

const handleClose = () => {
  isOpen.value = false
}
</script>
