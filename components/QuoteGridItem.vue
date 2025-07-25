<template>
  <div
    class="quote-grid-item group border relative p-6 cursor-pointer h-full flex flex-col
    dark:hover:b-lime hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300 "
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Author and Reference Info (Top) -->
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <!-- Author Name -->
      <span
        v-if="quote.author"
        class="text-gray-900 dark:text-gray-100 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        {{ quote.author.name }}
      </span>
      <span
        v-else
        class="font-medium text-gray-500 dark:text-gray-400 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        Unknown Author
      </span>
      
      <!-- Book Icon (if reference exists) -->
      <UIcon
        v-if="quote.reference"
        name="i-ph-book-open-text-bold"
        :class="[
          'opacity-0 group-hover:opacity-100',
          'text-gray-600 dark:text-gray-400 flex-shrink-0 transition-opacity duration-300',
          'hover:scale-125 hover:rotate-180 active:scale-99 ease-in-out transition-transform duration-300'
        ]"
        :title="`From: ${quote.reference.name}`"
      />
    </div>

    <!-- Quote Content (Main) -->
    <div class="flex-1 flex">
      <!-- Default State: Quote Content -->
      <blockquote
        class="font-serif text-gray-800 dark:text-gray-200 leading-relaxed transition-opacity duration-300"
        :class="{
          'text-sm': quote.name.length > 200,
          'text-base': quote.name.length <= 200 && quote.name.length > 100,
          'text-lg': quote.name.length <= 100
        }"
      >
        {{ quote.name }}
      </blockquote>
    </div>

    <!-- Featured Badge (if featured) -->
    <UBadge
      v-if="quote.is_featured"
      color="yellow"
      variant="subtle"
      size="xs"
      class="absolute top-2 right-2"
    >
      Featured
    </UBadge>
  </div>
</template>

<script setup>
const props = defineProps({
  quote: {
    type: Object,
    required: true
  }
})

// Hover state management
const isHovered = ref(false)

// Navigation
const navigateToQuote = () => {
  navigateTo(`/quote/${props.quote.id}`)
}


</script>
