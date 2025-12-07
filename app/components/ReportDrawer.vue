<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-title uppercase text-size-4 font-600">{{ title }}</h3>
          <NButton icon btn="ghost-gray" label="i-ph-x-bold" size="sm" @click="close" />
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="block text-sm font-medium mb-1">Category</label>
            <NSelect
              v-model="form.category"
              :items="categories"
              item-key="label"
              value-key="label"
            />
          </div>

          <div v-if="!isAuthenticated">
            <label class="block text-sm font-medium mb-1">Name</label>
            <NInput v-model="form.name" placeholder="Your name" />
          </div>

          <div v-if="!isAuthenticated">
            <label class="block text-sm font-medium mb-1">Email</label>
            <NInput v-model="form.email" type="email" placeholder="you@example.com" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Message</label>
            <NInput
              type="textarea"
              v-model="form.message"
              :rows="5"
              placeholder="Tell us what you found, what to improve, or your suggestion..."
              required
            />
            <div class="mt-1 text-right text-xs text-gray-500">{{ form.message.length }}/4000</div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Tags (optional)</label>
            <NInput v-model="tagsInput" placeholder="Comma-separated (e.g. UI, accessibility)" />
          </div>
        </form>

        <div class="mt-5 flex gap-2">
          <NButton btn="light:soft dark:soft-white" class="flex-1" @click="close" :disabled="pending">Cancel</NButton>
          <NButton btn="soft-blue" class="flex-1" :loading="pending" :disabled="!canSubmit" @click="onSubmit">Submit</NButton>
        </div>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
import type { ReportTargetType, ReportCategory } from '~/types/report'
import { useReportForm } from '~/composables/useReportForm'

interface Emits {
  (e: 'update:open', v: boolean): void
  (e: 'submitted'): void
}

const props = withDefaults(defineProps<{
  open?: boolean
  targetType?: ReportTargetType
  targetId?: number
  category?: ReportCategory
}>(), {
  targetType: 'general',
  targetId: undefined,
  category: undefined
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => !!props.open,
  set: v => emit('update:open', v)
})

const { toast } = useToast()

const {
  categories,
  form,
  tagsInput,
  pending,
  isAuthenticated,
  canSubmit,
  reset,
  submit,
  titleFor
} = useReportForm({
  targetType: computed(() => props.targetType),
  targetId: computed(() => props.targetId)
})

// Watch for drawer open and set category if provided
watch(
  () => isOpen.value,
  (open) => {
    if (!open || !props.category) return
    const found = categories.find(c => c.value === props.category)
    if (found) form.value.category = found
  }
)

const title = computed(() => titleFor(props.targetType))

const close = () => { isOpen.value = false; reset() }

const onSubmit = async () => {
  if (!canSubmit.value || pending.value) return
  try {
    const res = await submit()
    if (res?.status === 'ratelimited') {
      toast({ title: 'Too many messages', description: 'Please slow down and try again later.', toast: 'error' })
      return
    }
    
    toast({ title: 'Thanks for your message!', toast: 'success' })
    emit('submitted')
    close()
  } catch (error) {
    toast({ title: 'Submission failed', description: 'Please try again.', toast: 'error' })
  }
}
</script>
