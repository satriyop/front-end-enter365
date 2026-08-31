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

vi.mock('@/utils/hardNavigate', () => ({
  hardNavigate: vi.fn(),
  restoreDocumentPointerEvents: vi.fn(),
}))

import { api } from '@/api/client'
import { hardNavigate } from '@/utils/hardNavigate'
import { useAuthStore } from '../auth'

describe('auth logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.mocked(api.post).mockReset()
    vi.mocked(hardNavigate).mockReset()
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
    expect(hardNavigate).toHaveBeenCalledWith('/login')
  })

  it('hard-navigates cashiers to /kasir after login so leftover dialog locks cannot survive', async () => {
    const store = useAuthStore()
    vi.mocked(api.post).mockResolvedValue({
      data: {
        token: 'new-token',
        user: {
          id: 2,
          name: 'Siti',
          email: 'siti@kopitiam57.test',
          roles: [{ id: 1, name: 'cashier', display_name: 'Kasir' }],
        },
      },
    } as never)
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { modules: { pos: true }, enabled: ['pos'], disabled: [] } },
    } as never)

    await store.login({ email: 'siti@kopitiam57.test', password: 'password' })

    expect(localStorage.getItem('token')).toBe('new-token')
    expect(hardNavigate).toHaveBeenCalledWith('/kasir')
  })

  it('hard-navigates accountants to / immediately after the token is stored', async () => {
    const store = useAuthStore()
    vi.mocked(api.post).mockResolvedValue({
      data: {
        token: 'rina-token',
        user: {
          id: 3,
          name: 'Rina',
          email: 'rina@kopitiam57.test',
          roles: [{ id: 2, name: 'accountant', display_name: 'Akuntan' }],
        },
      },
    } as never)

    await store.login({ email: 'rina@kopitiam57.test', password: 'password' })

    expect(localStorage.getItem('token')).toBe('rina-token')
    expect(hardNavigate).toHaveBeenCalledWith('/')
    expect(api.get).not.toHaveBeenCalled()
  })
})
