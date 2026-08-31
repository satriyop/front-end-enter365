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
    await auth.login(form)
  } catch (e: unknown) {
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
        <h1 class="text-3xl font-bold text-primary">Enter365</h1>
        <p class="mt-2 text-muted-foreground">SME ERP for Indonesian business</p>
      </div>

      <!-- Form -->
      <form
        novalidate
        autocomplete="off"
        class="bg-card rounded-xl shadow-sm border border-border p-8"
        @submit.prevent="handleSubmit"
      >
        <!-- Decoy pair so Chrome is less eager to Save / breach-warn the demo password. -->
        <input type="text" tabindex="-1" aria-hidden="true" autocomplete="username" class="sr-only" value="">
        <input type="password" tabindex="-1" aria-hidden="true" autocomplete="current-password" class="sr-only" value="">

        <div
          v-if="error"
          data-testid="login-error"
          class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          {{ error }}
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            autocomplete="username"
            data-lpignore="true"
            data-1p-ignore
            data-testid="login-email"
            class="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="you@company.com"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Kata sandi
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            data-lpignore="true"
            data-1p-ignore
            data-testid="login-password"
            class="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          data-testid="login-submit"
          class="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loading">Masuk...</span>
          <span v-else>Masuk</span>
        </button>
      </form>
    </div>
  </div>
</template>
