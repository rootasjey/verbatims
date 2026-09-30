<template>
  <nav class="legal-contents" :aria-label="label">
    <div class="legal-contents-desktop">
      <h2>{{ label }}</h2>
      <ol>
        <li v-for="item in items" :key="item.id">
          <a
            :href="`#${item.id}`"
            :aria-current="activeId === item.id ? 'location' : undefined"
          >{{ item.label }}</a>
        </li>
      </ol>
    </div>

    <details class="legal-contents-mobile">
      <summary>
        <span>{{ label }}</span>
        <NIcon name="i-tabler-chevron-down" aria-hidden="true" />
      </summary>
      <ol>
        <li v-for="item in items" :key="item.id">
          <a
            :href="`#${item.id}`"
            :aria-current="activeId === item.id ? 'location' : undefined"
          >{{ item.label }}</a>
        </li>
      </ol>
    </details>
  </nav>
</template>

<script setup lang="ts">
interface ContentsItem {
  id: string
  label: string
}

defineProps<{
  label: string
  items: readonly ContentsItem[]
  activeId?: string
}>()
</script>

<style scoped>
.legal-contents-desktop h2 {
  margin: 0 0 0.75rem;
  font-family: 'Nunito', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  opacity: 0.8;
}

.legal-contents-desktop ol,
.legal-contents-mobile ol {
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legal-contents a {
  display: block;
  padding: 0.35rem 0;
  color: inherit;
  font-size: 0.8125rem;
  line-height: 1.4;
  opacity: 0.72;
  text-decoration: none;
  text-underline-offset: 0.2em;
  transition: opacity 160ms ease, text-decoration-color 160ms ease;
}

.legal-contents a:hover,
.legal-contents a:focus-visible {
  opacity: 1;
  text-decoration: underline;
}

.legal-contents a[aria-current='location'] {
  font-weight: 650;
  opacity: 1;
}

.legal-contents a:focus-visible {
  border-radius: 2px;
  outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
  outline-offset: 3px;
}

.legal-contents-mobile {
  display: none;
}

@media (max-width: 640px) {
  .legal-contents-desktop {
    display: none;
  }

  .legal-contents-mobile {
    display: block;
  }

  .legal-contents-mobile summary {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    list-style: none;
    font-weight: 600;
  }

  .legal-contents-mobile summary::-webkit-details-marker {
    display: none;
  }

  .legal-contents-mobile summary :deep(svg) {
    transition: transform 160ms ease;
  }

  .legal-contents-mobile[open] summary :deep(svg) {
    transform: rotate(180deg);
  }

  .legal-contents-mobile ol {
    margin-top: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .legal-contents a,
  .legal-contents-mobile summary :deep(svg) {
    transition: none;
  }
}
</style>
