import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('@/router', () => ({
  default: {
    replace: vi.fn(),
    push: vi.fn(),
    currentRoute: { value: { query: {} } },
  },
}))

import { api } from '@/api/client'
import router from '@/router'
import { useAuthStore } from '../auth'

describe('auth logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.mocked(api.post).mockReset()
    vi.mocked(router.replace).mockReset()
  })

  it('clears the token even when /auth/logout returns 404', async () => {
    const store = useAuthStore()
    store.token = 'keep-me'
    store.user = { id: 1, name: 'Rina', email: 'rina@kopitiam57.test' }
    localStorage.setItem('token', 'keep-me')

    const error = new AxiosError('Not Found')
    error.response = {
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
      data: { message: 'Endpoint tidak ditemukan.' },
    }
    vi.mocked(api.post).mockRejectedValue(error)

    await store.logout()

    expect(localStorage.getItem('token')).toBeNull()
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(router.replace).toHaveBeenCalledWith('/login')
  })
})
