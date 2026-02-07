/**
 * FilterGroup Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterGroup from '../FilterGroup.vue'

function mountFilterGroup(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(FilterGroup, {
    props,
    slots: { default: '<select><option>All</option></select>', ...slots },
  })
}

describe('FilterGroup', () => {
  describe('rendering', () => {
    it('renders slot content', () => {
      const wrapper = mountFilterGroup()

      expect(wrapper.find('select').exists()).toBe(true)
    })

    it('renders label when provided', () => {
      const wrapper = mountFilterGroup({ label: 'Status' })

      const label = wrapper.find('label')
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe('Status')
    })

    it('does not render label when not provided', () => {
      const wrapper = mountFilterGroup()

      expect(wrapper.find('label').exists()).toBe(false)
    })

    it('applies muted foreground to label', () => {
      const wrapper = mountFilterGroup({ label: 'Type' })

      expect(wrapper.find('label').classes()).toContain('text-muted-foreground')
    })
  })

  describe('layout', () => {
    it('applies flex column layout', () => {
      const wrapper = mountFilterGroup()
      const html = wrapper.html()

      expect(html).toContain('flex')
      expect(html).toContain('flex-col')
      expect(html).toContain('gap-1.5')
    })

    it('applies flex-1 when grow is true', () => {
      const wrapper = mountFilterGroup({ grow: true })

      expect(wrapper.html()).toContain('flex-1')
    })

    it('does not apply flex-1 by default', () => {
      const wrapper = mountFilterGroup()

      expect(wrapper.html()).not.toContain('flex-1')
    })
  })

  describe('minWidth', () => {
    it('defaults to 200px minWidth', () => {
      const wrapper = mountFilterGroup()

      expect(wrapper.find('div').attributes('style')).toContain('min-width: 200px')
    })

    it('applies custom minWidth', () => {
      const wrapper = mountFilterGroup({ minWidth: '300px' })

      expect(wrapper.find('div').attributes('style')).toContain('min-width: 300px')
    })
  })

  describe('custom classes', () => {
    it('applies additional classes', () => {
      const wrapper = mountFilterGroup({ class: 'custom-group' })

      expect(wrapper.html()).toContain('custom-group')
    })
  })
})
