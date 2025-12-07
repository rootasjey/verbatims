<template>
  <div class="px-6 py-6">
    <div class="bg-white dark:bg-black rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex flex-col items-center mb-4">
        <span class="text-6xl font-bold text-gray-900 dark:text-white">
          {{ displayValue }}
        </span>
        <div class="flex items-center space-x-2 mt-2">
          <UBadge
            v-for="stat in statOptions"
            :key="stat.key"
            :badge="stat.key === 'views' ? 'soft-blue' : (stat.key === 'likes' ? 'soft-pink' : 'soft-indigo')"
            rounded="full"
            class="cursor-pointer transition-all duration-300 overflow-hidden hover:scale-102 active:scale-99"
            :style="stat.label === statLabel ? 'max-width: 200px;' : 'max-width: 40px;'"
            @click="statIndex = statOptions.indexOf(stat)"
          >
            <UIcon :name="stat.icon" />
            <span v-if="stat.label === statLabel" class="whitespace-nowrap text-ellipsis transition animate-fadeIn">{{ stat.label }}</span>
          </UBadge>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ published }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Published
          </p>
        </div>
        <div v-if="rejected > 0" class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ rejected }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Rejected
          </p>
        </div>
        <div v-else class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ pending }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Pending
          </p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ drafted }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Drafted
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

interface Props {
  /** Drafted quotes count */
  drafted?: number
  /** Liked quotes count */
  likes?: number
  /** Given likes count */
  likesGiven?: number
  /** Pending quotes count */
  pending?: number
  /** Published quotes count */
  published?: number
  /** Rejected quotes count */
  rejected?: number
  /** Views count */
  views?: number
}

const props = withDefaults(defineProps<Props>(), {
  drafted: 0,
  likes: 0,
  likesGiven: 0,
  pending: 0,
  published: 0,
  rejected: 0,
  views: 0,
})

interface Emits {
  showDetails: () => void
}

defineEmits<Emits>()

const statOptions = [
  {
    key: 'views',
    label: 'Views',
    icon: 'i-ph-eye-bold',
    value: computed(() => props.views ?? 0)
  },
  {
    key: 'likes',
    label: 'Likes',
    icon: 'i-ph-heart-bold',
    value: computed(() => props.likes ?? 0)
  },
  {
    key: 'likesGiven',
    label: 'Likes Given',
    icon: 'i-ph-thumbs-up-bold',
    value: computed(() => props.likesGiven ?? 0)
  }
]

const statIndex = useLocalStorage<number>('verbatims-mobile-progress-section-stat-index', 0)
const statValue = computed(() => statOptions[statIndex.value].value.value)
const displayValue = ref(statValue.value)

watch(statValue, (newValue, oldValue) => {
  animateNumber(oldValue, newValue)
})

function animateNumber(from: number, to: number) {
  const duration = 600 // ms
  const start = performance.now()
  
  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    displayValue.value = Math.round(from + (to - from) * progress)
    if (progress < 1) requestAnimationFrame(step)
    else displayValue.value = to
  }

  requestAnimationFrame(step)
}

onMounted(() => {
  displayValue.value = statValue.value
})

const statLabel = computed(() => statOptions[statIndex.value].label)
</script>

