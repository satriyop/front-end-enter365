/**
 * PageSkeleton Component Tests
 *
 * Tests the full-page skeleton loader that renders different layouts
 * for list, detail, and form page types.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageSkeleton from '../PageSkeleton.vue'

function mountPageSkeleton(props: Record<string, unknown> = {}) {
  return mount(PageSkeleton, { props })
}

describe('PageSkeleton', () => {
  describe('list type (default)', () => {
    it('renders list skeleton by default', () => {
      const wrapper = mountPageSkeleton()

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })

    it('renders table rows', () => {
      const wrapper = mountPageSkeleton({ type: 'list' })

      // List skeleton has 8 table rows (v-for="i in 8")
      const rows = wrapper.findAll('.border-b.border-slate-100')
      expect(rows.length).toBe(8)
    })

    it('renders filter placeholders', () => {
      const wrapper = mountPageSkeleton({ type: 'list' })

      // Filters section has w-64, w-32, w-32 elements
      const html = wrapper.html()
      expect(html).toContain('w-64')
    })

    it('renders pagination placeholders', () => {
      const wrapper = mountPageSkeleton({ type: 'list' })

      // Pagination has h-8 w-8 elements
      const paginationItems = wrapper.findAll('.h-8.w-8')
      expect(paginationItems.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('detail type', () => {
    it('renders detail skeleton', () => {
      const wrapper = mountPageSkeleton({ type: 'detail' })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })

    it('renders breadcrumb placeholder', () => {
      const wrapper = mountPageSkeleton({ type: 'detail' })

      // Breadcrumb section has small rounded elements in a flex row
      const html = wrapper.html()
      expect(html).toContain('w-20')
    })

    it('renders content grid with sidebar', () => {
      const wrapper = mountPageSkeleton({ type: 'detail' })

      expect(wrapper.find('.lg\\:grid-cols-3').exists()).toBe(true)
      expect(wrapper.find('.lg\\:col-span-2').exists()).toBe(true)
    })

    it('renders detail fields', () => {
      const wrapper = mountPageSkeleton({ type: 'detail' })

      // Detail card has 6 field placeholders (v-for="i in 6")
      const fieldGrid = wrapper.find('.grid.grid-cols-2.gap-4')
      expect(fieldGrid.exists()).toBe(true)
    })

    it('renders item rows', () => {
      const wrapper = mountPageSkeleton({ type: 'detail' })

      // Items card has 4 rows (v-for="i in 4")
      const itemRows = wrapper.findAll('.border-b.border-slate-100')
      expect(itemRows.length).toBe(4)
    })
  })

  describe('form type', () => {
    it('renders form skeleton', () => {
      const wrapper = mountPageSkeleton({ type: 'form' })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })

    it('renders form field placeholders', () => {
      const wrapper = mountPageSkeleton({ type: 'form' })

      // Form card has 6 field placeholders in a grid
      expect(wrapper.find('.grid.grid-cols-1.md\\:grid-cols-2.gap-6').exists()).toBe(true)
    })

    it('renders action buttons placeholder', () => {
      const wrapper = mountPageSkeleton({ type: 'form' })

      // Header has two action button placeholders (h-10 w-24)
      const actionButtons = wrapper.findAll('.h-10.w-24')
      expect(actionButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('renders items section', () => {
      const wrapper = mountPageSkeleton({ type: 'form' })

      // Items section has 3 rows (v-for="i in 3")
      const html = wrapper.html()
      expect(html).toContain('flex-1')
    })
  })

  describe('shared behavior', () => {
    it.each(['list', 'detail', 'form'] as const)('%s type has animate-pulse', (type) => {
      const wrapper = mountPageSkeleton({ type })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })

    it.each(['list', 'detail', 'form'] as const)('%s type uses skeleton bg colors', (type) => {
      const wrapper = mountPageSkeleton({ type })

      expect(wrapper.html()).toContain('bg-slate-200')
    })
  })
})
