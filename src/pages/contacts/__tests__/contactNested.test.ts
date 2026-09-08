import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('contact nested company journey (#98)', () => {
  it('filters persons and companies and uses a parent company picker', () => {
    const list = readFileSync(resolve(__dirname, '../ContactListPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../ContactFormPage.vue'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../ContactDetailPage.vue'), 'utf8')

    expect(list).toContain('Persons')
    expect(list).toContain('Companies')
    expect(list).toContain('kindOptions')
    expect(form).toContain('Parent Company')
    expect(form).not.toContain('Parent Company ID')
    expect(form).toContain('useCompanyContactsLookup')
    expect(form).toContain('address_role')
    expect(detail).toContain('Add Contact')
    expect(detail).toContain('contact-children-tab')
    expect(detail).toContain('parent_id=${contact.id}')
  })
})
