import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Structural gates: when electrical_panel is off, BOM template settings must not
 * call industry APIs or expose Component Standard UI.
 *
 * Reads shipped Vue SFCs (not mocks) so a missing gate fails the suite.
 * Industry UI lives under addons/electrical-panel/components and is mounted with v-if.
 */
const root = resolve(import.meta.dirname, '..')
const addonComponents = resolve(import.meta.dirname, '../../../addons/electrical-panel/components')

function read(name: string): string {
  return readFileSync(resolve(root, name), 'utf8')
}

function readAddon(name: string): string {
  return readFileSync(resolve(addonComponents, name), 'utf8')
}

describe('BOM template pages gate electrical_panel industry UI', () => {
  it('BomTemplateDetailPage gates standards fetch and mounts addon fields', () => {
    const src = read('BomTemplateDetailPage.vue')

    expect(src).toContain("features.enabled('electrical_panel')")
    expect(src).toMatch(/useComponentStandards\(\s*standardFilters\s*,\s*electricalPanelEnabled\s*\)/)
    expect(src).toMatch(/useTemplateAvailableBrands\(\s*templateId\s*,\s*electricalPanelEnabled\s*\)/)
    expect(src).toContain('v-if="electricalPanelEnabled"')
    expect(src).toContain('BomTemplateItemStandardField')
    expect(src).toContain('BomTemplatePanelMetaCards')

    // Addon field itself still labels Component Standard
    const fieldSrc = readAddon('BomTemplateItemStandardField.vue')
    expect(fieldSrc).toContain('label="Component Standard"')

    // Component mount must be conditional on electricalPanelEnabled
    const standardFieldIdx = src.indexOf('BomTemplateItemStandardField')
    const mountIdx = src.indexOf('<BomTemplateItemStandardField', standardFieldIdx)
    const before = src.slice(Math.max(0, mountIdx - 200), mountIdx + 120)
    expect(before).toContain('electricalPanelEnabled')
  })

  it('BomTemplateFormPage gates rule-set fetch and mounts addon field', () => {
    const src = read('BomTemplateFormPage.vue')

    expect(src).toContain("features.enabled('electrical_panel')")
    expect(src).toMatch(/useActiveRuleSets\(\s*electricalPanelEnabled\s*\)/)
    expect(src).toContain('v-if="electricalPanelEnabled"')
    expect(src).toContain('BomTemplateRuleSetField')

    const fieldSrc = readAddon('BomTemplateRuleSetField.vue')
    expect(fieldSrc).toContain('Validation Rule Set')
  })
})
