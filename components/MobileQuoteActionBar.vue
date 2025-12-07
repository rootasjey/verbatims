<template>
  <div>
    <div class="mt-6 flex justify-center">
      <div
        class="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-200/80 dark:border-gray-700/80 bg-white/70 dark:bg-[#0C0A09]/60 backdrop-blur px-2 py-1 font-sans shadow-sm"
      >
        <!-- Like -->
        <NButton
          data-testid="mobile-actions-like"
          size="xs"
          rounded="full"
          :btn="props.isLiked ? 'soft-red' : 'ghost'"
          :aria-label="props.isLiked ? 'Unlike' : 'Like'"
          :loading="props.likePending"
          :disabled="!props.canInteract || props.likePending"
          @click="emit('toggle-like')"
        >
          <div class="flex items-center gap-1">
            <NIcon :name="props.isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" size="md" />
            <span class="text-md font-500 font-subtitle">{{ formatNumber(props.likesCount) }}</span>
          </div>
        </NButton>

        <!-- Divider -->
        <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-800" aria-hidden="true"></span>

        <!-- Save -->
        <NButton
          data-testid="mobile-actions-save"
          size="xs"
          rounded="full"
          :btn="props.savedState === 'saved' ? 'soft-green' : 'ghost'"
          :aria-label="props.savedState === 'saved' ? 'Saved' : 'Save'"
          :disabled="!props.canInteract"
          @click="emit('save')"
        >
          <div class="flex items-center gap-1">
            <NIcon :name="props.savedState === 'saved' ? 'i-ph-check' : 'i-ph-list-plus-duotone'" size="md" />
            <span class="text-md font-500 font-subtitle">{{ props.savedState === 'saved' ? 'Saved' : 'Save' }}</span>
          </div>
        </NButton>

        <!-- Divider -->
        <span class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-800" aria-hidden="true"></span>

        <!-- Share -->
        <NButton
          data-testid="mobile-actions-share"
          size="xs"
          rounded="full"
          btn="ghost"
          aria-label="Share"
          @click="shareOpen = true"
        >
          <div class="flex items-center gap-1">
            <NIcon name="i-ph-share-fat-duotone" size="md" />
            <span class="text-md font-500 font-subtitle">Share</span>
          </div>
        </NButton>
      </div>
    </div>
    
    <!-- Share Drawer -->
    <NDrawer v-model:open="shareOpen" direction="bottom">
      <template #body>
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Share this quote</h2>
            <NButton icon btn="ghost-gray" label="i-ph-x-bold" size="xs" @click="shareOpen = false" />
          </div>

          <div class="grid grid-cols-1 gap-2">
            <NButton btn="soft-gray" size="sm" class="justify-start" @click="onCopyLink">
              <NIcon name="i-ph-link" class="mr-2" /> Copy link
            </NButton>
            <NButton btn="soft-gray" size="sm" class="justify-start" @click="onCopyText">
              <NIcon name="i-ph-quotes" class="mr-2" /> Copy text
            </NButton>
            <NButton btn="soft-blue" size="sm" class="justify-start" :loading="props.sharePending" @click="onShare">
              <NIcon name="i-ph-share-network" class="mr-2" /> Share
            </NButton>
            <NButton btn="soft-green" size="sm" class="justify-start" @click="onDownloadImage">
              <NIcon name="i-ph-download-simple" class="mr-2" /> Download image
            </NButton>
          </div>
        </div>
      </template>
    </NDrawer>
  </div>
</template>

<script setup>
const props = defineProps({
  isLiked: { type: Boolean, default: false },
  likePending: { type: Boolean, default: false },
  sharePending: { type: Boolean, default: false },
  savedState: { type: String, default: 'idle' },
  likesCount: { type: Number, default: 0 },
  canInteract: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-like', 'share', 'save', 'copy-link', 'copy-text', 'download-image'])

const shareOpen = ref(false)

const onCopyLink = () => {
  emit('copy-link')
  shareOpen.value = false
}
const onCopyText = () => {
  emit('copy-text')
  shareOpen.value = false
}
const onShare = () => {
  emit('share')
  shareOpen.value = false
}
const onDownloadImage = () => {
  emit('download-image')
  shareOpen.value = false
}
</script>
