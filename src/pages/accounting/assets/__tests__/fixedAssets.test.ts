import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('fixed assets (#142)', () => {
  it('exposes Assets, Asset Models, and Depreciation Schedule distinct from Fiscal Periods', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const assets = readFileSync(resolve(__dirname, '../AssetListPage.vue'), 'utf8')
    const models = readFileSync(resolve(__dirname, '../../asset-models/AssetModelListPage.vue'), 'utf8')
    const schedule = readFileSync(resolve(__dirname, '../../depreciation-schedule/DepreciationSchedulePage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useFixedAssets.ts'), 'utf8')

    expect(nav).toContain("name: 'Assets'")
    expect(nav).toContain('/accounting/assets')
    expect(nav).toContain("name: 'Asset Models'")
    expect(nav).toContain('/accounting/asset-models')
    expect(nav).toContain("name: 'Depreciation Schedule'")
    expect(nav).toContain('/accounting/depreciation-schedule')
    expect(nav).toContain('/accounting/fiscal-periods')
    expect(router).toContain("path: 'accounting/assets'")
    expect(router).toContain("path: 'accounting/asset-models'")
    expect(router).toContain("path: 'accounting/depreciation-schedule'")
    expect(sidebar).toContain('sidebar-assets')
    expect(assets).toContain('New Asset')
    expect(models).toContain('New Asset Model')
    expect(schedule).toContain('Depreciation Schedule')
    expect(api).toContain('useConfirmFixedAsset')
    expect(api).toContain('usePostAssetDepreciation')
    expect(api).toContain('/depreciation-schedule')
  })
})
