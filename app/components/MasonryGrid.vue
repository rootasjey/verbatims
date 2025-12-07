<template>
  <div class="masonry-grid">
    <slot />
  </div>
</template>

<script setup>
// This component provides a reusable masonry grid layout
// that can be used across different pages for displaying quotes
// in an irregular, Pinterest-style grid pattern
</script>

<style scoped>
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 80px;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    grid-auto-rows: 90px;
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    grid-auto-rows: 100px;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    grid-auto-rows: 110px;
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    grid-auto-rows: 160px;
    gap: 1.0rem;
  }

  @media (min-width: 1536px) {
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    grid-auto-rows: 130px;
    gap: 1.0rem;
  }
}

/* Skeleton loading styles for the masonry grid */
.masonry-grid .quote-skeleton {
  border: 1px dashed #d1d5db;
  padding: 1.5rem;
  border-radius: 0.5rem;
  grid-row: span 2;
}

@media (prefers-color-scheme: dark) {
  .masonry-grid .quote-skeleton {
    border-color: #4b5563;
  }
}
</style>
