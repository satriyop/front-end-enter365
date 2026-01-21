/**
 * Button Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent } from 'vue'
import Button from '../Button.vue'

// Mock icon component for testing (marked raw to prevent reactivity warnings)
const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="mock-icon"></svg>',
  })
)

describe('Button', () => {
  describe('rendering', () => {
    it('renders default button with slot content', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Click me' },
      })

      expect(wrapper.text()).toBe('Click me')
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('renders with default type="button"', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('renders submit button', () => {
      const wrapper = mount(Button, {
        props: { type: 'submit' },
        slots: { default: 'Submit' },
      })

      expect(wrapper.find('button').attributes('type')).toBe('submit')
    })
  })

  describe('variants', () => {
    const variants = [
      'default',
      'success',
      'warning',
      'secondary',
      'outline',
      'ghost',
      'link',
      'destructive',
    ] as const

    it.each(variants)('renders %s variant without errors', (variant) => {
      const wrapper = mount(Button, {
        props: { variant },
        slots: { default: 'Button' },
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('applies default variant classes (orange)', () => {
      const wrapper = mount(Button, {
        slots: { default: 'Button' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('bg-orange')
    })

    it('applies destructive variant classes (red)', () => {
      const wrapper = mount(Button, {
        props: { variant: 'destructive' },
        slots: { default: 'Delete' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('bg-red')
    })

    it('applies success variant classes (emerald)', () => {
      const wrapper = mount(Button, {
        props: { variant: 'success' },
        slots: { default: 'Save' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('bg-emerald')
    })
  })

  describe('sizes', () => {
    const sizes = ['default', 'xs', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-xs'] as const

    it.each(sizes)('renders %s size without errors', (size) => {
      const wrapper = mount(Button, {
        props: { size },
        slots: { default: 'Button' },
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('click handling', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(Button, {
        slots: { default: 'Click me' },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.length).toBe(1)
    })

    it('does not emit click when disabled', async () => {
      const wrapper = mount(Button, {
        props: { disabled: true },
        slots: { default: 'Disabled' },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('does not emit click when loading', async () => {
      const wrapper = mount(Button, {
        props: { loading: true },
        slots: { default: 'Loading' },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('click')).toBeUndefined()
    })
  })

  describe('disabled state', () => {
    it('has disabled attribute when disabled', () => {
      const wrapper = mount(Button, {
        props: { disabled: true },
        slots: { default: 'Disabled' },
      })

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('has disabled attribute when loading', () => {
      const wrapper = mount(Button, {
        props: { loading: true },
        slots: { default: 'Loading' },
      })

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('loading state', () => {
    it('shows loader when loading', () => {
      const wrapper = mount(Button, {
        props: { loading: true },
        slots: { default: 'Loading' },
      })

      // Loader2 component should be rendered with animate-spin
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('hides custom icon when loading', () => {
      const wrapper = mount(Button, {
        props: {
          loading: true,
          icon: MockIcon,
        },
        slots: { default: 'Loading' },
      })

      // Should show loader, not the custom icon
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(false)
    })
  })

  describe('icon support', () => {
    it('renders icon when provided', () => {
      const wrapper = mount(Button, {
        props: { icon: MockIcon },
        slots: { default: 'With Icon' },
      })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true)
    })

    it('renders icon on the right when iconPosition="right"', () => {
      const wrapper = mount(Button, {
        props: {
          icon: MockIcon,
          iconPosition: 'right',
        },
        slots: { default: 'Icon Right' },
      })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true)
    })
  })

  describe('full width', () => {
    it('applies full width class when fullWidth is true', () => {
      const wrapper = mount(Button, {
        props: { fullWidth: true },
        slots: { default: 'Full Width' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('w-full')
    })
  })

  describe('render as anchor', () => {
    it('renders as anchor element when as="a"', () => {
      const wrapper = mount(Button, {
        props: {
          as: 'a',
          href: 'https://example.com',
        },
        slots: { default: 'Link' },
      })

      const anchor = wrapper.find('a')
      expect(anchor.exists()).toBe(true)
      expect(anchor.attributes('href')).toBe('https://example.com')
    })
  })

  describe('render as router-link', () => {
    it('renders as RouterLink when as="router-link"', () => {
      const wrapper = mount(Button, {
        props: {
          as: 'router-link',
          to: '/dashboard',
        },
        slots: { default: 'Dashboard' },
        global: {
          stubs: {
            RouterLink: {
              template: '<a :href="to" data-router-link><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      expect(wrapper.find('[data-router-link]').exists()).toBe(true)
    })
  })

  describe('custom classes', () => {
    it('applies additional custom classes', () => {
      const wrapper = mount(Button, {
        props: { class: 'my-custom-class' },
        slots: { default: 'Custom' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('my-custom-class')
    })

    it('merges custom classes with variant classes', () => {
      const wrapper = mount(Button, {
        props: {
          variant: 'destructive',
          class: 'extra-class',
        },
        slots: { default: 'Merged' },
      })

      const button = wrapper.find('button')
      expect(button.html()).toContain('bg-red')
      expect(button.html()).toContain('extra-class')
    })
  })
})
