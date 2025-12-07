<template>
  <div class="relative m-24">
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-4 text-center">Press Kit</h1>
      <!-- Toolbar -->
      <div class="flex items-center justify-center gap-3 mt-6">
        <NSelect
          class="min-w-36"
          v-model="selectedFormat"
          :items="formatItems"
          item-key="label"
          value-key="label"
          size="sm"
        />
        <NButton
          size="sm"
          btn="solid-black"
          :loading="downloading"
          disabled
          title="Click a preview card below to download the corresponding PNG"
        >
          Click preview to download
        </NButton>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
          id="verbatims-bar.png"
          @click="onAssetClick"
          class="relative bg-black flex flex-col rounded-1 mx-auto justify-center items-center text-white cursor-pointer select-none"
          style="font-family: 'serif', 'Georgia', 'Times New Roman', Times, serif;"
          title="Click to download verbatims-bar.png"
        >
          <div class="w-[calc(100%-28px)] border b-dashed m-4">
            <div class="px-0 flex flex-col items-center relative z-1 font-title text-size-12 sm:text-size-24 md:text-size-42 xl:text-size-54 line-height-28 font-600 m-12">
              <div class="text-white my-2 px-8">VERBATIMS</div>
            </div>
          </div>
      </div>
    
      <div class="flex gap-2">
        <div
          id="vbt.png"
          @click="onAssetClick"
          class="w-400px relative bg-black flex flex-col rounded-1 mx-auto justify-center items-center text-white cursor-pointer select-none"
          style="font-family: 'serif', 'Georgia', 'Times New Roman', Times, serif;"
          title="Click to download vbt.png"
        >
          <div class="w-[calc(100%-28px)] border b-dashed m-4">
            <div class="px-0 flex flex-col items-center relative z-1 font-title text-size-24 lg:text-size-54 line-height-28 font-600 m-12">
              <div class="text-white my-2 px-8">VBT</div>
            </div>
          </div>
        </div>
        <div class="bg-black min-h-full w-full text-white rounded-1"></div>
      </div>

      <div
        id="vbt-text.png"
        @click="onAssetClick"
        class="relative bg-black flex flex-col rounded-1 mx-auto justify-center items-center text-white cursor-pointer select-none"
        style="font-family: 'serif', 'Georgia', 'Times New Roman', Times, serif;"
        title="Click to download vbt-text.png"
      >
        <div class="border b-dashed m-4">
          <div class="flex flex-col items-center relative z-1 font-serif text-md sm:text-3xl md:text-5xl lg:text-7xl m-12">
            <div class="text-white my-2 px-8">Pour savoir qui l'on est, il faut savoir d'où l'on vient. 
              L'histoire c'est la connaissance du passé. c'est le passé qui éclaire le présent. 
              Et c'est en conservant la mémoire du présent qu'on peut éclairer l'avenir.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="errorMsg" class="text-red-500 text-center mt-4">{{ errorMsg }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Format = 'png' | 'jpeg' | 'svg'

const selectedFormat = ref<{ label: string; value: Format }>({ label: 'PNG', value: 'png' })
const downloading = ref(false)
const errorMsg = ref('')

const formatItems = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'SVG', value: 'svg' },
]

// Click a preview block to download the matching PNG from /public/images
function onAssetClick(event: MouseEvent) {
  if (!import.meta.client) return
  errorMsg.value = ''
  const el = event.currentTarget as HTMLElement | null
  const id = el?.id?.trim()
  if (!id) {
    errorMsg.value = 'No asset id found on the clicked element.'
    return
  }
  // Only allow simple filenames ending in .png
  if (!/^[-_.A-Za-z0-9]+\.png$/i.test(id)) {
    errorMsg.value = 'Unsupported or invalid asset id.'
    return
  }
  const url = `/images/${id}`
  const a = document.createElement('a')
  a.href = url
  a.download = id
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
</style>