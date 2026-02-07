/**
 * EmptyState Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent } from 'vue'
import EmptyState from '../EmptyState.vue'

const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="custom-icon"></svg>',
  })
)

function mountEmptyState(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(EmptyState, {
    props: {
      title: 'No items found',
      ...props,
    },
    slots,
  })
}

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders title', () => {
      const wrapper = mountEmptyState()

      expect(wrapper.find('h3').text()).toBe('No items found')
    })

    it('renders description when provided', () => {
      const wrapper = mountEmptyState({ description: 'Try adjusting your filters' })

      expect(wrapper.text()).toContain('Try adjusting your filters')
    })

    it('does not render description when not provided', () => {
      const wrapper = mountEmptyState()

      const descEl = wrapper.findAll('p').find((p) =>
        p.classes().includes('max-w-sm')
      )
      expect(descEl).toBeUndefined()
    })
  })

  describe('icon', () => {
    it('renders default SVG icon when no custom icon', () => {
      const wrapper = mountEmptyState()

      // Default icon is an SVG with w-12 h-12
      expect(wrapper.find('svg.w-12').exists()).toBe(true)
    })

    it('renders custom icon when provided', () => {
      const wrapper = mountEmptyState({ icon: MockIcon })

      expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    })

    it('hides default icon when custom icon is provided', () => {
      const wrapper = mountEmptyState({ icon: MockIcon })

      // v-if/v-else — default SVG (with stroke-width path) should not render
      const defaultSvg = wrapper.findAll('svg').find((s) =>
        s.find('path[stroke-width]').exists()
      )
      expect(defaultSvg).toBeUndefined()
    })
  })

  describe('action button', () => {
    it('does not render action button when no actionLabel', () => {
      const wrapper = mountEmptyState()

      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('renders action button when actionLabel is provided', () => {
      const wrapper = mountEmptyState({ actionLabel: 'Create New' })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Create New')
    })

    it('emits action event when button clicked', async () => {
      const wrapper = mountEmptyState({ actionLabel: 'Add Item' })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('action')).toHaveLength(1)
    })

    it('applies orange styling to action button', () => {
      const wrapper = mountEmptyState({ actionLabel: 'Create' })

      expect(wrapper.find('button').html()).toContain('bg-orange-500')
    })
  })

  describe('slot', () => {
    it('renders additional content via default slot', () => {
      const wrapper = mountEmptyState({}, {
        default: '<p data-testid="extra">Extra content</p>',
      })

      expect(wrapper.find('[data-testid="extra"]').exists()).toBe(true)
    })
  })

  describe('layout', () => {
    it('centers content vertically and horizontally', () => {
      const wrapper = mountEmptyState()

      const container = wrapper.find('div')
      expect(container.html()).toContain('items-center')
      expect(container.html()).toContain('justify-center')
      expect(container.html()).toContain('text-center')
    })
  })
})
