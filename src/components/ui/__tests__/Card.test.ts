/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '../Card.vue'

function mountCard(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Card, {
    props,
    slots: { default: '<p>Card content</p>', ...slots },
  })
}

describe('Card', () => {
  describe('rendering', () => {
    it('renders slot content', () => {
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('Card content')
    })

    it('renders as a div element', () => {
      const wrapper = mountCard()

      expect(wrapper.element.tagName).toBe('DIV')
    })

    it('applies base styles', () => {
      const wrapper = mountCard()
      const html = wrapper.html()

      expect(html).toContain('rounded-lg')
      expect(html).toContain('border')
      expect(html).toContain('bg-card')
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      const wrapper = mountCard({ variant: 'default' })

      // Default has border + bg-card, no shadow
      expect(wrapper.html()).toContain('bg-card')
      expect(wrapper.html()).not.toContain('shadow-md')
    })

    it('renders elevated variant with shadow', () => {
      const wrapper = mountCard({ variant: 'elevated' })
      const html = wrapper.html()

      expect(html).toContain('shadow-md')
      expect(html).toContain('border-transparent')
    })

    it('renders outlined variant with thicker border', () => {
      const wrapper = mountCard({ variant: 'outlined' })

      expect(wrapper.html()).toContain('border-2')
    })
  })

  describe('padding', () => {
    it('applies padding by default', () => {
      const wrapper = mountCard()

      expect(wrapper.html()).toContain('p-6')
    })

    it('removes padding when padding is false', () => {
      const wrapper = mountCard({ padding: false })

      expect(wrapper.html()).not.toContain('p-6')
    })
  })

  describe('interactive states', () => {
    it('does not apply hover effect by default', () => {
      const wrapper = mountCard()

      expect(wrapper.html()).not.toContain('hover:shadow-lg')
    })

    it('applies hover shadow when hoverable', () => {
      const wrapper = mountCard({ hoverable: true })

      expect(wrapper.html()).toContain('hover:shadow-lg')
      expect(wrapper.html()).toContain('transition-shadow')
    })

    it('does not apply cursor-pointer by default', () => {
      const wrapper = mountCard()

      expect(wrapper.html()).not.toContain('cursor-pointer')
    })

    it('applies cursor-pointer when clickable', () => {
      const wrapper = mountCard({ clickable: true })

      expect(wrapper.html()).toContain('cursor-pointer')
    })
  })

  describe('header slot', () => {
    it('renders header when slot provided', () => {
      const wrapper = mountCard({}, {
        header: '<h2>Card Title</h2>',
      })

      expect(wrapper.text()).toContain('Card Title')
    })

    it('header has bottom border', () => {
      const wrapper = mountCard({}, {
        header: '<h2>Title</h2>',
      })

      const headerDiv = wrapper.findAll('div').find((d) =>
        d.html().includes('border-b') && d.html().includes('border-border')
      )
      expect(headerDiv).toBeTruthy()
    })

    it('does not render header container when no slot', () => {
      const wrapper = mountCard()

      const headerDiv = wrapper.findAll('div').find((d) =>
        d.classes().includes('pb-4') && d.classes().includes('border-b')
      )
      expect(headerDiv).toBeUndefined()
    })
  })

  describe('footer slot', () => {
    it('renders footer when slot provided', () => {
      const wrapper = mountCard({}, {
        footer: '<button>Save</button>',
      })

      expect(wrapper.text()).toContain('Save')
    })

    it('footer has top border', () => {
      const wrapper = mountCard({}, {
        footer: '<button>Save</button>',
      })

      const footerDiv = wrapper.findAll('div').find((d) =>
        d.html().includes('border-t') && d.html().includes('border-border')
      )
      expect(footerDiv).toBeTruthy()
    })

    it('does not render footer container when no slot', () => {
      const wrapper = mountCard()

      const footerDiv = wrapper.findAll('div').find((d) =>
        d.classes().includes('pt-4') && d.classes().includes('border-t')
      )
      expect(footerDiv).toBeUndefined()
    })
  })

  describe('custom classes', () => {
    it('applies additional classes', () => {
      const wrapper = mountCard({ class: 'my-card-class' })

      expect(wrapper.html()).toContain('my-card-class')
    })
  })
})
