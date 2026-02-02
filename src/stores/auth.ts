import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
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
    console.log('[Auth] Starting login...')
    
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials)
    console.log('[Auth] Login API response received')

    // Set token and user immediately
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)
    console.log('[Auth] Token and user set, isAuthenticated:', isAuthenticated.value)

    // Get redirect target before navigation
    const redirect = router.currentRoute.value.query.redirect as string
    const targetPath = redirect || '/'
    console.log('[Auth] Redirect target:', targetPath)

    // Wait for Vue reactivity to fully propagate
    // This ensures the navigation guard sees the updated auth state
    await nextTick()
    console.log('[Auth] After nextTick, isAuthenticated:', isAuthenticated.value)
    
    // Additional delay to ensure Pinia store reactivity is fully propagated
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('[Auth] After delay, isAuthenticated:', isAuthenticated.value)

    // Use hard redirect to ensure it works regardless of router guard timing
    // The router guard now checks localStorage directly, so this should work
    console.log('[Auth] Using router.replace to:', targetPath)
    try {
      await router.replace(targetPath)
      console.log('[Auth] Router navigation successful')
    } catch (error) {
      console.warn('[Auth] Router navigation failed, using window.location:', error)
      // Fallback to hard redirect
      window.location.href = targetPath
    }
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
      const response = await api.get<{ data: User }>('/auth/me')
      // API returns { data: UserResource } (Laravel API Resource wrapping)
      user.value = response.data.data
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
