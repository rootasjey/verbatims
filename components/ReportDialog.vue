<template>
  <UDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600">{{ title }}</h3>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium mb-1">Category</label>
          <USelect
            v-model="form.category"
            :items="categories"
            item-key="label"
            value-key="label"
          />
        </div>

        <div v-if="!isAuthenticated">
          <label class="block text-sm font-medium mb-1">Name (optional)</label>
          <UInput v-model="form.name" placeholder="Your name" />
        </div>

        <div v-if="!isAuthenticated">
          <label class="block text-sm font-medium mb-1">Email (optional)</label>
          <UInput v-model="form.email" type="email" placeholder="you@example.com" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Message</label>
          <UInput
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
          <UInput v-model="tagsInput" placeholder="Comma-separated (e.g. UI, accessibility)" />
        </div>
      </form>

      <div class="mt-6 flex justify-end gap-2">
        <UButton btn="light:soft dark:soft-white" @click="close" :disabled="pending">Cancel</UButton>
        <UButton btn="soft-blue" :loading="pending" :disabled="!canSubmit" @click="submit">Submit</UButton>
      </div>
    </div>
  </UDialog>
</template>

<script setup lang="ts">
import type { ReportCategory, ReportTargetType } from '~/types/report'

interface Props {
  modelValue: boolean
  targetType?: ReportTargetType
  targetId?: number | null
}

interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted'): void
}

const props = withDefaults(defineProps<Props>(), {
  targetType: 'general',
  targetId: null
})
const emit = defineEmits<Emits>()

const { user } = useUserSession()
const isAuthenticated = computed(() => !!user.value)

const isOpen = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const title = computed(() => {
  switch (props.targetType) {
    case 'quote': return 'Report Quote'
    case 'author': return 'Report Author'
    case 'reference': return 'Report Reference'
    default: return 'Send Feedback'
  }
})

const categories = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Content', value: 'content' },
  { label: 'Other', value: 'other' }
]

const form = ref({
  category: categories[0],
  name: '',
  email: '',
  message: ''
})
const tagsInput = ref('')
const pending = ref(false)

const canSubmit = computed(() => form.value.message.trim().length >= 10)

const close = () => { isOpen.value = false; reset() }

const reset = () => {
  form.value = { category: categories[0], name: '', email: '', message: '' }
  tagsInput.value = ''
}

const submit = async () => {
  if (!canSubmit.value || pending.value) return
  pending.value = true
  const { toast } = useToast()
  try {
    const payload: any = {
      category: (form.value.category.value as ReportCategory),
      message: form.value.message.trim(),
      tags: tagsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      target_type: props.targetType,
      target_id: props.targetId ?? null
    }

    if (!isAuthenticated.value) {
      payload.name = form.value.name?.trim() || undefined
      payload.email = form.value.email?.trim() || undefined
    }

    const res = await $fetch('/api/reports', { method: 'POST', body: payload })
    if (res?.status === 'ratelimited') {
      toast({ title: 'Too many messages', description: 'Please slow down and try again later.', toast: 'error' })
    } else {
      toast({ title: 'Thanks for your message!', toast: 'success' })
      emit('submitted')
      close()
    }
  } catch (err) {
    console.error('Report submit error:', err)
    toast({ title: 'Submission failed', description: 'Please try again.', toast: 'error' })
  } finally {
    pending.value = false
  }
}
</script>
