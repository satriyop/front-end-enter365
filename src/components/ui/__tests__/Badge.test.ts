/**
 * Badge Component Tests
 *
 * Tests variant system, 16 domain-specific statuses, dot indicator, and pulse animation.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '../Badge.vue'

function mountBadge(props: Record<string, unknown> = {}, slotContent = 'Label') {
  return mount(Badge, {
    props,
    slots: { default: slotContent },
  })
}

describe('Badge', () => {
  describe('rendering', () => {
    it('renders slot content', () => {
      const wrapper = mountBadge({}, 'Draft')

      expect(wrapper.text()).toBe('Draft')
    })

    it('renders as a span element', () => {
      const wrapper = mountBadge()

      expect(wrapper.element.tagName).toBe('SPAN')
    })

    it('applies base badge styles', () => {
      const wrapper = mountBadge()

      expect(wrapper.html()).toContain('rounded-full')
      expect(wrapper.html()).toContain('text-xs')
      expect(wrapper.html()).toContain('font-medium')
    })
  })

  describe('variants (CVA)', () => {
    const variants = [
      'default',
      'primary',
      'secondary',
      'success',
      'warning',
      'destructive',
      'info',
      'outline',
    ] as const

    it.each(variants)('renders %s variant without errors', (variant) => {
      const wrapper = mountBadge({ variant })

      expect(wrapper.find('span').exists()).toBe(true)
    })

    it('applies default variant when no variant specified', () => {
      const wrapper = mountBadge()

      expect(wrapper.html()).toContain('bg-slate-100')
    })

    it('applies primary variant classes (orange)', () => {
      const wrapper = mountBadge({ variant: 'primary' })

      expect(wrapper.html()).toContain('bg-orange-100')
    })

    it('applies success variant classes (green)', () => {
      const wrapper = mountBadge({ variant: 'success' })

      expect(wrapper.html()).toContain('bg-green-100')
    })

    it('applies destructive variant classes (red)', () => {
      const wrapper = mountBadge({ variant: 'destructive' })

      expect(wrapper.html()).toContain('bg-red-100')
    })

    it('applies outline variant with border', () => {
      const wrapper = mountBadge({ variant: 'outline' })

      expect(wrapper.html()).toContain('border')
      expect(wrapper.html()).toContain('bg-transparent')
    })
  })

  describe('domain-specific statuses', () => {
    const greenStatuses = ['approved', 'completed', 'paid', 'converted']
    const redStatuses = ['cancelled', 'rejected', 'overdue']
    const amberStatuses = ['pending', 'submitted', 'partial']
    const blueStatuses = ['in_progress', 'sent', 'posted']
    const slateStatuses = ['draft', 'expired']

    it.each(greenStatuses)('applies green style for %s status', (status) => {
      const wrapper = mountBadge({ status })

      expect(wrapper.html()).toContain('bg-green-100')
      expect(wrapper.html()).toContain('text-green-700')
    })

    it.each(redStatuses)('applies red style for %s status', (status) => {
      const wrapper = mountBadge({ status })

      expect(wrapper.html()).toContain('bg-red-100')
      expect(wrapper.html()).toContain('text-red-700')
    })

    it.each(amberStatuses)('applies amber style for %s status', (status) => {
      const wrapper = mountBadge({ status })

      expect(wrapper.html()).toContain('bg-amber-100')
      expect(wrapper.html()).toContain('text-amber-700')
    })

    it.each(blueStatuses)('applies blue style for %s status', (status) => {
      const wrapper = mountBadge({ status })

      expect(wrapper.html()).toContain('bg-blue-100')
      expect(wrapper.html()).toContain('text-blue-700')
    })

    it.each(slateStatuses)('applies slate style for %s status', (status) => {
      const wrapper = mountBadge({ status })

      expect(wrapper.html()).toContain('bg-slate-100')
      expect(wrapper.html()).toContain('text-slate-700')
    })

    it('applies violet style for on_hold status', () => {
      const wrapper = mountBadge({ status: 'on_hold' })

      expect(wrapper.html()).toContain('bg-violet-100')
      expect(wrapper.html()).toContain('text-violet-700')
    })

    it('applies line-through for void status', () => {
      const wrapper = mountBadge({ status: 'void' })

      expect(wrapper.html()).toContain('line-through')
    })

    it('status overrides variant', () => {
      const wrapper = mountBadge({ status: 'approved', variant: 'destructive' })

      // Status takes priority — should be green, not red
      expect(wrapper.html()).toContain('bg-green-100')
      expect(wrapper.html()).not.toContain('bg-red-100')
    })

    it('falls back to variant for unknown status', () => {
      const wrapper = mountBadge({ status: 'unknown_status', variant: 'warning' })

      expect(wrapper.html()).toContain('bg-amber-100')
    })
  })

  describe('object status', () => {
    it('extracts value from object status', () => {
      const wrapper = mountBadge({ status: { value: 'approved', label: 'Approved' } })

      expect(wrapper.html()).toContain('bg-green-100')
    })

    it('falls back for object with unknown value', () => {
      const wrapper = mountBadge({
        status: { value: 'unknown' },
        variant: 'info',
      })

      expect(wrapper.html()).toContain('bg-blue-100')
    })
  })

  describe('dot indicator', () => {
    it('does not show dot by default', () => {
      const wrapper = mountBadge()

      const spans = wrapper.findAll('span')
      // Only the outer span and the slot content
      expect(spans.length).toBe(1) // Just the badge wrapper
    })

    it('shows dot when dot prop is true', () => {
      const wrapper = mountBadge({ dot: true })

      const dot = wrapper.find('span span')
      expect(dot.exists()).toBe(true)
      expect(dot.html()).toContain('rounded-full')
    })

    it('applies status-specific dot color', () => {
      const wrapper = mountBadge({ dot: true, status: 'approved' })

      const dot = wrapper.find('span span')
      expect(dot.html()).toContain('bg-green-500')
    })

    it('applies current color for dot without status', () => {
      const wrapper = mountBadge({ dot: true })

      const dot = wrapper.find('span span')
      expect(dot.html()).toContain('bg-current')
    })
  })

  describe('pulse animation', () => {
    it('does not pulse by default', () => {
      const wrapper = mountBadge({ dot: true })

      const dot = wrapper.find('span span')
      expect(dot.classes()).not.toContain('animate-pulse')
    })

    it('applies pulse animation when pulse is true', () => {
      const wrapper = mountBadge({ dot: true, pulse: true })

      const dot = wrapper.find('span span')
      expect(dot.classes()).toContain('animate-pulse')
    })
  })

  describe('custom classes', () => {
    it('applies additional classes', () => {
      const wrapper = mountBadge({ class: 'my-custom-class' })

      expect(wrapper.html()).toContain('my-custom-class')
    })
  })
})
