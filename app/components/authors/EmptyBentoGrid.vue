<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Real Authors Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-user" class="w-8 h-8 text-blue-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.real_authors') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.real_authors_desc') }}
      </p>
    </div>

    <!-- Fictional Characters Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-mask-happy" class="w-8 h-8 text-purple-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.fictional_characters') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.fictional_characters_desc') }}
      </p>
    </div>

    <!-- Author Profiles Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-identification-card" class="w-8 h-8 text-green-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.rich_profiles') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.rich_profiles_desc') }}
      </p>
    </div>

    <!-- Search & Filter Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-magnifying-glass" class="w-8 h-8 text-orange-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.smart_search') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.smart_search_desc') }}
      </p>
    </div>

    <!-- Collections Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-heart" class="w-8 h-8 text-red-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.like_follow') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.like_follow_desc') }}
      </p>
    </div>

    <!-- Community Feature -->
    <div class="border b-dashed b-gray-200 dark:border-gray-400 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
      <div class="flex items-center mb-4">
        <NIcon name="i-ph-users-three" class="w-8 h-8 text-indigo-500 mr-3" />
        <h3 class="font-subtitle text-xl font-600">{{ $t('authors.empty_bento.community_driven') }}</h3>
      </div>
      <p class="font-sans text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {{ $t('authors.empty_bento.community_driven_desc') }}
      </p>
    </div>
  </div>
</template>

<script setup>
const { $t } = useI18n()
</script>
