/**
 * Breadcrumbs Component Tests
 *
 * Mocks vue-router's useRoute/useRouter to test breadcrumb generation
 * from route metadata without needing a real router instance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Breadcrumbs from '../Breadcrumbs.vue'

// Mock vue-router
const mockRoute = ref({
  matched: [] as Array<{ name: string; meta: Record<string, unknown> }>,
  params: {} as Record<string, string>,
})

const mockRouter = {
  resolve: vi.fn((opts: { name: string; params: Record<string, string> }) => ({
    href: `/${opts.name}`,
  })),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => mockRouter,
}))

function mountBreadcrumbs() {
  return mount(Breadcrumbs, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

function setRoute(
  matched: Array<{ name: string; meta: Record<string, unknown> }>,
  params: Record<string, string> = {},
) {
  mockRoute.value = { matched, params }
}

beforeEach(() => {
  setRoute([])
  mockRouter.resolve.mockClear()
})

describe('Breadcrumbs', () => {
  describe('visibility', () => {
    it('hides when only Home breadcrumb exists (no matched routes)', () => {
      setRoute([])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.find('nav').exists()).toBe(false)
    })

    it('shows when matched routes have breadcrumb meta', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.find('nav').exists()).toBe(true)
    })
  })

  describe('home link', () => {
    it('always starts with Home', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      const links = wrapper.findAll('a')
      expect(links[0].text()).toBe('Home')
      expect(links[0].attributes('href')).toBe('/')
    })
  })

  describe('static breadcrumbs', () => {
    it('renders breadcrumb from string meta', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.text()).toContain('Invoices')
    })

    it('renders multi-level breadcrumbs', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: 'INV-001' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.text()).toContain('Home')
      expect(wrapper.text()).toContain('Invoices')
      expect(wrapper.text()).toContain('INV-001')
    })
  })

  describe('dynamic breadcrumbs', () => {
    it('calls function breadcrumb with route', () => {
      const dynamicFn = vi.fn(() => 'Invoice #42')

      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: dynamicFn } },
      ])
      mountBreadcrumbs()

      expect(dynamicFn).toHaveBeenCalled()
    })

    it('renders dynamic breadcrumb label', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: () => 'INV-2024-001' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.text()).toContain('INV-2024-001')
    })
  })

  describe('links vs text', () => {
    it('renders parent items as links', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: 'INV-001' } },
      ])
      const wrapper = mountBreadcrumbs()

      // Home and Invoices should be links
      const links = wrapper.findAll('a')
      expect(links).toHaveLength(2)
      expect(links[0].text()).toBe('Home')
      expect(links[1].text()).toBe('Invoices')
    })

    it('renders last item as plain text', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: 'INV-001' } },
      ])
      const wrapper = mountBreadcrumbs()

      // Last item is a span, not a link
      const lastItem = wrapper.findAll('span').find((s) => s.text() === 'INV-001')
      expect(lastItem).toBeTruthy()
      expect(lastItem!.classes()).toContain('font-medium')
    })

    it('applies truncation to last item', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: 'Very Long Invoice Name' } },
      ])
      const wrapper = mountBreadcrumbs()

      const lastSpan = wrapper.findAll('span').find((s) => s.text() === 'Very Long Invoice Name')
      expect(lastSpan!.classes()).toContain('truncate')
    })
  })

  describe('separators', () => {
    it('renders chevron separators between items', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
        { name: 'invoice-detail', meta: { breadcrumb: 'INV-001' } },
      ])
      const wrapper = mountBreadcrumbs()

      // 3 items (Home, Invoices, INV-001) = 2 separators
      const separators = wrapper.findAll('svg')
      expect(separators).toHaveLength(2)
    })

    it('does not render separator before first item', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      // First li should not start with an SVG separator
      const firstLi = wrapper.findAll('li')[0]
      expect(firstLi.find('svg').exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('has nav with aria-label', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.find('nav').attributes('aria-label')).toBe('Breadcrumb')
    })

    it('renders as ordered list', () => {
      setRoute([
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      expect(wrapper.find('ol').exists()).toBe(true)
    })
  })

  describe('route resolution', () => {
    it('resolves parent route paths via router', () => {
      setRoute(
        [
          { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
          { name: 'invoice-detail', meta: { breadcrumb: 'INV-001' } },
        ],
        { id: '42' },
      )
      mountBreadcrumbs()

      expect(mockRouter.resolve).toHaveBeenCalledWith({
        name: 'invoices',
        params: { id: '42' },
      })
    })

    it('skips routes without breadcrumb meta', () => {
      setRoute([
        { name: 'layout', meta: {} },
        { name: 'invoices', meta: { breadcrumb: 'Invoices' } },
      ])
      const wrapper = mountBreadcrumbs()

      // Should have Home + Invoices, not a "layout" breadcrumb
      expect(wrapper.text()).not.toContain('layout')
      expect(wrapper.text()).toContain('Home')
      expect(wrapper.text()).toContain('Invoices')
    })
  })
})
