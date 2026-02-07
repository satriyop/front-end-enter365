/**
 * Select Component Tests
 *
 * Tests the Radix-based Select with empty-value placeholder workaround
 * and type preservation (string ↔ number).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from '../Select.vue'

const basicOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]

const numericOptions = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
]

const mixedOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(Select, {
    props: { options: basicOptions, ...props },
    // Stub SelectPortal to render in-place (avoids Teleport issues in tests)
    global: {
      stubs: {
        SelectPortal: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('Select', () => {
  describe('rendering', () => {
    it('renders trigger with placeholder when no value', () => {
      const wrapper = mountSelect({ modelValue: null })

      expect(wrapper.text()).toContain('Select an option')
    })

    it('renders custom placeholder', () => {
      const wrapper = mountSelect({
        modelValue: null,
        placeholder: 'Choose one',
      })

      expect(wrapper.text()).toContain('Choose one')
    })

    it('renders trigger element', () => {
      const wrapper = mountSelect()

      // Radix renders options only when dropdown is opened (portalled)
      // We verify the trigger button exists with combobox role
      expect(wrapper.find('[role="combobox"]').exists()).toBe(true)
    })

    it('renders chevron icon', () => {
      const wrapper = mountSelect()

      // ChevronDown is rendered in the trigger
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('selected label display', () => {
    it('shows selected option label', () => {
      const wrapper = mountSelect({ modelValue: 'b' })

      expect(wrapper.text()).toContain('Option B')
    })

    it('shows stringified value if option not found', () => {
      const wrapper = mountSelect({ modelValue: 'unknown' })

      expect(wrapper.text()).toContain('unknown')
    })

    it('shows nothing for null value', () => {
      const wrapper = mountSelect({ modelValue: null })

      // Should show placeholder, not a selected label
      expect(wrapper.text()).not.toContain('Option A')
      expect(wrapper.text()).not.toContain('Option B')
    })
  })

  describe('empty string value (Radix workaround)', () => {
    it('handles options with empty string value', () => {
      const wrapper = mountSelect({ options: mixedOptions, modelValue: '' })

      expect(wrapper.text()).toContain('All Status')
    })

    it('maps empty string to __empty__ internally', () => {
      const wrapper = mountSelect({ options: mixedOptions, modelValue: '' })

      // The internal SelectRoot should receive __empty__ not ''
      // We verify by checking the option is rendered with the placeholder value
      expect(wrapper.html()).toContain('__empty__')
    })
  })

  describe('type preservation', () => {
    it('preserves number type from options', () => {
      const wrapper = mountSelect({
        options: numericOptions,
        modelValue: 2,
      })

      expect(wrapper.text()).toContain('Second')
    })

    it('finds option by stringified comparison', () => {
      // When modelValue is number, it should still match string-converted options
      const wrapper = mountSelect({
        options: numericOptions,
        modelValue: 1,
      })

      expect(wrapper.text()).toContain('First')
    })
  })

  describe('disabled state', () => {
    it('passes disabled to SelectRoot', () => {
      const wrapper = mountSelect({ disabled: true })

      // Radix adds data-disabled attribute
      expect(wrapper.html()).toContain('disabled')
    })

    it('passes disabled to trigger as disabled attribute', () => {
      const wrapper = mountSelect({ disabled: true })

      const trigger = wrapper.find('[role="combobox"]')
      expect(trigger.attributes('disabled')).toBeDefined()
    })
  })

  describe('error state', () => {
    it('applies destructive border for boolean error', () => {
      const wrapper = mountSelect({ error: true })

      expect(wrapper.html()).toContain('border-destructive')
    })

    it('applies destructive border for string error', () => {
      const wrapper = mountSelect({ error: 'Required field' })

      expect(wrapper.html()).toContain('border-destructive')
    })

    it('applies default border when no error', () => {
      const wrapper = mountSelect({ error: false })

      expect(wrapper.html()).toContain('border-slate-200')
    })
  })

  describe('sizes', () => {
    const sizes = ['sm', 'default', 'lg'] as const

    it.each(sizes)('renders %s size without errors', (size) => {
      const wrapper = mountSelect({ size })

      expect(wrapper.find('[data-radix-vue-collection-item]').exists() || wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('custom classes', () => {
    it('applies additional trigger classes', () => {
      const wrapper = mountSelect({ class: 'my-custom-class' })

      expect(wrapper.html()).toContain('my-custom-class')
    })
  })
})
