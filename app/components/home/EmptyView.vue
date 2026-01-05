<template>
  <div class="font-sans">
    <!-- Hero Section with Vibrant Background -->
    <div class="m-6 rounded-2 relative overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-700 dark:via-[#5A7ACD] dark:to-[#00F7FF]">
      <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Left Content -->
          <div class="space-y-8">
            <div>
              <h1 class="text-5xl lg:text-7xl font-800 text-gray-900 dark:text-white leading-tight mb-6">
                Collect Words<br>
                <span class="relative inline-block">
                  That Move
                  <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8 Q50 2, 100 8 T200 8" stroke="currentColor" stroke-width="3" fill="none" class="text-gray-900 dark:text-white"/>
                  </svg>
                </span>
                <br>the World
              </h1>
              <p class="text-xl lg:text-2xl text-gray-700 dark:text-gray-100 leading-relaxed">
                Your personal sanctuary for wisdom, inspiration, and memorable quotes from the greatest minds in history.
              </p>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
              <NButton
                v-if="needsOnboarding && (onboardingStatus?.step === 'admin_user' || !onboardingStatus?.hasAdminUser)"
                size="xl"
                to="/onboarding/admin"
                class="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-10 py-5 text-lg font-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <NIcon name="i-ph-rocket-launch" class="w-5 h-5" />
                <span>Get Started Now</span>
              </NButton>
              <NButton
                v-else-if="needsOnboarding && (onboardingStatus?.step === 'database_data' || !onboardingStatus?.hasData)"
                size="xl"
                to="/onboarding/database"
                class="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-10 py-5 text-lg font-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <NIcon name="i-ph-database" class="w-5 h-5" />
                <span>Initialize Database</span>
              </NButton>
              <NButton
                v-else-if="stats.quotes === 0"
                @click="$emit('openSubmitModal')"
                size="xl"
                class="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-10 py-5 text-lg font-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <NIcon name="i-ph-plus-circle" class="w-5 h-5" />
                <span>Submit Your First Quote</span>
              </NButton>
              <NButton
                v-if="needsOnboarding"
                size="xl"
                to="/onboarding/database"
                btn="outline"
                class="border-3 border-gray-900 text-gray-900 dark:border-white dark:text-white hover:bg-gray-900/10 dark:hover:bg-white/10 px-10 py-5 text-lg font-600 rounded-2xl transition-all"
              >
                <span>Import Backup</span>
                <NIcon name="i-ph-arrow-right" class="w-5 h-5" />
              </NButton>
            </div>

            <!-- Stats Pills -->
            <div v-if="!needsOnboarding" class="flex flex-wrap gap-3">
              <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-5 py-3 rounded-full shadow-md">
                <span class="text-sm font-600 text-gray-900 dark:text-white">🚀 Ready to Launch</span>
              </div>
              <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-5 py-3 rounded-full shadow-md">
                <span class="text-sm font-600 text-gray-900 dark:text-white">✨ 100% Free</span>
              </div>
              <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-5 py-3 rounded-full shadow-md">
                <span class="text-sm font-600 text-gray-900 dark:text-white">🎨 Beautiful Design</span>
              </div>
            </div>
          </div>

          <!-- Right Content - Celebrity Quote Cards -->
          <div class="relative h-[600px] lg:h-[700px]">
              <!-- Floating Quote Card 2 - Einstein (moved to right/top) -->
            <div class="absolute top-0 right-0 w-80 bg-gradient-to-br from-blue-50 to-indigo-50 
              dark:from-[#000000] dark:to-[#11224E] rounded-3xl shadow-2xl p-6 transform rotate-6 
              hover:rotate-3 transition-transform duration-300">
              <div class="flex items-start gap-4 mb-4">
                <img 
                  src="https://images.squarespace-cdn.com/content/v1/5fdde127109152533653b6f9/1610384397598-2R5XSS3DYTP00V2XYRRE/Albert.jpg" 
                  alt="Albert Einstein"
                  class="w-16 h-16 rounded-full object-cover ring-4 ring-blue-300"
                />
                <div class="flex-1">
                  <h3 class="font-700 text-gray-900 dark:text-white text-lg">Albert Einstein</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Theoretical Physicist</p>
                </div>
              </div>
              <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world."
              </p>
            </div>

            <!-- Floating Quote Card 1 - Marilyn (moved to left/top) -->
            <div class="absolute top-40 left-0 w-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 transform -rotate-3 
              hover:rotate-0 transition-transform duration-300">
              <div class="flex items-start gap-4 mb-4">
                <img 
                  src="https://cdn.artphotolimited.com/images/61a73c0dbd40b81766e77efb/1000x1000/elegant-marilyn-monroe.jpg" 
                  alt="Marilyn Monroe"
                  class="w-16 h-16 rounded-full object-cover ring-4 ring-lime-300"
                />
                <div class="flex-1">
                  <h3 class="font-700 text-gray-900 dark:text-white text-lg">Marilyn Monroe</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Actress & Icon</p>
                </div>
              </div>
              <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "Imperfection is beauty, madness is genius and it's better to be absolutely ridiculous than absolutely boring."
              </p>
            </div>

            <!-- Floating Quote Card 3 - Scorsese -->
            <div class="absolute bottom-0 right-8 w-80 bg-gradient-to-br from-amber-50 to-orange-50 
              dark:from-[#001F3D] dark:to-[#3B4953] rounded-3xl shadow-2xl p-6 transform rotate-3 
              hover:rotate-0 transition-transform duration-300">
              <div class="flex items-start gap-4 mb-4">
                <img 
                  src="https://www.screentune.com/wp-content/uploads/2018/11/MARTIN-SCORSESE.jpg" 
                  alt="Martin Scorsese"
                  class="w-16 h-16 rounded-full object-cover ring-4 ring-amber-300"
                />
                <div class="flex-1">
                  <h3 class="font-700 text-gray-900 dark:text-white text-lg">Martin Scorsese</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Film Director</p>
                </div>
              </div>
              <p class="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                "The most personal is the most creative. Make pictures about what you know, what excites you."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
      <div class="text-center mb-16">
        <h2 class="text-4xl lg:text-5xl font-800 text-gray-900 dark:text-white mb-4">
          Everything You Need to Curate Wisdom
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Powerful features designed to help you collect, organize, and share the quotes that inspire you.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        <!-- Feature 1 -->
        <div class="group bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-900/20 dark:to-lime-800/20 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
          <div class="w-14 h-14 bg-lime-300 dark:bg-lime-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <NIcon name="i-ph-rocket-launch" class="w-7 h-7 text-gray-900" />
          </div>
          <h3 class="text-xl font-700 text-gray-900 dark:text-white mb-3">Quick Start</h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            Set up your account in minutes and start collecting quotes immediately. No complicated setup required.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
          <div class="w-14 h-14 bg-blue-300 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <NIcon name="i-ph-infinity" class="w-7 h-7 text-gray-900" />
          </div>
          <h3 class="text-xl font-700 text-gray-900 dark:text-white mb-3">Unlimited Quotes</h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            Store as many quotes as you want. No limits, no paywalls. Your collection grows with you.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
          <div class="w-14 h-14 bg-purple-300 dark:bg-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <NIcon name="i-ph-folders" class="w-7 h-7 text-gray-900" />
          </div>
          <h3 class="text-xl font-700 text-gray-900 dark:text-white mb-3">Smart Collections</h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            Organize quotes into themed collections. Tag, categorize, and find them instantly when you need them.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="group bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 duration-300">
          <div class="w-14 h-14 bg-amber-300 dark:bg-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <NIcon name="i-ph-share-network" class="w-7 h-7 text-gray-900" />
          </div>
          <h3 class="text-xl font-700 text-gray-900 dark:text-white mb-3">Share & Inspire</h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            Share your favorite quotes with the world. Export, download, or publish beautiful quote cards.
          </p>
        </div>
      </div>

      <!-- Bento Grid -->
      <HomeEmptyBentoGrid />
    </div>

    <!-- Journey Section - More Visual & Engaging -->
    <div class="m-6 rounded-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0F0E0E] dark:to-gray-800 py-20">
      <div class="max-w-5xl mx-auto px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-3xl mb-6 shadow-xl">
            <NIcon name="i-ph-heart-fill" class="w-10 h-10 text-white" />
          </div>
          <h2 class="text-4xl lg:text-5xl font-800 text-gray-900 dark:text-white mb-4">
            Built with Passion
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400">
            The 8th iteration of a dream that refuses to die
          </p>
        </div>

        <!-- Timeline -->
        <div class="relative">
          <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-lime-300 via-blue-300 to-purple-300 transform -translate-x-1/2 hidden lg:block"></div>
          
          <div class="space-y-12">
            <!-- Timeline Item 1 -->
            <div class="relative">
              <div class="lg:flex items-center gap-8">
                <div class="lg:w-1/2 lg:text-right lg:pr-12">
                  <div class="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-left mb-4 lg:mb-0">
                    <span class="inline-block bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full text-sm font-600 mb-3">2011 • Windows Phone 7</span>
                    <h3 class="text-2xl font-700 text-gray-900 dark:text-white">Citamour</h3>
                    <p class="font-500 text-gray-600 dark:text-gray-400">The beginning. A simple app pulling quotes from Evene.fr.</p>
                  </div>
                </div>
                <div class="hidden lg:block w-6 h-6 bg-pink-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg relative z-10"></div>
                <div class="lg:w-1/2"></div>
              </div>
            </div>

            <!-- Timeline Item 2 -->
            <div class="relative">
              <div class="lg:flex items-center gap-8">
                <div class="lg:w-1/2"></div>
                <div class="hidden lg:block w-6 h-6 bg-blue-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg relative z-10"></div>
                <div class="lg:w-1/2 lg:pl-12">
                  <div class="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-left">
                    <span class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-600 mb-3">2012 • Windows 8</span>
                    <h3 class="text-2xl font-700 text-gray-900 dark:text-white">Citations 365</h3>
                    <p class="font-500 text-gray-600 dark:text-gray-400">Rebuilt for the modern Windows 8 platform.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline Item 3 -->
            <div class="relative">
              <div class="lg:flex items-center gap-8">
                <div class="lg:w-1/2 lg:text-right lg:pr-12">
                  <div class="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-left mb-4 lg:mb-0">
                    <span class="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-600 mb-3">2020 • Svelte</span>
                    <h3 class="text-2xl font-700 text-gray-900 dark:text-white">Memorare</h3>
                    <p class="font-500 text-gray-600 dark:text-gray-400">A complete rewrite with modern web technologies.</p>
                  </div>
                </div>
                <div class="hidden lg:block w-6 h-6 bg-purple-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg relative z-10"></div>
                <div class="lg:w-1/2"></div>
              </div>
            </div>

            <!-- Timeline Item 4 -->
            <div class="relative">
              <div class="lg:flex items-center gap-8">
                <div class="lg:w-1/2"></div>
                <div class="hidden lg:block w-6 h-6 bg-orange-400 rounded-full border-4 border-white dark:border-gray-900 shadow-lg relative z-10"></div>
                <div class="lg:w-1/2 lg:pl-12">
                  <div class="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-left">
                    <span class="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-600 mb-3">2021 • Flutter</span>
                    <h3 class="text-2xl font-700 text-gray-900 dark:text-white mb-2">Kwotes</h3>
                    <p class="text-gray-600 dark:text-gray-400">Universal app for Android, iOS, and web. iOS release achieved.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline Item 5 - Current -->
            <div class="relative">
              <div class="lg:flex items-center gap-8">
                <div class="lg:w-1/2 lg:text-right lg:pr-12">
                  <div class="inline-block bg-gradient-to-br from-lime-200 to-yellow-200 dark:from-[#4E61D3] dark:to-[#4E61D3] rounded-2xl shadow-xl p-8 text-left mb-4 lg:mb-0 border-4 border-lime-400 dark:border-lime-500">
                    <span class="inline-block bg-white/90 dark:bg-gray-900/90 text-lime-700 dark:text-lime-300 px-4 py-2 rounded-full text-sm font-700 mb-3">2026 • Nuxt 3 + NuxtHub</span>
                    <h3 class="text-3xl font-800 text-gray-900 dark:text-white mb-2">Verbatims</h3>
                    <p class="text-gray-800 dark:text-gray-100 font-500">The culmination. Simple, focused, and built to last.</p>
                  </div>
                </div>
                <div class="hidden lg:block w-8 h-8 bg-gradient-to-br from-lime-400 to-yellow-400 rounded-full border-4 border-white dark:border-gray-900 shadow-2xl relative z-10 animate-pulse"></div>
                <div class="lg:w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Key Learnings -->
        <div class="mt-20 grid md:grid-cols-2 gap-8">
          <div class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-shrink-0 w-12 h-12 bg-lime-300 dark:bg-lime-500 text-gray-900 rounded-2xl flex items-center justify-center text-2xl font-800">
                1
              </div>
              <h3 class="text-xl font-700 text-gray-900 dark:text-white">Keep It Simple</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              No more over-engineering. Just a beautiful, simple quotes app with the features that matter. 
              Focus on delivering emotion, not complexity.
            </p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-shrink-0 w-12 h-12 bg-lime-300 dark:bg-lime-500 text-gray-900 rounded-2xl flex items-center justify-center text-2xl font-800">
                2
              </div>
              <h3 class="text-xl font-700 text-gray-900 dark:text-white">Follow Your Passion</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Eight attempts later, I still can't let it go. That obsession is a sign. 
              When you can't find what you're looking for, build it yourself.
            </p>
          </div>
        </div>

        <!-- Final CTA -->
        <div class="mt-16 text-center">
          <p class="text-3xl font-700 text-gray-900 dark:text-white mb-8">
            Welcome to Verbatims — built with passion, designed for simplicity.
          </p>
          <NButton
            v-if="needsOnboarding"
            size="xl"
            to="/onboarding/admin"
            class="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-12 py-6 text-xl font-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            <span>Start Your Journey</span>
            <NIcon name="i-ph-arrow-right" class="w-6 h-6" />
          </NButton>
          <NButton
            v-else
            @click="$emit('openSubmitModal')"
            size="xl"
            class="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-12 py-6 text-xl font-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            <span>Add Your First Quote</span>
            <NIcon name="i-ph-arrow-right" class="w-6 h-6" />
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  needsOnboarding: boolean
  onboardingStatus: {
    step?: string
    hasAdminUser?: boolean
    hasData?: boolean
  }
  stats: {
    quotes: number
    authors: number
    references: number
    users: number
  }
}

withDefaults(defineProps<Props>(), {
  needsOnboarding: false,
  onboardingStatus: () => ({}),
  stats: () => ({ quotes: 0, authors: 0, references: 0, users: 0 })
})

const emit = defineEmits(['openSubmitModal'])
</script>
