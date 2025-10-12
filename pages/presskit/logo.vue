<template>
  <div class="relative">
    <div class="my-8">
      <h1 class="text-4xl font-bold mb-4 text-center">Press Kit</h1>
      <!-- Toolbar -->
      <div class="flex items-center justify-center gap-3 mt-6">
        <USelect
          class="min-w-36"
          v-model="selectedFormat"
          :items="formatItems"
          item-key="label"
          value-key="label"
          size="sm"
        />
        <UButton
          size="sm"
          btn="solid-black"
          :loading="downloading"
          @click="downloadLogo"
        >
          Download
        </UButton>
      </div>
    </div>
    <div
      ref="captureEl"
      class="relative aspect-[4/3] h-90% w-90% bg-black flex flex-col m-12 rounded-1 mx-auto justify-center items-center text-white"
      style="font-family: 'serif', 'Georgia', 'Times New Roman', Times, serif;"
    >
      <div>
        <div class="absolute top-0 left-36 border-l b-dashed border-white/40 h-full w-4"></div>
        <div class="flex flex-col items-center relative z-1 font-serif text-9xl font-600 m-12 select-none">
          <div class="bg-white text-black my-2 px-8">verbatims</div>
          <div class="bg-white text-black my-2 px-8">verbatims</div>
          <div class="bg-white text-black my-2 px-8">verbatims</div>
        </div>
        <div class="absolute top-0 right-32 border-l b-dashed border-white/40 h-full w-4"></div>
      </div>

      <div class="relative bottom-10 border-b b-dashed border-white/40 w-full my-4"></div>
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
const captureEl = ref<HTMLElement | null>(null)

const formatItems = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'SVG', value: 'svg' },
]

async function downloadLogo() {
  errorMsg.value = ''
  if (!process.client) {
    errorMsg.value = 'Not running on client.'
    return
  }
  const node = captureEl.value
  if (!node) {
    errorMsg.value = 'Logo element not found.'
    return
  }
  downloading.value = true
  try {
    // Dynamically import to keep SSR safe
    const htmlToImage = await import('html-to-image')
    const pixelRatio = 3 // sharper export
    const backgroundColor = '#000000' // ensure black background like the preview
    let dataUrl = ''
    const fmt = selectedFormat.value?.value || 'png'
    const commonOptions = { pixelRatio, cacheBust: true, backgroundColor, skipFonts: true }
    if (fmt === 'png') {
      dataUrl = await htmlToImage.toPng(node, commonOptions)
    } else if (fmt === 'jpeg') {
      dataUrl = await htmlToImage.toJpeg(node, { ...commonOptions, quality: 0.95 })
    } else {
      // SVG export serializes DOM to an SVG foreignObject snapshot
      dataUrl = await htmlToImage.toSvg(node, { cacheBust: true, backgroundColor, skipFonts: true })
    }
    const link = document.createElement('a')
    link.download = `verbatims-logo.${fmt}`
    link.href = dataUrl
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    const error = err as { message?: string }
    errorMsg.value = 'Failed to export logo: ' + (error?.message || String(err))
    // eslint-disable-next-line no-console
    console.error('Failed to export logo:', err)
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
</style>