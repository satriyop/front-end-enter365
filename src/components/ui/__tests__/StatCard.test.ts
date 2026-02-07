/**
 * StatCard Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent } from 'vue'
import StatCard from '../StatCard.vue'

const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="stat-icon"></svg>',
  })
)

function mountStatCard(props: Record<string, unknown> = {}) {
  return mount(StatCard, {
    props: {
      label: 'Total Revenue',
      value: 'Rp 5.000.000',
      ...props,
    },
  })
}

describe('StatCard', () => {
  describe('rendering', () => {
    it('renders label', () => {
      const wrapper = mountStatCard()

      expect(wrapper.text()).toContain('Total Revenue')
    })

    it('renders value', () => {
      const wrapper = mountStatCard()

      expect(wrapper.text()).toContain('Rp 5.000.000')
    })

    it('renders numeric value', () => {
      const wrapper = mountStatCard({ value: 42 })

      expect(wrapper.text()).toContain('42')
    })

    it('applies uppercase tracking to label', () => {
      const wrapper = mountStatCard()

      const label = wrapper.find('.uppercase')
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('Total Revenue')
    })

    it('applies large bold text to value', () => {
      const wrapper = mountStatCard()

      const value = wrapper.find('.text-3xl')
      expect(value.exists()).toBe(true)
    })
  })

  describe('icon', () => {
    it('does not render icon by default', () => {
      const wrapper = mountStatCard()

      expect(wrapper.find('[data-testid="stat-icon"]').exists()).toBe(false)
    })

    it('renders icon when provided', () => {
      const wrapper = mountStatCard({ icon: MockIcon })

      expect(wrapper.find('[data-testid="stat-icon"]').exists()).toBe(true)
    })
  })

  describe('trend', () => {
    it('does not show trend by default', () => {
      const wrapper = mountStatCard()

      // No trend arrow text
      expect(wrapper.text()).not.toContain('↑')
      expect(wrapper.text()).not.toContain('↓')
      expect(wrapper.text()).not.toContain('→')
    })

    it('shows up trend with green color', () => {
      const wrapper = mountStatCard({
        trend: { value: '+12%', direction: 'up' },
      })

      expect(wrapper.text()).toContain('↑')
      expect(wrapper.text()).toContain('+12%')
      expect(wrapper.html()).toContain('text-green-600')
    })

    it('shows down trend with red color', () => {
      const wrapper = mountStatCard({
        trend: { value: '-5%', direction: 'down' },
      })

      expect(wrapper.text()).toContain('↓')
      expect(wrapper.text()).toContain('-5%')
      expect(wrapper.html()).toContain('text-red-600')
    })

    it('shows neutral trend with slate color', () => {
      const wrapper = mountStatCard({
        trend: { value: '0%', direction: 'neutral' },
      })

      expect(wrapper.text()).toContain('→')
      expect(wrapper.text()).toContain('0%')
      expect(wrapper.html()).toContain('text-slate-500')
    })
  })

  describe('alert badge', () => {
    it('does not show alert badge by default', () => {
      const wrapper = mountStatCard()

      expect(wrapper.text()).not.toContain('!')
    })

    it('shows alert badge when alert is true', () => {
      const wrapper = mountStatCard({ alert: true })

      const badge = wrapper.find('.bg-red-500')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('!')
    })

    it('alert badge is a circle', () => {
      const wrapper = mountStatCard({ alert: true })

      expect(wrapper.find('.rounded-full.bg-red-500').exists()).toBe(true)
    })
  })
})
