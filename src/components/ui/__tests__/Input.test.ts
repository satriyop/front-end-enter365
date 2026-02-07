/**
 * Input Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent } from 'vue'
import Input from '../Input.vue'

const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="mock-icon"></svg>',
  })
)

function mountInput(props: Record<string, unknown> = {}) {
  return mount(Input, { props })
}

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input element', () => {
      const wrapper = mountInput()

      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('renders with default type="text"', () => {
      const wrapper = mountInput()

      expect(wrapper.find('input').attributes('type')).toBe('text')
    })

    it('renders with custom type', () => {
      const wrapper = mountInput({ type: 'email' })

      expect(wrapper.find('input').attributes('type')).toBe('email')
    })

    it('renders with value from modelValue', () => {
      const wrapper = mountInput({ modelValue: 'hello' })

      expect(wrapper.find('input').element.value).toBe('hello')
    })
  })

  describe('v-model', () => {
    it('emits update:modelValue on input', async () => {
      const wrapper = mountInput()
      const input = wrapper.find('input')

      await input.setValue('test')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![emitted!.length - 1][0]).toBe('test')
    })
  })

  describe('sizes', () => {
    const sizes = ['sm', 'default', 'lg'] as const

    it.each(sizes)('renders %s size without errors', (size) => {
      const wrapper = mountInput({ size })

      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('applies sm size classes', () => {
      const wrapper = mountInput({ size: 'sm' })

      expect(wrapper.find('input').html()).toContain('h-8')
    })

    it('applies lg size classes', () => {
      const wrapper = mountInput({ size: 'lg' })

      expect(wrapper.find('input').html()).toContain('h-11')
    })
  })

  describe('error state', () => {
    it('applies destructive border for boolean error', () => {
      const wrapper = mountInput({ error: true })

      expect(wrapper.find('input').html()).toContain('border-destructive')
    })

    it('applies destructive border for string error', () => {
      const wrapper = mountInput({ error: 'Field required' })

      expect(wrapper.find('input').html()).toContain('border-destructive')
    })

    it('applies default border when no error', () => {
      const wrapper = mountInput({ error: false })

      expect(wrapper.find('input').html()).toContain('border-input')
    })
  })

  describe('disabled state', () => {
    it('sets disabled attribute', () => {
      const wrapper = mountInput({ disabled: true })

      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })
  })

  describe('leading addon', () => {
    it('renders leading addon text', () => {
      const wrapper = mountInput({ leadingAddon: 'https://' })

      expect(wrapper.text()).toContain('https://')
    })

    it('removes left border rounding on input', () => {
      const wrapper = mountInput({ leadingAddon: 'Rp' })

      expect(wrapper.find('input').html()).toContain('rounded-l-none')
    })

    it('applies error border to addon', () => {
      const wrapper = mountInput({ leadingAddon: 'Rp', error: true })

      const addon = wrapper.findAll('span').find((s) => s.text() === 'Rp')
      expect(addon?.html()).toContain('border-destructive')
    })
  })

  describe('trailing addon', () => {
    it('renders trailing addon text', () => {
      const wrapper = mountInput({ trailingAddon: 'kg' })

      expect(wrapper.text()).toContain('kg')
    })

    it('removes right border rounding on input', () => {
      const wrapper = mountInput({ trailingAddon: 'kg' })

      expect(wrapper.find('input').html()).toContain('rounded-r-none')
    })
  })

  describe('leading icon', () => {
    it('renders leading icon component', () => {
      const wrapper = mountInput({ leadingIcon: MockIcon })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true)
    })

    it('adds left padding for icon', () => {
      const wrapper = mountInput({ leadingIcon: MockIcon })

      expect(wrapper.find('input').html()).toContain('pl-9')
    })

    it('hides icon when leadingAddon is also set', () => {
      const wrapper = mountInput({ leadingIcon: MockIcon, leadingAddon: 'Rp' })

      // leadingAddon takes priority: v-if="leadingIcon && !leadingAddon"
      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(false)
    })
  })

  describe('trailing icon', () => {
    it('renders trailing icon component', () => {
      const wrapper = mountInput({ trailingIcon: MockIcon })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true)
    })

    it('adds right padding for icon', () => {
      const wrapper = mountInput({ trailingIcon: MockIcon })

      expect(wrapper.find('input').html()).toContain('pr-9')
    })

    it('hides icon when trailingAddon is also set', () => {
      const wrapper = mountInput({ trailingIcon: MockIcon, trailingAddon: 'kg' })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(false)
    })
  })

  describe('custom classes', () => {
    it('applies additional classes to input', () => {
      const wrapper = mountInput({ class: 'my-custom' })

      expect(wrapper.find('input').html()).toContain('my-custom')
    })
  })

  describe('number input', () => {
    it('hides browser spinners', () => {
      const wrapper = mountInput({ type: 'number' })

      expect(wrapper.find('input').html()).toContain('appearance:textfield')
    })
  })
})
