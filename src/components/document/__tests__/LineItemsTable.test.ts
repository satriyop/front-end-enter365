/**
 * LineItemsTable Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LineItemsTable from '../LineItemsTable.vue'
import { createLineItem, createLineItems, resetLineItemFactory } from '@/test/factories'
import type { BaseLineItem } from '@/services/line-items'
import type { LineItemCalculation } from '@/services/calculation'

// Create mock calculations matching the items
function createCalculations(items: BaseLineItem[]): LineItemCalculation[] {
  return items.map((item) => {
    const gross = item.quantity * item.unit_price
    const discount = 0
    const net = gross - discount
    const tax = Math.round(net * 0.11)
    return {
      gross,
      discount,
      net,
      tax,
      total: net + tax,
    }
  })
}

describe('LineItemsTable', () => {
  beforeEach(() => {
    resetLineItemFactory()
  })

  describe('rendering', () => {
    it('renders table with items', () => {
      const items = createLineItems(3)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
        },
      })

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)
    })

    it('shows empty state when no items', () => {
      const wrapper = mount(LineItemsTable, {
        props: {
          items: [],
          calculations: [],
        },
      })

      expect(wrapper.text()).toContain('No items added yet')
    })

    it('shows column headers', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
        },
      })

      expect(wrapper.text()).toContain('Description')
      expect(wrapper.text()).toContain('Qty')
      expect(wrapper.text()).toContain('Unit Price')
      expect(wrapper.text()).toContain('Subtotal')
    })
  })

  describe('add item', () => {
    it('shows add button when canAdd is true', () => {
      const wrapper = mount(LineItemsTable, {
        props: {
          items: [],
          canAdd: true,
        },
      })

      expect(wrapper.text()).toContain('Add Item')
    })

    it('hides add button when canAdd is false', () => {
      const wrapper = mount(LineItemsTable, {
        props: {
          items: [],
          canAdd: false,
        },
      })

      // Check that no button exists when canAdd is false
      // The only button that could exist would be the Add Item button
      const buttons = wrapper.findAll('button')
      const addButton = buttons.find((btn) => btn.text().includes('Add'))
      expect(addButton).toBeUndefined()
    })

    it('emits add event when add button clicked', async () => {
      const wrapper = mount(LineItemsTable, {
        props: {
          items: [],
          canAdd: true,
        },
      })

      const addButton = wrapper.find('button')
      await addButton.trigger('click')

      expect(wrapper.emitted('add')).toHaveLength(1)
    })
  })

  describe('remove item', () => {
    it('shows remove button when canRemove is true and items > minItems', () => {
      const items = createLineItems(2)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canRemove: true,
          minItems: 1,
        },
      })

      const removeButtons = wrapper.findAll('button[title="Remove item"]')
      expect(removeButtons.length).toBeGreaterThan(0)
    })

    it('disables remove button when items equals minItems', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canRemove: true,
          minItems: 1,
        },
      })

      const removeButton = wrapper.find('button[title="Remove item"]')
      expect(removeButton.attributes('disabled')).toBeDefined()
    })

    it('emits remove event with index when remove clicked', async () => {
      const items = createLineItems(2)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canRemove: true,
          minItems: 1,
        },
      })

      const removeButtons = wrapper.findAll('button[title="Remove item"]')
      expect(removeButtons.length).toBeGreaterThan(0)
      await removeButtons[0]!.trigger('click')

      const removeEvents = wrapper.emitted('remove')
      expect(removeEvents).toBeTruthy()
      expect(removeEvents?.[0]).toEqual([0])
    })
  })

  describe('update item', () => {
    it('emits update event on description input', async () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
        },
      })

      const inputs = wrapper.findAll('input')
      const descriptionInput = inputs.find(
        (i) => i.attributes('placeholder') === 'Description'
      )

      await descriptionInput?.trigger('input')

      expect(wrapper.emitted('update')).toBeTruthy()
    })

    it('emits update event on quantity change', async () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
        },
      })

      const numberInputs = wrapper.findAll('input[type="number"]')
      expect(numberInputs.length).toBeGreaterThan(0)
      await numberInputs[0]!.trigger('input')

      expect(wrapper.emitted('update')).toBeTruthy()
    })
  })

  describe('discount column', () => {
    it('shows discount column when showDiscount is true', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          showDiscount: true,
        },
      })

      expect(wrapper.text()).toContain('Discount')
    })

    it('hides discount column when showDiscount is false', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          showDiscount: false,
        },
      })

      expect(wrapper.text()).not.toContain('Discount')
    })
  })

  describe('product select column', () => {
    it('shows product select when showProductSelect is true', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          showProductSelect: true,
        },
      })

      expect(wrapper.text()).toContain('Product')
    })

    it('hides product select when showProductSelect is false', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          showProductSelect: false,
        },
      })

      // Check that the header doesn't show "Product"
      const headers = wrapper.findAll('th')
      const hasProductHeader = headers.some((h) => h.text() === 'Product')
      expect(hasProductHeader).toBe(false)
    })
  })

  describe('disabled state', () => {
    it('disables all inputs when disabled is true', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          disabled: true,
        },
      })

      const inputs = wrapper.findAll('input')
      inputs.forEach((input) => {
        expect(input.attributes('disabled')).toBeDefined()
      })
    })

    it('disables add button when disabled', () => {
      const wrapper = mount(LineItemsTable, {
        props: {
          items: [],
          canAdd: true,
          disabled: true,
        },
      })

      const addButton = wrapper.find('button')
      expect(addButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('calculations display', () => {
    it('displays calculated subtotals', () => {
      const items = [createLineItem({ quantity: 2, unit_price: 50000 })]
      const calculations = [
        {
          gross: 100000,
          discount: 0,
          net: 100000,
          tax: 11000,
          total: 111000,
        },
      ]
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations,
        },
      })

      // Should display formatted currency
      expect(wrapper.text()).toContain('Rp')
    })
  })

  describe('error display', () => {
    it('highlights row with error', () => {
      const items = createLineItems(1)
      const errors = new Map<number, string[]>()
      errors.set(0, ['Quantity must be greater than 0'])

      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          errors,
        },
      })

      const row = wrapper.find('tbody tr')
      expect(row.classes()).toContain('bg-destructive/5')
    })
  })

  describe('duplicate item', () => {
    it('shows duplicate button when canDuplicate is true', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canDuplicate: true,
        },
      })

      expect(wrapper.find('button[title="Duplicate item"]').exists()).toBe(true)
    })

    it('hides duplicate button when canDuplicate is false', () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canDuplicate: false,
        },
      })

      expect(wrapper.find('button[title="Duplicate item"]').exists()).toBe(false)
    })

    it('emits duplicate event with index when duplicate clicked', async () => {
      const items = createLineItems(1)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canDuplicate: true,
        },
      })

      const duplicateButton = wrapper.find('button[title="Duplicate item"]')
      await duplicateButton.trigger('click')

      const duplicateEvents = wrapper.emitted('duplicate')
      expect(duplicateEvents).toBeTruthy()
      expect(duplicateEvents?.[0]).toEqual([0])
    })
  })

  describe('reorder', () => {
    it('shows drag handle when canReorder is true', () => {
      const items = createLineItems(2)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canReorder: true,
        },
      })

      // Check for grip icon/handle
      expect(wrapper.find('button.cursor-grab').exists()).toBe(true)
    })

    it('hides drag handle when canReorder is false', () => {
      const items = createLineItems(2)
      const wrapper = mount(LineItemsTable, {
        props: {
          items,
          calculations: createCalculations(items),
          canReorder: false,
        },
      })

      expect(wrapper.find('button.cursor-grab').exists()).toBe(false)
    })
  })
})
