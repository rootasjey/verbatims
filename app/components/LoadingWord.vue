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
}

.loading-word__letter {
  display: inline-block;
  animation: letter-rise 680ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
  animation-delay: calc(var(--letter-index) * 280ms);
}

.loading-word__ellipsis {
  transform-origin: center bottom;
  animation-name: letter-rise, dot-breathe;
  animation-duration: 680ms, 1.5s;
  animation-delay: calc(var(--letter-index) * 280ms), 3.2s;
  animation-timing-function: cubic-bezier(0.2, 0.75, 0.25, 1), ease-in-out;
  animation-iteration-count: 1, infinite;
  animation-fill-mode: both, none;
}

@keyframes letter-rise {
  0% {
    opacity: 0;
    transform: translateY(0.45em);
  }
  55% {
    opacity: 0.72;
    transform: translateY(-0.04em);
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
  animation-delay: calc(var(--letter-index) * 280ms), 3.38s;
}

.loading-word__ellipsis:nth-last-child(1) {
  animation-delay: calc(var(--letter-index) * 280ms), 3.56s;
}

@media (prefers-reduced-motion: reduce) {
  .loading-word__letter {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
