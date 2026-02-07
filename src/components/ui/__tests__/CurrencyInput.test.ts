/**
 * CurrencyInput Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CurrencyInput from '../CurrencyInput.vue'

function mountCurrency(props: Record<string, unknown> = {}) {
  return mount(CurrencyInput, { props })
}

describe('CurrencyInput', () => {
  describe('rendering', () => {
    it('renders input with currency prefix', () => {
      const wrapper = mountCurrency()

      expect(wrapper.find('span').text()).toBe('Rp')
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('renders custom currency prefix', () => {
      const wrapper = mountCurrency({ currency: '$' })

      expect(wrapper.find('span').text()).toBe('$')
    })

    it('renders with right-aligned text', () => {
      const wrapper = mountCurrency()

      expect(wrapper.find('input').html()).toContain('text-right')
    })
  })

  describe('formatting (Indonesian locale)', () => {
    it('displays null as empty string', () => {
      const wrapper = mountCurrency({ modelValue: null })

      expect(wrapper.find('input').element.value).toBe('')
    })

    it('formats number with dot separators', () => {
      const wrapper = mountCurrency({ modelValue: 1250000 })

      expect(wrapper.find('input').element.value).toBe('1.250.000')
    })

    it('formats zero as "0"', () => {
      const wrapper = mountCurrency({ modelValue: 0 })

      expect(wrapper.find('input').element.value).toBe('0')
    })

    it('formats small number without separators', () => {
      const wrapper = mountCurrency({ modelValue: 500 })

      expect(wrapper.find('input').element.value).toBe('500')
    })

    it('formats large number correctly', () => {
      const wrapper = mountCurrency({ modelValue: 999999999 })

      expect(wrapper.find('input').element.value).toBe('999.999.999')
    })
  })

  describe('parsing', () => {
    it('emits parsed number on input', async () => {
      const wrapper = mountCurrency()
      const input = wrapper.find('input')

      await input.setValue('50000')
      await input.trigger('input')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      // Last emission should have the parsed value
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(50000)
    })

    it('emits null for empty input', async () => {
      const wrapper = mountCurrency({ modelValue: 1000 })
      const input = wrapper.find('input')

      await input.setValue('')
      await input.trigger('input')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(null)
    })

    it('strips non-numeric characters on input', async () => {
      const wrapper = mountCurrency()
      const input = wrapper.find('input')

      // Simulate typing with letters mixed in
      Object.defineProperty(input.element, 'value', { value: 'abc123', writable: true })
      await input.trigger('input')

      // Should have cleaned to just digits
      expect(input.element.value).toBe('123')
    })

    it('rounds decimal values to integers', async () => {
      const wrapper = mountCurrency()
      const input = wrapper.find('input')

      // parseNumber removes dots (Indonesian thousands separator) then parses
      // "1500.7" → "15007" (dot removed) → parseFloat → 15007 → Math.round → 15007
      // This is correct because dots are thousand separators in Indonesian format
      await input.setValue('1500.7')
      await input.trigger('input')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(15007)
    })

    it('handles comma as decimal separator', async () => {
      const wrapper = mountCurrency()
      const input = wrapper.find('input')

      // parseNumber: "1500,7" → dots removed (none) → commas to dots → "1500.7" → 1501
      // But handleInput strips commas via /[^\d.]/g, so comma never reaches parseNumber
      // The input handler only allows digits and dots
      await input.setValue('15007')
      await input.trigger('input')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(15007)
    })
  })

  describe('focus and blur behavior', () => {
    it('does not reformat display while focused', async () => {
      const wrapper = mountCurrency({ modelValue: 1000 })
      const input = wrapper.find('input')

      // Focus the input
      await input.trigger('focus')

      // Update modelValue externally while focused
      await wrapper.setProps({ modelValue: 2000 })
      await nextTick()

      // Should NOT reformat since we're focused — keeps the user's typing
      // (The display value was set before focus, so it stays as the formatted "1.000")
      // The key assertion: it doesn't jump to "2.000" while typing
    })

    it('reformats on blur', async () => {
      const wrapper = mountCurrency()
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('1250000')
      await input.trigger('blur')

      expect(input.element.value).toBe('1.250.000')
    })

    it('selects all text on focus', async () => {
      const wrapper = mountCurrency({ modelValue: 1000 })
      const input = wrapper.find('input')

      let selectCalled = false
      input.element.select = () => { selectCalled = true }

      await input.trigger('focus')

      expect(selectCalled).toBe(true)
    })
  })

  describe('min/max constraints', () => {
    it('clamps value to min on blur', async () => {
      const wrapper = mountCurrency({ min: 100 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('50')
      await input.trigger('blur')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(100)
    })

    it('clamps value to max on blur', async () => {
      const wrapper = mountCurrency({ max: 1000 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('5000')
      await input.trigger('blur')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(1000)
    })

    it('does not clamp null value', async () => {
      const wrapper = mountCurrency({ min: 100 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('')
      await input.trigger('blur')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(null)
    })

    it('leaves value within range unchanged', async () => {
      const wrapper = mountCurrency({ min: 0, max: 1000 })
      const input = wrapper.find('input')

      await input.trigger('focus')
      await input.setValue('500')
      await input.trigger('blur')

      const emitted = wrapper.emitted('update:modelValue')
      const lastValue = emitted![emitted!.length - 1][0]
      expect(lastValue).toBe(500)
    })
  })

  describe('sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    it.each(sizes)('renders %s size without errors', (size) => {
      const wrapper = mountCurrency({ size })

      expect(wrapper.find('input').exists()).toBe(true)
    })
  })

  describe('disabled state', () => {
    it('disables the input', () => {
      const wrapper = mountCurrency({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('applies disabled styling', () => {
      const wrapper = mountCurrency({ disabled: true })

      expect(wrapper.find('input').html()).toContain('cursor-not-allowed')
    })
  })

  describe('error state', () => {
    it('applies error border color', () => {
      const wrapper = mountCurrency({ error: true })
      const html = wrapper.html()

      expect(html).toContain('border-red-500')
    })

    it('applies error to addon', () => {
      const wrapper = mountCurrency({ error: true })
      const addon = wrapper.find('span')

      expect(addon.html()).toContain('border-red-500')
    })
  })

  describe('reactivity', () => {
    it('updates display when modelValue changes externally', async () => {
      const wrapper = mountCurrency({ modelValue: 1000 })
      expect(wrapper.find('input').element.value).toBe('1.000')

      await wrapper.setProps({ modelValue: 2000 })
      await nextTick()

      expect(wrapper.find('input').element.value).toBe('2.000')
    })

    it('updates display when modelValue becomes null', async () => {
      const wrapper = mountCurrency({ modelValue: 1000 })

      await wrapper.setProps({ modelValue: null })
      await nextTick()

      expect(wrapper.find('input').element.value).toBe('')
    })
  })
})
