<template>
  <div>
    <div class="grid grid-cols-3 gap-3 md:gap-6 animate-fade-in animate-duration-500 animate-delay-100">
      <!-- Likes Card -->
      <div 
        class="bg-white/50 dark:bg-gray-900/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 transition-all hover:border-gray-300/60 dark:hover:border-gray-600/60"
        @click="onToggleLike"
        :aria-label="localIsLiked ? 'Unlike' : 'Like'"
        :aria-disabled="(!props.canInteract || props.likePending || localLikePending) ? 'true' : 'false'"
        :class="{
          'cursor-pointer': props.canInteract && !props.likePending && !localLikePending,
          'opacity-60 pointer-events-none': !props.canInteract || props.likePending || localLikePending
        }"
      >
        <div class="flex flex-col items-center justify-center space-y-2">
          <NIcon 
            :name="localIsLiked ? 'i-ph-heart-fill' : 'i-ph-heart'"
            class="w-7 h-7 md:w-9 md:h-9" 
            :class="{
              'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800': localIsLiked,
              'text-gray-500 dark:text-gray-400': !localIsLiked
            }"
          />
          <div class="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200">{{ formatNumber(localLikeCount) }}</div>
          <div class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Likes</div>
        </div>
      </div>

      <!-- Views Card -->
      <div class="bg-white/50 dark:bg-gray-900/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 transition-all hover:border-gray-300/60 dark:hover:border-gray-600/60">
        <div class="flex flex-col items-center justify-center space-y-2">
          <NIcon name="i-ph-eye" class="w-7 h-7 md:w-9 md:h-9 text-gray-500 dark:text-gray-400" />
          <div class="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200">{{ formatNumber(props.viewCount) }}</div>
          <div class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Views</div>
        </div>
      </div>

      <!-- Shares Card -->
      <div 
        aria-label="Share"
        @click="shareOpen = true"
        class="cursor-pointer bg-white/50 dark:bg-gray-900/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 transition-all hover:border-gray-300/60 dark:hover:border-gray-600/60"
      >
        <div class="flex flex-col items-center justify-center space-y-2">
          <NIcon name="i-ph-share-network" class="w-7 h-7 md:w-9 md:h-9 text-gray-500 dark:text-gray-400" />
          <div class="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200">{{ formatNumber(props.shareCount) }}</div>
          <div class="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Shares</div>
        </div>
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

          <div class="grid grid-cols-2 gap-3">
            <NButton
              btn="ghost-gray"
              size="md"
              class="w-full justify-start bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200/40 dark:border-gray-700/40 hover:border-gray-300/60 dark:hover:border-gray-600/60"
              @click="onCopyLink"
            >
              <NIcon name="i-ph-link" class="mr-3 text-gray-600 dark:text-gray-300" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">Copy link</span>
            </NButton>

            <NButton
              btn="ghost-gray"
              size="md"
              class="w-full justify-start bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200/40 dark:border-gray-700/40 hover:border-gray-300/60 dark:hover:border-gray-600/60"
              @click="onCopyText"
            >
              <NIcon name="i-ph-quotes" class="mr-3 text-gray-600 dark:text-gray-300" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">Copy text</span>
            </NButton>

            <NButton
              btn="ghost-gray"
              size="md"
              class="w-full justify-start bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200/40 dark:border-gray-700/40 hover:border-gray-300/60 dark:hover:border-gray-600/60"
              :loading="props.sharePending"
              @click="onShare"
            >
              <NIcon name="i-ph-share-network" class="mr-3 text-gray-600 dark:text-gray-300" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">Share</span>
            </NButton>

            <NButton
              btn="ghost-gray"
              size="md"
              class="w-full justify-start bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200/40 dark:border-gray-700/40 hover:border-gray-300/60 dark:hover:border-gray-600/60"
              @click="onDownloadImage"
            >
              <NIcon name="i-ph-download-simple" class="mr-3 text-gray-600 dark:text-gray-300" />
              <span class="text-sm font-medium text-gray-900 dark:text-white">Download image</span>
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
  likeCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  canInteract: { type: Boolean, default: false }
})

import { ref, watch } from 'vue'

const emit = defineEmits(['toggle-like', 'share', 'save', 'copy-link', 'copy-text', 'download-image'])
const shareOpen = ref(false)

// Local optimistic state for likes
const localIsLiked = ref(props.isLiked)
const localLikeCount = ref(props.likeCount)
const localLikePending = ref(false)

// Sync props -> local state (server wins when it responds)
watch(() => props.isLiked, (v) => {
  localIsLiked.value = v
  // when server reports, clear optimistic pending
  localLikePending.value = false
})
watch(() => props.likeCount, (v) => {
  localLikeCount.value = v
})
watch(() => props.likePending, (v) => {
  if (!v) localLikePending.value = false
})

const onToggleLike = () => {
  if (!props.canInteract || props.likePending || localLikePending.value) return

  // optimistic update
  localLikePending.value = true
  const willLike = !localIsLiked.value
  localIsLiked.value = willLike
  // ensure we don't go below zero
  localLikeCount.value = Math.max(0, localLikeCount.value + (willLike ? 1 : -1))

  // notify parent to perform the network action
  emit('toggle-like')
}

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
