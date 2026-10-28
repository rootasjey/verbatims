<template>
  <div class="loading-word" role="status" :aria-label="label">
    <span class="loading-word__visual" aria-hidden="true">
      <span
        v-for="(letter, index) in letters"
        :key="index"
        class="loading-word__letter"
        :class="{ 'loading-word__ellipsis': index >= letters.length - 3 }"
        :style="{ '--letter-index': index }"
      >{{ letter }}</span>
    </span>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()

const letters = [...'LOADING...']
</script>

<style scoped>
.loading-word {
  display: grid;
  width: 100%;
  min-height: clamp(7rem, 32vh, 22rem);
  place-items: center;
  overflow: visible;
  color: inherit;
}

.loading-word__visual {
  display: flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-family: Khand, Impact, sans-serif;
  font-size: clamp(4rem, 26vw, 48rem);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 0.8;
  animation: word-appear 160ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}

.loading-word__letter {
  display: inline-block;
}

.loading-word__ellipsis {
  transform-origin: center bottom;
  animation: dot-breathe 1.5s ease-in-out infinite;
}

@keyframes word-appear {
  0% {
    opacity: 0;
    transform: translateY(0.08em);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dot-breathe {
  0%, 100% {
    opacity: 0.7;
    transform: translateY(0) scaleY(1);
  }
  26% {
    opacity: 1;
    transform: translateY(-0.11em);
  }
  52% {
    opacity: 0.85;
    transform: translateY(0) scaleY(0.8);
  }
  60% { transform: translateY(-0.025em) scaleY(1.08); }
  72% { transform: translateY(0) scaleY(1); }
}

.loading-word__ellipsis:nth-last-child(2) {
  animation-delay: 180ms;
}

.loading-word__ellipsis:nth-last-child(1) {
  animation-delay: 360ms;
}

@media (prefers-reduced-motion: reduce) {
  .loading-word__visual,
  .loading-word__ellipsis {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
