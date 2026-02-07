/**
 * TotalsSummary Component Tests
 *
 * Tests currency formatting, conditional discount/tax sections, and slot rendering.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TotalsSummary from '../TotalsSummary.vue'
import type { DocumentTotals } from '@/services/calculation'

function createTotals(overrides: Partial<DocumentTotals> = {}): DocumentTotals {
  return {
    subtotal: 1000000,
    totalDiscount: 0,
    taxableAmount: 1000000,
    tax: 110000,
    grandTotal: 1110000,
    ...overrides,
  }
}

function mountTotals(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(TotalsSummary, {
    props: {
      totals: createTotals(),
      ...props,
    },
    slots,
  })
}

describe('TotalsSummary', () => {
  describe('subtotal', () => {
    it('displays formatted subtotal', () => {
      const wrapper = mountTotals({
        totals: createTotals({ subtotal: 1250000 }),
      })

      expect(wrapper.text()).toContain('Subtotal')
      // formatCurrency(1250000) → "Rp 1.250.000" (Indonesian format)
      expect(wrapper.text()).toContain('Rp')
      expect(wrapper.text()).toContain('1.250.000')
    })

    it('displays zero subtotal', () => {
      const wrapper = mountTotals({
        totals: createTotals({ subtotal: 0 }),
      })

      expect(wrapper.text()).toContain('Rp')
    })
  })

  describe('discount section', () => {
    it('shows discount when showDiscount is true and discount > 0', () => {
      const wrapper = mountTotals({
        totals: createTotals({ totalDiscount: 50000 }),
        showDiscount: true,
      })

      expect(wrapper.text()).toContain('Discount')
      expect(wrapper.text()).toContain('50.000')
    })

    it('shows discount with negative sign', () => {
      const wrapper = mountTotals({
        totals: createTotals({ totalDiscount: 100000 }),
      })

      // Template uses "-{{ formatCurrency(totals.totalDiscount) }}"
      expect(wrapper.text()).toContain('-')
    })

    it('hides discount when totalDiscount is 0', () => {
      const wrapper = mountTotals({
        totals: createTotals({ totalDiscount: 0 }),
      })

      expect(wrapper.text()).not.toContain('Discount')
    })

    it('hides discount when showDiscount is false', () => {
      const wrapper = mountTotals({
        totals: createTotals({ totalDiscount: 50000 }),
        showDiscount: false,
      })

      expect(wrapper.text()).not.toContain('Discount')
    })

    it('applies destructive text color to discount', () => {
      const wrapper = mountTotals({
        totals: createTotals({ totalDiscount: 50000 }),
      })

      // The discount div has class="text-destructive"
      const discountDiv = wrapper.findAll('div').find((d) => d.text().includes('Discount'))
      expect(discountDiv?.html()).toContain('text-destructive')
    })
  })

  describe('tax section', () => {
    it('shows tax with rate when showTax is true', () => {
      const wrapper = mountTotals({
        totals: createTotals({ tax: 110000 }),
        showTax: true,
        showTaxRate: true,
        taxRate: 11,
      })

      expect(wrapper.text()).toContain('Tax')
      expect(wrapper.text()).toContain('(11%)')
      expect(wrapper.text()).toContain('110.000')
    })

    it('hides tax rate when showTaxRate is false', () => {
      const wrapper = mountTotals({
        showTax: true,
        showTaxRate: false,
      })

      expect(wrapper.text()).toContain('Tax')
      expect(wrapper.text()).not.toContain('%')
    })

    it('hides tax section when showTax is false', () => {
      const wrapper = mountTotals({
        showTax: false,
      })

      expect(wrapper.text()).not.toContain('Tax')
    })

    it('uses custom tax label', () => {
      const wrapper = mountTotals({
        taxLabel: 'PPN',
      })

      expect(wrapper.text()).toContain('PPN')
    })

    it('uses custom tax rate', () => {
      const wrapper = mountTotals({
        taxRate: 12,
      })

      expect(wrapper.text()).toContain('(12%)')
    })
  })

  describe('grand total', () => {
    it('displays formatted grand total', () => {
      const wrapper = mountTotals({
        totals: createTotals({ grandTotal: 1110000 }),
      })

      expect(wrapper.text()).toContain('Grand Total')
      expect(wrapper.text()).toContain('1.110.000')
    })

    it('applies primary text color to grand total value', () => {
      const wrapper = mountTotals()

      const grandTotalValue = wrapper.findAll('span').find((s) =>
        s.classes().includes('text-primary')
      )
      expect(grandTotalValue).toBeTruthy()
    })

    it('applies font-semibold and larger text to grand total row', () => {
      const wrapper = mountTotals()

      const grandTotalDiv = wrapper.findAll('div').find((d) => d.text().includes('Grand Total'))
      expect(grandTotalDiv?.html()).toContain('font-semibold')
      expect(grandTotalDiv?.html()).toContain('text-base')
    })

    it('has border-top separator above grand total', () => {
      const wrapper = mountTotals()

      const grandTotalDiv = wrapper.findAll('div').find((d) => d.text().includes('Grand Total'))
      expect(grandTotalDiv?.html()).toContain('border-t')
    })
  })

  describe('slot', () => {
    it('renders additional content via default slot', () => {
      const wrapper = mountTotals({}, {
        default: '<div data-testid="extra">Paid: Rp 500.000</div>',
      })

      expect(wrapper.text()).toContain('Paid: Rp 500.000')
    })
  })

  describe('complete document totals', () => {
    it('renders all sections for a typical invoice', () => {
      const wrapper = mountTotals({
        totals: createTotals({
          subtotal: 5000000,
          totalDiscount: 500000,
          taxableAmount: 4500000,
          tax: 495000,
          grandTotal: 4995000,
        }),
        taxRate: 11,
      })

      expect(wrapper.text()).toContain('Subtotal')
      expect(wrapper.text()).toContain('Discount')
      expect(wrapper.text()).toContain('Tax')
      expect(wrapper.text()).toContain('Grand Total')
    })
  })
})
