<template>
  <div class="max-w-5xl mx-auto mt-12 mb-24">
    <h2 class="font-sans text-center text-base/7 font-600 text-indigo-600">A Universal Quotes Service</h2>
    <p class="font-serif mx-auto mt-2 max-w-3xl text-center text-2xl sm:text-4xl font-500 tracking-tight text-balance">
      From timeless literature to modern cinema,
      discover, collect, and share meaningful quotes from every corner of human expression.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto font-sans">
    <!-- Content Sources (Large - spans 1 column, 2 rows) -->
    <NCard class="md:col-span-1 md:row-span-2 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-200 hover:border-primary-700 bg-gray-50 dark:bg-gray-800/20">
      <div class="p-6 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-xl font-600">Diverse Content Sources</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
          From blockbuster films and acclaimed TV series to indie games and classic literature.
        </p>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm">
            <NIcon name="i-ph-star" class="w-4 h-4 text-yellow-500" />
            <span class="font-medium">Star Wars</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <NIcon name="i-ph-game-controller" class="w-4 h-4 text-purple-500" />
            <span class="font-medium">Clair-Obscure: Expedition 33</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <NIcon name="i-ph-book" class="w-4 h-4 text-green-500" />
            <span class="font-medium">Les fleurs du mal</span>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Community-Driven (Medium - spans 1 column) -->
    <NCard class="md:col-span-1 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 bg-gray-50 dark:bg-gray-800/20">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-lg font-600">Community-Driven</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Built by quote enthusiasts, for quote enthusiasts. Every contribution matters.
        </p>
        <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <NIcon name="i-ph-heart" class="w-4 h-4" />
          <span>User submissions welcome</span>
        </div>
      </div>
    </NCard>

    <!-- Search Functionality (Medium - spans 1 column) -->
    <NCard class="md:col-span-1 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-200 hover:border-purple-700 bg-gray-50 dark:bg-gray-800/20">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-lg font-600">Powerful Search</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Find the perfect quote with advanced search across authors, references, and content.
        </p>
        <div class="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
          <NIcon name="i-ph-lightning" class="w-4 h-4" />
          <span>Instant results</span>
        </div>
      </div>
    </NCard>

    <NCard class="md:col-span-1 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 hover:border-blue-500"
      :una="{
        cardContent: 'p-0 h-full',
      }"
    >
      <div class="p-4 text-center h-full flex flex-col justify-center items-center">
        <NIcon name="i-ph-globe" class="w-8 h-8 text-blue-500 mx-auto mb-3" />
        <h3 class="text-sm font-600">Universal Access</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Web-based, works everywhere
        </p>
      </div>
    </NCard>

    <NCard class="cursor-pointer md:col-span-1 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 hover:border-black dark:hover:border-white"
      :una="{
        cardContent: 'p-0 h-full',
      }"
      @click="navigateTo('https://github.com/rootasjey/verbatims', { open: { target: '_blank' } })"
    >
      <div class="p-4 text-center h-full flex flex-col justify-center items-center">
        <NIcon name="i-ph-code" class="w-8 h-8 text-gray-800 dark:text-gray-200 mx-auto mb-3" />
        <h3 class="text-sm font-600">Open Source</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Transparent & collaborative
        </p>
      </div>
    </NCard>

    <NCard class="md:col-span-1 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 hover:border-red-500"
      :una="{
        cardContent: 'p-0 h-full',
      }"
    >
      <div class="p-4 text-center h-full flex flex-col justify-center items-center">
        <NIcon name="i-ph-shield-check" class="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h3 class="text-sm font-600">Quality Control</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Curated content
        </p>
      </div>
    </NCard>

    <!-- Collections (Large - spans 2 columns) -->
    <NCard class="md:col-span-2 group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-orange-200 hover:border-orange-700 bg-gray-50 dark:bg-gray-800/20">
      <div class="p-6">
        <div class="flex items-center gap-3">
          <NIcon name="i-ph-bookmark" class="text-orange-500" />
          <h3 class="text-lg font-600">Personal Collections</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Organize your favorite quotes into themed collections and share them with others.
        </p>
        <div class="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <NIcon name="i-ph-folder" class="w-4 h-4" />
          <span>Create & share collections</span>
        </div>
      </div>
    </NCard>
  </div>
</template>
