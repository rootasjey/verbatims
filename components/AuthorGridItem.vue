<template>
  <div
    :class="[
      'author-grid-item group border relative p-6 cursor-pointer h-full flex flex-col',
      borderHoverClass,
      'hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300'
    ]"
    @click="navigateToAuthor"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Author Type and Stats (Top) -->
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <!-- Author Type Badge -->
      <NBadge 
        :badge="author.is_fictional ? 'outline-purple' : 'outline-blue'" 
        size="xs"
        class="transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        {{ author.is_fictional ? 'Fictional' : 'Real' }}
      </NBadge>
      
      <!-- Quote Count Icon -->
      <NIcon
        name="i-ph-quotes-bold"
        :class="[
          'opacity-0 group-hover:opacity-100',
          'text-gray-600 dark:text-gray-400 flex-shrink-0 transition-opacity duration-300',
          'hover:scale-125 hover:rotate-12 active:scale-99 ease-in-out transition-transform duration-300'
        ]"
        :title="`${author.quotes_count || 0} quotes`"
      />
    </div>

    <!-- Author Name (Main) -->
    <div class="flex-1 flex flex-col">
      <!-- Author Name -->
      <h3
        class="font-serif text-gray-800 dark:text-gray-200 
          break-words line-height-none
          leading-relaxed transition-opacity duration-300 mb-2"
        :class="{
          'text-size-12 font-600': author.name.length > 30,
          'text-size-15 font-600': author.name.length <= 30 && author.name.length > 15,
          'text-6xl font-600': author.name.length <= 15
        }"
      >
        {{ author.name }}
      </h3>

      <!-- Job Title -->
      <p 
        v-if="author.job" 
        class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1"
      >
        {{ author.job }}
      </p>

      <!-- Description -->
      <p 
        v-if="author.description" 
        class="font-sans text-sm text-gray-500 dark:text-gray-500 line-clamp-6 flex-1"
      >
        {{ author.description }}
      </p>

      <!-- Life Dates for Real People -->
      <p 
        v-if="!author.is_fictional && (author.birth_date || author.death_date)" 
        class="font-sans text-xs text-gray-400 dark:text-gray-600 mt-2"
      >
        {{ formatLifeDates(author.birth_date, author.death_date) }}
      </p>
    </div>

    <!-- Stats Footer -->
    <div 
      class="border-t b-dashed b-gray-200 dark:border-gray-400 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300"
      :class="{ 'opacity-50 group-hover:opacity-100': true }"
    >
      <div class="flex items-center space-x-3">
        <span>{{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
        <span>{{ formatNumber(author.views_count || 0) }} views</span>
      </div>
      <span>{{ formatNumber(author.likes_count || 0) }} likes</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  author: {
    type: Object,
    required: true
  }
})

// Hover state management
const isHovered = ref(false)

// Navigation
const navigateToAuthor = () => {
  navigateTo(`/authors/${props.author.id}`)
}

// Utility functions
const formatLifeDates = (birthDate, deathDate) => {
  if (!birthDate && !deathDate) return ''
  
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  
  return `${birth} - ${death}`
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Compute a Tailwind-like border class for author (purple for fictional, blue for real)
const borderHoverClass = computed(() => {
  const color = props.author && props.author.is_fictional ? 'purple' : 'blue'
  return `dark:hover:b-${color}`
})
</script>

