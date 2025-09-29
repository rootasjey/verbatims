<template>
  <div class="min-h-screen light:bg-purple-100 flex items-center justify-center p-8">
    <div class="w-full">
      <!-- Header -->
      <div class="text-center mt-12 mb-8">
        <h1 class="font-title text-size-6 font-600 line-height-none uppercase">Verbatims</h1>
        <h2 class="font-serif text-size-12 font-600">Create Admin User</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Set up your administrator account to manage the quotes database.
        </p>
      </div>

      <!-- Form -->
      <UCard class="p-6 max-w-md mx-auto">
        <form @submit.prevent="createAdminUser" class="space-y-6">
          <!-- Username -->
          <div>
            <label class="block text-sm font-medium mb-2">Username</label>
            <UInput
              v-model="form.username"
              placeholder="Enter username"
              :disabled="loading"
              required
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <UInput
              v-model="form.email"
              type="email"
              placeholder="Enter email address"
              :disabled="loading"
              required
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium mb-2">Password</label>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="Enter password"
              :disabled="loading"
              required
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium mb-2">Confirm Password</label>
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm password"
              :disabled="loading"
              required
            />
          </div>

          <!-- Admin Authorization Password -->
          <div>
            <label class="block text-sm font-medium mb-2">Admin Authorization Password</label>
            <UInput
              v-model="form.adminPassword"
              type="password"
              placeholder="Enter admin authorization password"
              :disabled="loading"
              required
            />
            <p class="text-xs text-gray-500 mt-1">
              This must match the ADMIN_PASSWORD environment variable for security.
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-md">
            <p class="text-sm text-green-600">{{ success }}</p>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            :loading="loading"
            :disabled="!isFormValid"
            class="w-full"
            size="sm"
          >
            Create Admin User
          </UButton>
        </form>

        <!-- Navigation -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center text-sm">
            <UButton btn="link" to="/" class="p-0">
              ← Back to Home
            </UButton>
            <span class="text-gray-500">Step 1 of 2</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: 'Create Admin User - Verbatims Onboarding',
  meta: [
    { name: 'description', content: 'Create your administrator account for the Verbatims quotes database.' }
  ]
})

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  adminPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const isFormValid = computed(() => {
  return form.value.username.trim() &&
         form.value.email.trim() &&
         form.value.password.trim() &&
         form.value.confirmPassword.trim() &&
         form.value.adminPassword.trim() &&
         form.value.password === form.value.confirmPassword
})

const createAdminUser = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all fields correctly'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await $fetch('/api/onboarding/admin', {
      method: 'POST',
      body: {
        username: form.value.username.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        adminPassword: form.value.adminPassword
      }
    })

    if (response.success) {
      success.value = 'Admin user created successfully!'
      
      setTimeout(() => {
        navigateTo('/onboarding/database')
      }, 2000)
    } else {
      error.value = response.message || 'Failed to create admin user'
    }
  } catch (err: any) {
    console.error('Admin user creation error:', err)
    error.value = err.data?.message || 'Failed to create admin user'
  } finally {
    loading.value = false
  }
}

// Check if we should be here
onMounted(async () => {
  try {
    const status = await $fetch('/api/onboarding/status')
    if (status.success && !status.data.needsOnboarding) {
      // Already onboarded, redirect to home
      await navigateTo('/')
    } else if (status.data.step !== 'admin_user' && status.data.hasAdminUser) {
      // Admin user already exists, go to database step
      await navigateTo('/onboarding/database')
    }
  } catch (error) {
    console.error('Failed to check onboarding status:', error)
  }
})
</script>
