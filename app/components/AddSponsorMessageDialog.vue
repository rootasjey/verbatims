<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ dialogTitle }}</h3>
      </div>

      <form @submit.prevent="submit" @keydown.ctrl.enter.prevent="submit" @keydown.meta.enter.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Message *</label>
          <NInput v-model="form.message" placeholder="e.g., Check out our new collection!" :disabled="submitting" required autofocus />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Leading Icon</label>
            <NInput v-model="form.leading_icon" placeholder="i-ph-star" :disabled="submitting" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Trailing Icon</label>
            <NInput v-model="form.trailing_icon" placeholder="i-ph-heart" :disabled="submitting" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">URL (optional)</label>
          <NInput v-model="form.url" placeholder="https://example.com" :disabled="submitting" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Priority</label>
            <NInput v-model.number="form.priority" type="number" placeholder="0" :disabled="submitting" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Type</label>
            <NSelect
              v-model="form.type"
              :items="['internal', 'sponsored']"
              size="sm"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Start Date</label>
            <input
              v-model="form.starts_at"
              type="datetime-local"
              class="input !inline-flex !w-full"
              :disabled="submitting"
              @change="onStartsAtChange"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">End Date</label>
            <input
              v-model="form.ends_at"
              type="datetime-local"
              class="input !inline-flex !w-full"
              :disabled="submitting"
              @change="onEndsAtChange"
            >
          </div>
        </div>

        <NCheckbox v-model="form.is_active" label="Active" />
      </form>

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" :disabled="submitting" @click="close">Cancel</NButton>
        <NButton btn="soft-blue" :loading="submitting" :disabled="!form.message.trim()" @click="submit">{{ submitText }}</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; editMessage?: any | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.editMessage)
const dialogTitle = computed(() => isEdit.value ? 'Edit Sponsor Message' : 'Create Sponsor Message')
const submitText = computed(() => isEdit.value ? 'Update Message' : 'Create Message')

const submitting = ref(false)

const normalizeDatetime = (val: string) => {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val + 'T01:00'
  if (val.endsWith('T00:00')) return val.slice(0, -5) + '01:00'
  return val
}

const onStartsAtChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  form.starts_at = normalizeDatetime(val)
}

const onEndsAtChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  form.ends_at = normalizeDatetime(val)
}

const form = reactive({
  message: '',
  leading_icon: '',
  trailing_icon: '',
  url: '',
  type: 'internal' as 'internal' | 'sponsored',
  is_active: true,
  priority: 0,
  starts_at: '',
  ends_at: '',
})

watch(() => props.editMessage, (msg) => {
  if (msg) {
    form.message = msg.message || ''
    form.leading_icon = msg.leadingIcon || ''
    form.trailing_icon = msg.trailingIcon || ''
    form.url = msg.url || ''
    form.type = msg.type || 'internal'
    form.is_active = Boolean(msg.isActive)
    form.priority = msg.priority ?? 0
    form.starts_at = msg.startsAt || ''
    form.ends_at = msg.endsAt || ''
  } else {
    form.message = ''
    form.leading_icon = ''
    form.trailing_icon = ''
    form.url = ''
    form.type = 'internal'
    form.is_active = true
    form.priority = 0
    form.starts_at = ''
    form.ends_at = ''
  }
}, { immediate: true })

const close = () => { isOpen.value = false }

const submit = async () => {
  if (submitting.value || !form.message.trim()) return
  submitting.value = true
  try {
    const payload = {
      message: form.message.trim(),
      leading_icon: form.leading_icon.trim() || null,
      trailing_icon: form.trailing_icon.trim() || null,
      url: form.url.trim() || null,
      type: form.type,
      is_active: form.is_active,
      priority: form.priority,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }

    if (isEdit.value && props.editMessage) {
      await $fetch(`/api/admin/sponsors/${props.editMessage.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/sponsors', { method: 'POST', body: payload })
    }
    emit('saved')
    close()
  } catch (error: any) {
    console.error('Error saving sponsor message:', error)
    useToast().toast({ toast: 'soft-error', title: 'Error', description: 'Failed to save sponsor message' })
  } finally {
    submitting.value = false
  }
}
</script>
