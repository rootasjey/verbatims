<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitText as string"
    :submitting="submitting"
    :can-submit="!!form.message.trim()"
    max-width="md"
    @submit="submit"
  >
    <form @submit.prevent="submit" @keydown.ctrl.enter.prevent="submit" @keydown.meta.enter.prevent="submit" class="space-y-6">
      <div>
        <NInput
          v-model="form.message"
          :placeholder="$t('components.dialogs.placeholder_message') as string"
          :disabled="submitting"
          required
          autofocus
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('components.dialogs.message_label') }}
            </NBadge>
          </template>
        </NInput>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <NInput
          v-model="form.leading_icon"
          :placeholder="$t('components.dialogs.leading_icon') as string"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('components.dialogs.leading_icon') }}
            </NBadge>
          </template>
        </NInput>
        <NInput
          v-model="form.trailing_icon"
          :placeholder="$t('components.dialogs.trailing_icon') as string"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('components.dialogs.trailing_icon') }}
            </NBadge>
          </template>
        </NInput>
      </div>

      <NInput
        v-model="form.url"
        :placeholder="$t('components.dialogs.placeholder_url') as string"
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('components.dialogs.url_label') }}
            </NBadge>
        </template>
      </NInput>

      <div class="flex items-start gap-3">
        <NInput
          v-model.number="form.priority"
          type="number"
          :placeholder="$t('common.na') as string"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('common.status') }}
            </NBadge>
          </template>
        </NInput>
        <div class="grow-1">
          <NSelect v-model="form.type" select="soft-blue" select-item="blue" :items="['internal', 'sponsored']" size="sm" />
          <label class="ml-1 block text-xs font-600 text-gray-600 dark:text-gray-200">{{ $t('common.status') }}</label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.start_date') }}</label>
          <input
            v-model="form.starts_at"
            type="datetime-local"
            class="input !inline-flex !w-full"
            :disabled="submitting"
            @change="onStartsAtChange"
          >
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.end_date') }}</label>
          <input
            v-model="form.ends_at"
            type="datetime-local"
            class="input !inline-flex !w-full"
            :disabled="submitting"
            @change="onEndsAtChange"
          >
        </div>
      </div>

      <div v-if="showActiveWarning" class="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
        <span class="i-ph-warning-circle w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div class="text-sm text-amber-700 dark:text-amber-300">
          <strong>{{ $t('common.status_active') }}: {{ activeCount }}</strong> — {{ $t('components.dialogs.toast_created') }}.
          {{ $t('components.dialogs.toast_updated') }}
        </div>
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; editMessage?: any | null; activeCount?: number }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.editMessage)
const showActiveWarning = computed(() => {
  return (props.activeCount || 0) >= 10
})
const dialogTitle = computed(() => isEdit.value ? $t('components.dialogs.edit_sponsor') : $t('components.dialogs.add_sponsor'))
const submitText = computed(() => isEdit.value ? $t('components.dialogs.update') : $t('components.dialogs.create'))

const submitting = ref(false)
const { showErrorToast } = useErrorToast()

const normalizeDatetime = (val: string) => {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val + 'T00:01'
  if (val.match(/^\d{4}-\d{2}-\d{2}T00:00$/)) return val.slice(0, -4) + '01'
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
    form.priority = msg.priority ?? 0
    form.starts_at = msg.startsAt || ''
    form.ends_at = msg.endsAt || ''
  } else {
    form.message = ''
    form.leading_icon = ''
    form.trailing_icon = ''
    form.url = ''
    form.type = 'internal'
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
    showErrorToast(error, String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
  }
}
</script>
