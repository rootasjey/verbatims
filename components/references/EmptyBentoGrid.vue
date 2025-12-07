<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Books Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-book" class="w-8 h-8 text-blue-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Books & Literature</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Discover quotes from novels, poetry, essays, and literary works that have shaped human thought and culture.
      </p>
    </div>

    <!-- Films Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-film-strip" class="w-8 h-8 text-red-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Films & Cinema</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Memorable quotes from movies across all genres, from classic cinema to modern blockbusters and indie films.
      </p>
    </div>

    <!-- TV Series Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-television" class="w-8 h-8 text-purple-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">TV Series</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Iconic lines from television shows, from sitcoms to dramas, that have become part of popular culture.
      </p>
    </div>

    <!-- Music Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-music-notes" class="w-8 h-8 text-green-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Music & Lyrics</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Powerful lyrics and quotes from songs across all genres that resonate with the human experience.
      </p>
    </div>

    <!-- Speeches & Interviews Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-microphone" class="w-8 h-8 text-orange-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Speeches & Interviews</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Inspiring words from public speeches, interviews, and conversations that have moved and motivated people.
      </p>
    </div>

    <!-- Digital Media Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <UIcon name="i-ph-globe" class="w-8 h-8 text-cyan-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">Digital Media</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        Quotes from podcasts, documentaries, video games, and online content that reflect our digital age.
      </p>
    </div>
  </div>
</template>

<script setup>
// This component doesn't need any reactive logic
</script>
