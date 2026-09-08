import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('bill vendor credit note (#88)', () => {
  it('reverses the bill journal instead of creating a purchase return', () => {
    const page = readFileSync(resolve(__dirname, '../BillDetailPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../api/useBills.ts'), 'utf8')

    expect(page).toContain('/accounting/journal-entries/${creditNote.id}')
    expect(page).not.toContain('/purchasing/purchase-returns/${creditNote.id}')
    expect(page).toContain('showCreditNoteModal')
    expect(api).toContain("queryKey: ['journal-entries']")
    expect(api).not.toContain("queryKey: ['purchase-returns']")
  })
})
