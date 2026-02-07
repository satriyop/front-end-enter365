/**
 * FilterBar Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '../FilterBar.vue'

function mountFilterBar(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(FilterBar, {
    props,
    slots: { default: '<input placeholder="Search" />', ...slots },
  })
}

describe('FilterBar', () => {
  describe('rendering', () => {
    it('renders slot content', () => {
      const wrapper = mountFilterBar()

      expect(wrapper.find('input[placeholder="Search"]').exists()).toBe(true)
    })

    it('applies base styling', () => {
      const wrapper = mountFilterBar()
      const html = wrapper.html()

      expect(html).toContain('rounded-lg')
      expect(html).toContain('border')
      expect(html).toContain('bg-card')
      expect(html).toContain('p-4')
    })

    it('applies flex layout', () => {
      const wrapper = mountFilterBar()
      const html = wrapper.html()

      expect(html).toContain('flex')
      expect(html).toContain('flex-wrap')
      expect(html).toContain('items-end')
      expect(html).toContain('gap-4')
    })
  })

  describe('custom classes', () => {
    it('applies additional classes', () => {
      const wrapper = mountFilterBar({ class: 'my-custom-filter' })

      expect(wrapper.html()).toContain('my-custom-filter')
    })
  })
})
