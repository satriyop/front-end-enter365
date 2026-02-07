/**
 * Pagination Component Tests
 *
 * Tests visiblePages algorithm, boundary navigation, per-page changes, and showing info.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '../Pagination.vue'

function mountPagination(props: Record<string, unknown> = {}) {
  return mount(Pagination, {
    props: {
      currentPage: 1,
      totalPages: 10,
      ...props,
    },
  })
}

describe('Pagination', () => {
  describe('visible pages algorithm', () => {
    it('shows all pages when totalPages <= 7', () => {
      const wrapper = mountPagination({ totalPages: 5, currentPage: 3 })

      const buttons = wrapper.findAll('nav button')
      // 5 page buttons + prev + next = 7
      expect(buttons).toHaveLength(7)
      // Should not have ellipsis
      expect(wrapper.text()).not.toContain('...')
    })

    it('shows exactly 7 pages without ellipsis', () => {
      const wrapper = mountPagination({ totalPages: 7, currentPage: 4 })

      expect(wrapper.text()).not.toContain('...')
      // Verify all 7 pages are present
      for (let i = 1; i <= 7; i++) {
        expect(wrapper.text()).toContain(String(i))
      }
    })

    it('shows right ellipsis when current is near start', () => {
      const wrapper = mountPagination({ totalPages: 20, currentPage: 2 })

      // Should show: 1 2 3 ... 20
      expect(wrapper.text()).toContain('...')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('20')
    })

    it('shows left ellipsis when current is near end', () => {
      const wrapper = mountPagination({ totalPages: 20, currentPage: 19 })

      // Should show: 1 ... 18 19 20
      expect(wrapper.text()).toContain('...')
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('18')
      expect(wrapper.text()).toContain('19')
      expect(wrapper.text()).toContain('20')
    })

    it('shows both ellipses when current is in the middle', () => {
      const wrapper = mountPagination({ totalPages: 20, currentPage: 10 })

      const ellipses = wrapper.findAll('span').filter((s) => s.text() === '...')
      expect(ellipses).toHaveLength(2)

      // Should show: 1 ... 9 10 11 ... 20
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('9')
      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('11')
      expect(wrapper.text()).toContain('20')
    })

    it('handles single page', () => {
      const wrapper = mountPagination({ totalPages: 1, currentPage: 1 })

      // Only 1 page button + prev + next
      const pageButtons = wrapper.findAll('nav button')
      expect(pageButtons).toHaveLength(3)
    })
  })

  describe('active page styling', () => {
    it('highlights current page with orange', () => {
      const wrapper = mountPagination({ currentPage: 3, totalPages: 5 })

      const buttons = wrapper.findAll('nav button')
      // Page 3 button (prev + page1 + page2 + page3 = index 3)
      const page3 = buttons[3]
      expect(page3.html()).toContain('bg-orange-500')
      expect(page3.html()).toContain('text-white')
    })
  })

  describe('navigation', () => {
    it('emits update:currentPage when clicking a page', async () => {
      const wrapper = mountPagination({ currentPage: 1, totalPages: 5 })

      // Click page 3 (prev + 1 + 2 + 3 = index 3)
      const buttons = wrapper.findAll('nav button')
      await buttons[3].trigger('click')

      expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([3])
      expect(wrapper.emitted('page-change')?.[0]).toEqual([3])
    })

    it('emits previous page on prev button click', async () => {
      const wrapper = mountPagination({ currentPage: 3, totalPages: 5 })

      const prevButton = wrapper.findAll('nav button')[0]
      await prevButton.trigger('click')

      expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([2])
    })

    it('emits next page on next button click', async () => {
      const wrapper = mountPagination({ currentPage: 3, totalPages: 5 })

      const buttons = wrapper.findAll('nav button')
      const nextButton = buttons[buttons.length - 1]
      await nextButton.trigger('click')

      expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([4])
    })

    it('does not emit when clicking current page', async () => {
      const wrapper = mountPagination({ currentPage: 1, totalPages: 5 })

      // Click page 1 (already current)
      const buttons = wrapper.findAll('nav button')
      await buttons[1].trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeUndefined()
    })

    it('disables prev button on first page', () => {
      const wrapper = mountPagination({ currentPage: 1, totalPages: 5 })

      const prevButton = wrapper.findAll('nav button')[0]
      expect(prevButton.attributes('disabled')).toBeDefined()
    })

    it('disables next button on last page', () => {
      const wrapper = mountPagination({ currentPage: 5, totalPages: 5 })

      const buttons = wrapper.findAll('nav button')
      const nextButton = buttons[buttons.length - 1]
      expect(nextButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('per page selector', () => {
    it('shows per page selector by default', () => {
      const wrapper = mountPagination()

      expect(wrapper.text()).toContain('Show')
      expect(wrapper.text()).toContain('per page')
      expect(wrapper.find('select').exists()).toBe(true)
    })

    it('hides per page selector when showPerPage is false', () => {
      const wrapper = mountPagination({ showPerPage: false })

      expect(wrapper.find('select').exists()).toBe(false)
    })

    it('renders per page options', () => {
      const wrapper = mountPagination()

      const options = wrapper.findAll('option')
      expect(options.map((o) => o.text())).toEqual(['10', '25', '50', '100'])
    })

    it('renders custom per page options', () => {
      const wrapper = mountPagination({ perPageOptions: [5, 15, 30] })

      const options = wrapper.findAll('option')
      expect(options.map((o) => o.text())).toEqual(['5', '15', '30'])
    })

    it('emits update:perPage and resets to page 1 on change', async () => {
      const wrapper = mountPagination({ currentPage: 3, perPage: 25 })

      const select = wrapper.find('select')
      await select.setValue('50')

      expect(wrapper.emitted('update:perPage')?.[0]).toEqual([50])
      expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([1])
    })
  })

  describe('showing info', () => {
    it('shows result count when totalItems is provided', () => {
      const wrapper = mountPagination({
        currentPage: 1,
        totalPages: 4,
        totalItems: 100,
        perPage: 25,
      })

      expect(wrapper.text()).toContain('Showing 1 to 25 of 100 results')
    })

    it('shows correct range for middle page', () => {
      const wrapper = mountPagination({
        currentPage: 3,
        totalPages: 4,
        totalItems: 100,
        perPage: 25,
      })

      expect(wrapper.text()).toContain('Showing 51 to 75 of 100 results')
    })

    it('caps "to" at totalItems on last page', () => {
      const wrapper = mountPagination({
        currentPage: 4,
        totalPages: 4,
        totalItems: 90,
        perPage: 25,
      })

      expect(wrapper.text()).toContain('Showing 76 to 90 of 90 results')
    })

    it('hides info when showInfo is false', () => {
      const wrapper = mountPagination({
        showInfo: false,
        totalItems: 100,
      })

      expect(wrapper.text()).not.toContain('Showing')
    })

    it('hides info when totalItems is not provided', () => {
      const wrapper = mountPagination()

      expect(wrapper.text()).not.toContain('Showing')
    })
  })

  describe('accessibility', () => {
    it('has aria-label on nav element', () => {
      const wrapper = mountPagination()

      expect(wrapper.find('nav').attributes('aria-label')).toBe('Pagination')
    })

    it('has sr-only labels for prev/next buttons', () => {
      const wrapper = mountPagination()

      expect(wrapper.text()).toContain('Previous')
      expect(wrapper.text()).toContain('Next')
    })
  })
})
