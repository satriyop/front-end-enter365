import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  mapAccountThroughFiscalPosition,
  mapTaxIdsThroughFiscalPosition,
} from '@/utils/fiscalPositionMaps'

describe('fiscal positions (#145)', function () {
  it('exposes Fiscal Positions nav distinct from Fiscal Periods', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const list = readFileSync(resolve(__dirname, '../FiscalPositionListPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../FiscalPositionFormPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useFiscalPositions.ts'), 'utf8')
    const contactForm = readFileSync(resolve(__dirname, '../../../contacts/ContactFormPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Fiscal Positions'")
    expect(nav).toContain('/accounting/fiscal-positions')
    expect(nav).toContain('/accounting/fiscal-periods')
    expect(router).toContain("path: 'accounting/fiscal-positions'")
    expect(sidebar).toContain('sidebar-fiscal-positions')
    expect(list).toContain('New Fiscal Position')
    expect(list).toContain('not Fiscal Periods')
    expect(form).toContain('Tax Mapping')
    expect(form).toContain('Account Mapping')
    expect(form).toContain('Exempt (no tax)')
    expect(api).toContain('useCreateFiscalPosition')
    expect(api).toContain('tax_maps')
    expect(contactForm).toContain('fiscal_position_id')
  })

  it('maps taxes one hop and drops exempt dest', () => {
    const position = {
      tax_maps: [
        { source_tax_record_id: 3, dest_tax_record_id: 9 },
        { source_tax_record_id: 4, dest_tax_record_id: null },
      ],
    }

    expect(mapTaxIdsThroughFiscalPosition([3, 5, 4], position)).toEqual([9, 5])
    expect(mapTaxIdsThroughFiscalPosition([3], null)).toEqual([3])
  })

  it('maps accounts one hop', () => {
    const position = {
      account_maps: [{ source_account_id: 10, dest_account_id: 22 }],
    }

    expect(mapAccountThroughFiscalPosition(10, position)).toBe(22)
    expect(mapAccountThroughFiscalPosition(11, position)).toBe(11)
    expect(mapAccountThroughFiscalPosition(null, position)).toBeNull()
  })
})
