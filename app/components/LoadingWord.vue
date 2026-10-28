<template>
  <div class="loading-word" role="status" :aria-label="label">
    <span class="loading-word__visual" aria-hidden="true">
      <span
        v-for="(letter, index) in letters"
        :key="index"
        class="loading-word__letter"
        :class="{
          'loading-word__word-letter': index < letters.length - 3,
          'loading-word__ellipsis': index >= letters.length - 3
        }"
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
}

.loading-word__word-letter {
  animation: letter-sweep 140ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--letter-index) * 12ms);
}

.loading-word__ellipsis {
  transform-origin: center;
  animation: dot-push 1.5s ease-in-out infinite;
}

@keyframes letter-sweep {
  0% {
    opacity: 0.78;
    transform: translateX(-0.07em);
  }
  72% {
    opacity: 1;
    transform: translateX(0.018em);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes dot-push {
  0%, 100% {
    opacity: 0.7;
    transform: translateX(0) scaleX(1);
  }
  28% {
    opacity: 1;
    transform: translateX(0.045em) scaleX(1.06);
  }
  38% {
    opacity: 0.9;
    transform: translateX(0.055em) scaleX(0.92);
  }
  48% {
    transform: translateX(-0.01em) scaleX(1.03);
  }
  58%, 100% {
    transform: translateX(0) scaleX(1);
  }
}

.loading-word__ellipsis:nth-last-child(2) {
  animation-delay: 180ms;
}

.loading-word__ellipsis:nth-last-child(1) {
  animation-delay: 360ms;
}

@media (prefers-reduced-motion: reduce) {
  .loading-word__visual,
  .loading-word__word-letter,
  .loading-word__ellipsis {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
