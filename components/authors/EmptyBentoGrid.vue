<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Real Authors Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-user" class="w-8 h-8 text-blue-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Real Authors</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Discover quotes from historical figures, philosophers, writers, and influential people who shaped our world.
      </p>
    </div>

    <!-- Fictional Characters Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-mask-happy" class="w-8 h-8 text-purple-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Fictional Characters</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Explore wisdom from beloved fictional characters in books, movies, TV shows, and other creative works.
      </p>
    </div>

    <!-- Author Profiles Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-identification-card" class="w-8 h-8 text-green-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Rich Profiles</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Each author has a detailed profile with biography, profession, life dates, and all their quotes.
      </p>
    </div>

    <!-- Search & Filter Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-magnifying-glass" class="w-8 h-8 text-orange-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Smart Search</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Find authors by name, profession, or description with intelligent search and filtering options.
      </p>
    </div>

    <!-- Collections Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-heart" class="w-8 h-8 text-red-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Like & Follow</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Like your favorite authors and keep track of the voices that inspire you most.
      </p>
    </div>

    <!-- Community Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-users-three" class="w-8 h-8 text-indigo-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Community Driven</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Authors are added organically as users submit quotes, creating a naturally curated collection.
      </p>
    </div>
  </div>
</template>

<script setup>
// This component doesn't need any reactive logic
</script>
