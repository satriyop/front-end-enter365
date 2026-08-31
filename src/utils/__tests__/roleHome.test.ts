import { describe, expect, it } from 'vitest'
import { homePathForRoles } from '../roleHome'

describe('homePathForRoles', () => {
  it('sends owner/admin to the dashboard', () => {
    expect(homePathForRoles([{ name: 'admin' }])).toBe('/')
    expect(homePathForRoles([{ name: 'admin' }, { name: 'cashier' }])).toBe('/')
  })

  it('sends kasir-only to the till', () => {
    expect(homePathForRoles([{ name: 'cashier' }])).toBe('/kasir')
  })

  it('sends accountant to journal entries', () => {
    expect(homePathForRoles([{ name: 'accountant' }])).toBe('/accounting/journal-entries')
  })

  it('sends gudang to stock', () => {
    expect(homePathForRoles([{ name: 'inventory' }])).toBe('/inventory')
  })
})
