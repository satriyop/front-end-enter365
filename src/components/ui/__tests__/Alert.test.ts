/**
 * Alert Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent } from 'vue'
import Alert from '../Alert.vue'

const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="custom-icon"></svg>',
  })
)

function mountAlert(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Alert, {
    props,
    slots: { default: 'Alert message', ...slots },
  })
}

describe('Alert', () => {
  describe('rendering', () => {
    it('renders with role="alert"', () => {
      const wrapper = mountAlert()

      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('renders slot content', () => {
      const wrapper = mountAlert()

      expect(wrapper.text()).toContain('Alert message')
    })

    it('renders title when provided', () => {
      const wrapper = mountAlert({ title: 'Warning Title' })

      expect(wrapper.find('h3').text()).toBe('Warning Title')
    })

    it('does not render title element when not provided', () => {
      const wrapper = mountAlert()

      expect(wrapper.find('h3').exists()).toBe(false)
    })

    it('adds margin-top to content when title present', () => {
      const wrapper = mountAlert({ title: 'Title' })

      // Content div gets 'mt-1' class when title is set
      const contentDiv = wrapper.findAll('div').find((d) =>
        d.text().includes('Alert message') && d.classes().includes('mt-1')
      )
      expect(contentDiv).toBeTruthy()
    })
  })

  describe('variants', () => {
    it('applies info variant (blue)', () => {
      const wrapper = mountAlert({ variant: 'info' })
      const html = wrapper.html()

      expect(html).toContain('bg-blue-50')
      expect(html).toContain('border-blue-500')
    })

    it('applies success variant (green)', () => {
      const wrapper = mountAlert({ variant: 'success' })
      const html = wrapper.html()

      expect(html).toContain('bg-green-50')
      expect(html).toContain('border-green-500')
    })

    it('applies warning variant (amber)', () => {
      const wrapper = mountAlert({ variant: 'warning' })
      const html = wrapper.html()

      expect(html).toContain('bg-amber-50')
      expect(html).toContain('border-amber-500')
    })

    it('applies destructive variant (red)', () => {
      const wrapper = mountAlert({ variant: 'destructive' })
      const html = wrapper.html()

      expect(html).toContain('bg-red-50')
      expect(html).toContain('border-red-500')
    })

    it('defaults to info variant', () => {
      const wrapper = mountAlert()

      expect(wrapper.html()).toContain('bg-blue-50')
    })

    it('applies variant-specific text color to title', () => {
      const wrapper = mountAlert({ variant: 'destructive', title: 'Error' })

      expect(wrapper.find('h3').html()).toContain('text-red-700')
    })
  })

  describe('icons', () => {
    it('renders default SVG icon for each variant', () => {
      const wrapper = mountAlert({ variant: 'info' })

      // Default icon is an SVG, not a component
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('applies variant-specific icon color', () => {
      const wrapper = mountAlert({ variant: 'success' })

      const icon = wrapper.find('svg')
      expect(icon.html()).toContain('text-green-500')
    })

    it('renders custom icon component when provided', () => {
      const wrapper = mountAlert({ icon: MockIcon })

      expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    })

    it('hides default icon when custom icon is provided', () => {
      const wrapper = mountAlert({ icon: MockIcon })

      // The custom icon replaces the default SVG (v-if/v-else)
      const svgs = wrapper.findAll('svg')
      const defaultIcon = svgs.find((s) => s.find('path[stroke-linecap]').exists())
      expect(defaultIcon).toBeUndefined()
    })
  })

  describe('dismissible', () => {
    it('does not show dismiss button by default', () => {
      const wrapper = mountAlert()

      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(0)
    })

    it('shows dismiss button when dismissible is true', () => {
      const wrapper = mountAlert({ dismissible: true })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
    })

    it('has sr-only label on dismiss button', () => {
      const wrapper = mountAlert({ dismissible: true })

      expect(wrapper.find('button').text()).toContain('Dismiss')
    })

    it('emits dismiss event when dismiss button clicked', async () => {
      const wrapper = mountAlert({ dismissible: true })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('dismiss')).toHaveLength(1)
    })
  })

  describe('actions slot', () => {
    it('renders actions slot when provided', () => {
      const wrapper = mountAlert({}, {
        actions: '<button>Retry</button>',
      })

      expect(wrapper.text()).toContain('Retry')
    })

    it('does not render actions container when no slot', () => {
      const wrapper = mountAlert()

      // Only the content div should exist, no actions wrapper
      const divs = wrapper.findAll('div')
      const actionsDiv = divs.find((d) => d.classes().includes('mt-3'))
      expect(actionsDiv).toBeUndefined()
    })
  })

  describe('left border styling', () => {
    it('has left border accent', () => {
      const wrapper = mountAlert()

      expect(wrapper.find('[role="alert"]').html()).toContain('border-l-4')
    })
  })
})
