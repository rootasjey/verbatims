<template>
  <div class="sponsor-bar">
    <div
      ref="trackRef"
      class="sponsor-track"
      :class="{ 'is-paused': isPaused }"
      :style="{
        '--set-width': `${setWidth}px`,
        animationDuration: `${duration}s`
      }"
    >
      <!-- First set of sponsors -->
      <div class="sponsor-set">
        <a
          v-for="(sponsor, index) in sponsors"
          :key="`a-${index}`"
          :href="sponsor.url || undefined"
          :target="sponsor.url ? '_blank' : undefined"
          :rel="sponsor.url ? 'noopener noreferrer' : undefined"
          class="sponsor-item"
          :class="{ 'cursor-pointer hover:opacity-80': sponsor.url }"
        >
          <NIcon v-if="sponsor.leading" :name="sponsor.leading" class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-300 whitespace-nowrap">{{ sponsor.message }}</span>
          <NIcon v-if="sponsor.trailing" :name="sponsor.trailing" class="w-4 h-4 text-gray-400" />
        </a>
        <div class="sponsor-gap" />
      </div>

      <!-- Duplicate set for seamless loop -->
      <div class="sponsor-set">
        <a
          v-for="(sponsor, index) in sponsors"
          :key="`b-${index}`"
          :href="sponsor.url || undefined"
          :target="sponsor.url ? '_blank' : undefined"
          :rel="sponsor.url ? 'noopener noreferrer' : undefined"
          class="sponsor-item"
          :class="{ 'cursor-pointer hover:opacity-80': sponsor.url }"
        >
          <NIcon v-if="sponsor.leading" :name="sponsor.leading" class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-300 whitespace-nowrap">{{ sponsor.message }}</span>
          <NIcon v-if="sponsor.trailing" :name="sponsor.trailing" class="w-4 h-4 text-gray-400" />
        </a>
        <div class="sponsor-gap" />
      </div>
    </div>
    <button
      class="sponsor-toggle"
      :aria-label="isPaused ? 'Resume scrolling' : 'Pause scrolling'"
      @click="togglePause"
    >
      <NIcon :name="isPaused ? 'i-ph-play' : 'i-ph-pause'" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'

interface SponsorItem {
  message: string
  leading?: string
  trailing?: string
  url?: string
}

const sponsors: SponsorItem[] = [
  {
    message: 'You can display your brand here',
    leading: 'i-ph-star',
  },
  {
    message: 'You can send a love message',
    leading: 'i-ph-star',
  },
  {
    message: 'This is the best quotes platform',
    trailing: 'i-ph-heart',
  },
  {
    message: 'You can submit your own quotes',
    leading: 'i-ph-quotes',
  },{
    message: 'Visit zima blue to discover beautiful illustrations',
    leading: 'i-ph-palette',
    url: 'https://zimablue.cc',
  },
]

const duration = 30
const trackRef = ref<HTMLElement>()
const setWidth = ref(0)
const isPaused = useStorage('sponsor-paused', false)

const togglePause = () => {
  isPaused.value = !isPaused.value
}

onMounted(() => {
  measureSetWidth()
  window.addEventListener('resize', measureSetWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', measureSetWidth)
})

const measureSetWidth = () => {
  const firstSet = trackRef.value?.querySelector('.sponsor-set')
  if (firstSet) {
    setWidth.value = firstSet.getBoundingClientRect().width
  }
}
</script>

<style scoped>
.sponsor-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: #000;
  z-index: 50;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.sponsor-track {
  display: flex;
  animation: marquee linear infinite;
  will-change: transform;
}

.sponsor-set {
  display: flex;
  gap: 3rem;
  flex-shrink: 0;
}

.sponsor-gap {
  width: 3rem;
  flex-shrink: 0;
}

.sponsor-track.is-paused {
  animation-play-state: paused;
}

.sponsor-bar:hover .sponsor-track:not(.is-paused) {
  animation-play-state: paused;
}

.sponsor-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.sponsor-toggle {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border: none;
  border-left: 1px solid #222;
  color: #9ca3af;
  cursor: pointer;
  z-index: 1;
  transition: color 0.15s;
}

.sponsor-toggle:hover {
  color: #fff;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-1 * var(--set-width)));
  }
}
</style>
