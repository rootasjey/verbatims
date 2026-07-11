<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Books Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-book" class="w-8 h-8 text-blue-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.books_literature') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.books_literature_desc') }}
      </p>
    </div>

    <!-- Films Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-film-strip" class="w-8 h-8 text-red-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.films_cinema') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.films_cinema_desc') }}
      </p>
    </div>

    <!-- TV Series Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-television" class="w-8 h-8 text-purple-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.tv_series') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.tv_series_desc') }}
      </p>
    </div>

    <!-- Music Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-music-notes" class="w-8 h-8 text-green-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.music_lyrics') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.music_lyrics_desc') }}
      </p>
    </div>

    <!-- Speeches & Interviews Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-microphone" class="w-8 h-8 text-orange-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.speeches_interviews') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.speeches_interviews_desc') }}
      </p>
    </div>

    <!-- Digital Media Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-globe" class="w-8 h-8 text-cyan-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('references.empty_bento.digital_media') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('references.empty_bento.digital_media_desc') }}
      </p>
    </div>
  </div>
</template>

<script setup>
const { $t } = useI18n()
</script>
