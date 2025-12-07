<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-5 pb-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-600 text-gray-900 dark:text-white">Collection actions</h3>
          <NBadge 
            :badge="collection?.is_public ? 'outline-green' : 'outline-red'" 
            size="xs"
            rounded="full"
          >
            {{ collection?.is_public ? 'Public' : 'Private' }}
          </NBadge>
        </div>

        <!-- Collection Name -->
        <div v-if="collection" class="mb-5 p-3 border b-dashed rounded-xl">
          <h4 class="font-600 text-gray-900 dark:text-white line-clamp-1 mb-1">
            {{ collection.name }}
          </h4>
          <p v-if="collection.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ collection.description }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}
          </p>
        </div>

        <!-- Action Cards in Grid -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div
            class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105 active:scale-95"
            @click="handleView"
          >
            <div class="flex items-center justify-center w-12 h-12 rounded-xl">
              <NIcon name="i-ph-eye" class="w-6 h-6 text-blue-600" />
            </div>
            <span class="text-xs font-600 text-blue-900 dark:text-blue-100 text-center">View</span>
          </div>

          <div
            class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105 active:scale-95"
            @click="handleEdit"
          >
            <div class="flex items-center justify-center w-12 h-12 rounded-xl">
              <NIcon name="i-ph-pencil" class="w-6 h-6 text-yellow-600" />
            </div>
            <span class="text-xs font-600 text-yellow-900 dark:text-yellow-100 text-center">Edit</span>
          </div>

          <div
            class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-105 active:scale-95"
            @click="handleDelete"
          >
            <div class="flex items-center justify-center w-12 h-12 rounded-xl">
              <NIcon name="i-ph-trash" class="w-6 h-6 text-pink-600" />
            </div>
            <span class="text-xs font-600 text-pink-900 dark:text-pink-100 text-center">Delete</span>
          </div>
        </div>

        <!-- Cancel Button -->
        <NButton block btn="ghost-gray" size="md" class="rounded-xl" @click="handleClose">
          Cancel
        </NButton>
      </div>
    </template>
  </NDrawer>
</template>
  </NDrawer>
</template>

<script lang="ts" setup>
import type { CollectionWithStats } from '~/types/user-interactions'

interface Props {
  open?: boolean
  collection?: CollectionWithStats | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'view'): void
  (e: 'edit'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  collection: null,
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const handleView = () => {
  isOpen.value = false
  emit('view')
}

const handleEdit = () => {
  isOpen.value = false
  emit('edit')
}

const handleDelete = () => {
  isOpen.value = false
  emit('delete')
}

const handleClose = () => {
  isOpen.value = false
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
