import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import router from '@/router'

// Role and Permission types matching UserResource from API
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

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  is_active?: boolean
  roles?: Role[]
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
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
  async function login(credentials: LoginCredentials) {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials)

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
      const response = await api.get<{ user: User }>('/auth/me')
      // API returns { user: UserResource }
      user.value = response.data.user
    } catch {
      // Token invalid, logout
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
