# Authentication

> Auth flow, token management, and permission checking

## Overview

| Aspect | Implementation |
|--------|----------------|
| Auth Method | Laravel Sanctum (token-based) |
| Token Storage | localStorage |
| State Management | Pinia store |
| Token Refresh | Automatic on 401 |

---

## Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User submits credentials                                     │
│     └─→ POST /api/v1/auth/login                                  │
│                                                                  │
│  2. Server validates & returns                                   │
│     └─→ { token: "...", user: { id, name, roles, permissions } } │
│                                                                  │
│  3. Frontend stores token                                        │
│     └─→ localStorage.setItem('token', token)                     │
│     └─→ Pinia: auth.token = token, auth.user = user              │
│                                                                  │
│  4. Redirect to dashboard (or intended page)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Auth Store

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import router from '@/router'

export interface User {
  id: number
  name: string
  email: string
  roles?: Role[]
  permissions?: Permission[]
}

export interface Role {
  id: number
  name: string
  display_name: string
}

export interface Permission {
  id: number
  name: string
  display_name?: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  const hasPermission = (permission: string) => {
    if (!user.value) return false
    // Admin has all permissions
    if (user.value.roles?.some(r => r.name === 'admin')) return true
    return user.value.permissions?.some(p => p.name === permission) ?? false
  }

  const hasRole = (role: string) => {
    return user.value?.roles?.some(r => r.name === role) ?? false
  }

  // Actions
  async function login(credentials: { email: string; password: string }) {
    const response = await api.post('/auth/login', credentials)
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)

    // Redirect to intended page or dashboard
    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/')
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      user.value = response.data.user
    } catch {
      await logout()
    }
  }

  // Initialize: fetch user if token exists
  if (token.value) {
    fetchUser()
  }

  return {
    user,
    token,
    isAuthenticated,
    hasPermission,
    hasRole,
    login,
    logout,
    fetchUser,
  }
})
```

---

## Token Management

### Request Interceptor

```typescript
// src/api/client.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Token Refresh on 401

```typescript
// Response interceptor handles automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        // Refresh token
        const response = await api.post('/auth/refresh')
        const newToken = response.data.token
        localStorage.setItem('token', newToken)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        // Refresh failed, logout
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
```

---

## Route Guards

```typescript
// src/router/index.ts
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  // Protected route, not authenticated
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
  // Guest route (login), already authenticated
  else if (to.meta.guest && auth.isAuthenticated) {
    next({ name: 'dashboard' })
  }
  // Allow navigation
  else {
    next()
  }
})
```

---

## Permission Checking

### In Components

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <!-- Check permission -->
  <Button v-if="auth.hasPermission('quotations.create')">
    Create Quotation
  </Button>

  <!-- Check role -->
  <AdminPanel v-if="auth.hasRole('admin')" />

  <!-- Check authentication -->
  <LoginButton v-if="!auth.isAuthenticated" />
  <UserMenu v-else :user="auth.user" />
</template>
```

### Permission-Based Actions

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const canApprove = computed(() =>
  auth.hasPermission('quotations.approve') &&
  quotation.value?.status === 'submitted'
)

const canDelete = computed(() =>
  auth.hasPermission('quotations.delete') &&
  quotation.value?.status === 'draft'
)
</script>

<template>
  <Button v-if="canApprove" @click="handleApprove">
    Approve
  </Button>

  <Button v-if="canDelete" variant="destructive" @click="handleDelete">
    Delete
  </Button>
</template>
```

---

## Login Page

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/api/client'

const auth = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  error.value = ''
  isLoading.value = true

  try {
    await auth.login(form.value)
    // Redirect handled by store
  } catch (err) {
    error.value = getErrorMessage(err, 'Invalid credentials')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin" class="space-y-4">
    <Alert v-if="error" variant="destructive">
      {{ error }}
    </Alert>

    <FormField label="Email">
      <Input v-model="form.email" type="email" required />
    </FormField>

    <FormField label="Password">
      <Input v-model="form.password" type="password" required />
    </FormField>

    <Button type="submit" class="w-full" :disabled="isLoading">
      {{ isLoading ? 'Signing in...' : 'Sign In' }}
    </Button>
  </form>
</template>
```

---

## Logout

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
}
</script>

<template>
  <DropdownMenuItem @click="handleLogout">
    <LogOut class="w-4 h-4 mr-2" />
    Logout
  </DropdownMenuItem>
</template>
```

---

## User Menu Component

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { LogOut, Settings, User } from 'lucide-vue-next'

const auth = useAuthStore()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon">
        <User class="w-5 h-5" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      <div class="px-2 py-1.5">
        <p class="font-medium">{{ auth.user?.name }}</p>
        <p class="text-sm text-muted-foreground">{{ auth.user?.email }}</p>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem as="router-link" to="/settings">
        <Settings class="w-4 h-4 mr-2" />
        Settings
      </DropdownMenuItem>

      <DropdownMenuItem @click="auth.logout">
        <LogOut class="w-4 h-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

---

## Related Documentation

- [ROUTING.md](../architecture/ROUTING.md) - Route guards
- [ADR 0005](../architecture/adr/0005-pinia-auth-only.md) - Why Pinia for auth
- [ERROR-HANDLING.md](ERROR-HANDLING.md) - Auth error handling
