<template>
  <NInput
    v-model="model"
    :type="showPassword ? 'text' : 'password'"
    class="bg-white dark:bg-gray-900 b-none shadow-none pl-12"
    :disabled="disabled"
    :placeholder="placeholder"
    :required="required"
    :una="{ inputLeadingWrapper: 'pl-0.7 pointer-events-auto' }"
    v-bind="$attrs"
  >
    <template #leading>
      <NTooltip :disabled="disabled" :content="showPassword ? 'Hide password' : 'Reveal password'">
        <NButton icon :label="showPassword ? 'i-ph-eye' : 'i-ph-key'" btn="soft-blue" size="xs" @click="togglePassword" class="hover:scale-105 active:scale-96 transition-[transform]" />
      </NTooltip>
    </template>
  </NInput>
</template>

<script setup lang="ts">
const model = defineModel<string>({ required: true })

interface Props {
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

defineProps<Props>()

const showPassword = ref(false)
const togglePassword = () => { showPassword.value = !showPassword.value }
</script>
