<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/api/client'

const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''

  try {
    console.log('[LoginPage] Submitting login form...')
    await auth.login(form)
    console.log('[LoginPage] Login completed successfully')
  } catch (e: unknown) {
    console.error('[LoginPage] Login failed:', e)
    error.value = getErrorMessage(e, 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary">☀️ Solar ERP</h1>
        <p class="mt-2 text-muted-foreground">Sign in to your account</p>
      </div>

      <!-- Form -->
      <form
        novalidate
        class="bg-card rounded-xl shadow-sm border border-border p-8"
        @submit.prevent="handleSubmit"
      >
        <!-- Error Alert -->
        <div
          v-if="error"
          class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          {{ error }}
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="you@company.com"
          />
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in</span>
        </button>
      </form>
    </div>
  </div>
</template>
