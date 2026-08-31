import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import router from '@/router'
import { useFeaturesStore } from '@/stores/features'
import { hardNavigate } from '@/utils/hardNavigate'
import { homePathForRoles } from '@/utils/roleHome'

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
    const names = (user.value.permissions ?? []).map(p => typeof p === 'string' ? p : p.name)
    if (names.includes(permission)) return true
    if (user.value.roles?.some(r => r.name === 'cashier') && permission.startsWith('pos.')) {
      return true
    }
    return false
  }

  const hasRole = (role: string) => {
    return user.value?.roles?.some(r => r.name === role) ?? false
  }

  const isCashierOnly = computed(() => {
    const roles = user.value?.roles ?? []
    return roles.some(r => r.name === 'cashier') && !roles.some(r => r.name === 'admin')
  })

  // Actions
  async function login(credentials: LoginCredentials) {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials)

    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)

    const redirect = router.currentRoute.value.query.redirect
    const safeRedirect = typeof redirect === 'string'
      && redirect.startsWith('/')
      && !redirect.startsWith('//')
      ? redirect
      : null
    const targetPath = safeRedirect || homePathForRoles(user.value?.roles)

    hardNavigate(targetPath)
  }

  function clearClientSession(): void {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    useFeaturesStore().reset()
  }

  async function logout() {
    clearClientSession()
    try {
      await api.post('/auth/logout')
    } catch {
      // Local session is already gone; a 404/401 must not leave the SPA signed in.
    }
    hardNavigate('/login')
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await api.get<{ data: User }>('/auth/me')
      // API returns { data: UserResource } (Laravel API Resource wrapping)
      user.value = response.data.data
      await useFeaturesStore().fetchFeatures()
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
    isCashierOnly,
    login,
    logout,
    clearClientSession,
    fetchUser,
  }
})
