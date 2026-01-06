<template>
  <div
    :class="[
      'reference-grid-item group border relative p-6 cursor-pointer h-full flex flex-col',
      borderHoverClass,
      'hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300'
    ]"
    @click="navigateToReference"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Reference Type and Stats (Top) -->
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <!-- Reference Type Badge -->
      <NBadge 
        :color="getTypeColor(reference.primary_type)" 
        badge="~"
        size="xs"
        class="transition-opacity duration-300"
        :class="{ 
          'group-hover:opacity-100': true, 
          'opacity-100': !isHovered, 
          'opacity-0': isHovered
        }"
      >
        {{ formatType(reference.primary_type) }}
      </NBadge>
      
      <!-- Quote Count Icon -->
      <NIcon
        name="i-ph-book-open-text-bold"
        :class="[
          'opacity-0 group-hover:opacity-100',
          'text-gray-600 dark:text-gray-400 flex-shrink-0 transition-opacity duration-300',
          'hover:scale-125 hover:rotate-12 active:scale-99 ease-in-out transition-transform duration-300'
        ]"
        :title="`${reference.quotes_count || 0} quotes`"
      />
    </div>

    <!-- Reference Name (Main) -->
    <div class="flex-1 flex flex-col">
      <!-- Reference Name -->
      <h3
        class="font-serif text-gray-800 dark:text-gray-200 
          break-words line-height-none leading-relaxed transition-opacity duration-300 mb-2"
        :class="{
          'text-size-12 font-600': reference.name.length > 30,
          'text-size-15 font-600': reference.name.length <= 30 && reference.name.length > 15,
          'text-6xl font-600': reference.name.length <= 15
        }"
      >
        {{ reference.name }}
      </h3>

      <!-- Secondary Type -->
      <p 
        v-if="reference.secondary_type" 
        class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1"
      >
        {{ reference.secondary_type }}
      </p>

      <!-- Description -->
      <p 
        v-if="reference.description" 
        class="font-sans text-sm text-gray-500 dark:text-gray-500 flex-1"
      >
        {{ reference.description }}
      </p>

      <!-- Release Date -->
      <p 
        v-if="reference.release_date" 
        class="font-sans text-xs text-gray-400 dark:text-gray-600 mt-2"
      >
        Released {{ formatReleaseDate(reference.release_date) }}
      </p>
    </div>

    <!-- Stats Footer -->
    <div 
      class="border-t b-dashed b-gray-200 dark:border-gray-400 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300"
      :class="{ 'opacity-50 group-hover:opacity-100': true }"
    >
      <div class="flex items-center space-x-3">
        <span>{{ reference.quotes_count || 0 }} {{ (reference.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
        <span>{{ formatNumber(reference.views_count || 0) }} views</span>
      </div>
      <span>{{ formatNumber(reference.likes_count || 0) }} likes</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  reference: {
    type: Object,
    required: true
  }
})

// Hover state management
const isHovered = ref(false)

// Navigation
const navigateToReference = () => {
  navigateTo(`/references/${props.reference.id}`)
}

// Utility functions
const formatReleaseDate = (releaseDate) => {
  if (!releaseDate) return ''
  
  const date = new Date(releaseDate)
  return date.getFullYear()
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

const formatType = (type) => {
  const typeMap = {
    'film': 'Film',
    'book': 'Book',
    'tv_series': 'TV Series',
    'music': 'Music',
    'speech': 'Speech',
    'podcast': 'Podcast',
    'interview': 'Interview',
    'documentary': 'Documentary',
    'media_stream': 'Media Stream',
    'writings': 'Writings',
    'video_game': 'Video Game',
    'other': 'Other'
  }
  return typeMap[type] || type
}

const getTypeColor = (type) => {
  const colorMap = {
    'film': 'red',
    'book': 'blue',
    'tv_series': 'purple',
    'music': 'green',
    'speech': 'orange',
    'podcast': 'pink',
    'interview': 'yellow',
    'documentary': 'indigo',
    'media_stream': 'cyan',
    'writings': 'gray',
    'video_game': 'violet',
    'other': 'slate'
  }
  return colorMap[type] || 'gray'
}

// Compute a Tailwind-like border class for the reference type to use on dark hover
const borderHoverClass = computed(() => {
  const color = getTypeColor(props.reference.primary_type)
  // Map our color tokens to the project's border utility classes.
  // We'll apply the color only in dark mode on hover: `dark:hover:b-{color}`
  // For safety, default to 'lime' if mapping fails.
  const allowed = new Set(['red','blue','purple','green','orange','pink','yellow','indigo','cyan','gray','slate','violet'])
  const safeColor = allowed.has(color) ? color : 'lime'
  return `dark:hover:b-${safeColor}`
})
</script>
