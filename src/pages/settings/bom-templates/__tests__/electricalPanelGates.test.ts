import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Structural gates: when electrical_panel is off, BOM template settings must not
 * call industry APIs or expose Component Standard UI.
 *
 * Reads shipped Vue SFCs (not mocks) so a missing gate fails the suite.
 */
const root = resolve(import.meta.dirname, '..')

function read(name: string): string {
  return readFileSync(resolve(root, name), 'utf8')
}

describe('BOM template pages gate electrical_panel industry UI', () => {
  it('BomTemplateDetailPage gates standards fetch and form field', () => {
    const src = read('BomTemplateDetailPage.vue')

    expect(src).toContain("features.enabled('electrical_panel')")
    expect(src).toMatch(/useComponentStandards\(\s*standardFilters\s*,\s*electricalPanelEnabled\s*\)/)
    expect(src).toMatch(/useTemplateAvailableBrands\(\s*templateId\s*,\s*electricalPanelEnabled\s*\)/)
    expect(src).toContain('v-if="electricalPanelEnabled"')
    expect(src).toContain('label="Component Standard"')
    // Component Standard FormField must be conditional (same block as electricalPanelEnabled)
    const standardFieldIdx = src.indexOf('label="Component Standard"')
    const before = src.slice(Math.max(0, standardFieldIdx - 200), standardFieldIdx)
    expect(before).toContain('electricalPanelEnabled')
  })

  it('BomTemplateFormPage gates rule-set fetch and form card', () => {
    const src = read('BomTemplateFormPage.vue')

    expect(src).toContain("features.enabled('electrical_panel')")
    expect(src).toMatch(/useActiveRuleSets\(\s*electricalPanelEnabled\s*\)/)
    expect(src).toContain('v-if="electricalPanelEnabled"')
    expect(src).toContain('Validation Rule Set')
  })
})
