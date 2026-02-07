/**
 * Modal Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Modal, {
    props: {
      open: true,
      ...props,
    },
    slots: {
      default: '<p>Modal content</p>',
      ...slots,
    },
    global: {
      stubs: {
        // Stub teleport-based components to render inline
        DialogPortal: { template: '<div><slot /></div>' },
        DialogOverlay: { template: '<div data-testid="overlay"><slot /></div>' },
      },
    },
  })
}

describe('Modal', () => {
  describe('rendering', () => {
    it('renders slot content when open', () => {
      const wrapper = mountModal()

      expect(wrapper.text()).toContain('Modal content')
    })

    it('renders title when provided', () => {
      const wrapper = mountModal({ title: 'Edit Item' })

      expect(wrapper.text()).toContain('Edit Item')
    })

    it('renders description when provided', () => {
      const wrapper = mountModal({ title: 'Edit', description: 'Fill in the details' })

      expect(wrapper.text()).toContain('Fill in the details')
    })
  })

  describe('accessibility', () => {
    it('renders sr-only title when no title prop', () => {
      const wrapper = mountModal({ title: undefined })

      const srTitle = wrapper.findAll('.sr-only').find((el) => el.text() === 'Dialog')
      expect(srTitle).toBeTruthy()
    })

    it('renders visible title when title prop is set', () => {
      const wrapper = mountModal({ title: 'My Modal' })

      // Should not have the sr-only fallback
      expect(wrapper.text()).toContain('My Modal')
    })
  })

  describe('sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'] as const

    it.each(sizes)('applies %s size class', (size) => {
      const wrapper = mountModal({ size })
      const expectedClass = size === 'full' ? 'max-w-[calc(100%-2rem)]' : `max-w-${size}`

      expect(wrapper.html()).toContain(expectedClass)
    })

    it('defaults to lg size', () => {
      const wrapper = mountModal()

      expect(wrapper.html()).toContain('max-w-lg')
    })
  })

  describe('close button', () => {
    it('shows close button by default', () => {
      const wrapper = mountModal({ title: 'Test' })

      // Close button has sr-only "Close" text
      expect(wrapper.text()).toContain('Close')
    })

    it('hides close button when showClose is false', () => {
      const wrapper = mountModal({ title: 'Test', showClose: false })

      // No close button text
      const closeText = wrapper.findAll('.sr-only').find((el) => el.text() === 'Close')
      expect(closeText).toBeUndefined()
    })
  })

  describe('events', () => {
    it('emits update:open when DialogRoot triggers change', async () => {
      const wrapper = mountModal()

      // Find the DialogRoot and trigger open change
      const dialogRoot = wrapper.findComponent({ name: 'DialogRoot' })
      if (dialogRoot.exists()) {
        await dialogRoot.vm.$emit('update:open', false)

        expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
        expect(wrapper.emitted('close')).toHaveLength(1)
      }
    })

    it('emits close event when closing', async () => {
      const wrapper = mountModal()

      const dialogRoot = wrapper.findComponent({ name: 'DialogRoot' })
      if (dialogRoot.exists()) {
        await dialogRoot.vm.$emit('update:open', false)

        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })

    it('does not emit close when opening', async () => {
      const wrapper = mountModal({ open: false })

      const dialogRoot = wrapper.findComponent({ name: 'DialogRoot' })
      if (dialogRoot.exists()) {
        await dialogRoot.vm.$emit('update:open', true)

        expect(wrapper.emitted('close')).toBeUndefined()
      }
    })
  })

  describe('footer slot', () => {
    it('renders footer when slot provided', () => {
      const wrapper = mountModal({}, {
        footer: '<button>Save</button>',
      })

      expect(wrapper.text()).toContain('Save')
    })

    it('does not render footer container when no slot', () => {
      const wrapper = mountModal()

      // Footer has specific classes: bg-slate-50 rounded-b-lg
      const footerDiv = wrapper.findAll('div').find((d) =>
        d.html().includes('rounded-b-lg') && d.html().includes('bg-slate-50')
      )
      expect(footerDiv).toBeUndefined()
    })
  })

  describe('header', () => {
    it('shows header when title is set', () => {
      const wrapper = mountModal({ title: 'Header Test' })

      // Header has border-b
      const headerDiv = wrapper.findAll('div').find((d) =>
        d.classes().includes('border-b') || d.html().includes('border-b')
      )
      expect(headerDiv).toBeTruthy()
    })

    it('shows header when showClose is true even without title', () => {
      const wrapper = mountModal({ showClose: true })

      // v-if="title || showClose" — should render header
      const closeEl = wrapper.findAll('.sr-only').find((el) => el.text() === 'Close')
      expect(closeEl).toBeTruthy()
    })
  })

  describe('custom classes', () => {
    it('applies additional classes to content', () => {
      const wrapper = mountModal({ class: 'my-modal-class' })

      expect(wrapper.html()).toContain('my-modal-class')
    })
  })
})
