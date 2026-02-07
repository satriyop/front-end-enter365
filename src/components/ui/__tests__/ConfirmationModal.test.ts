/**
 * ConfirmationModal Component Tests
 *
 * Tests variant→icon mapping, confirm/cancel flow, loading state, and button labels.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmationModal from '../ConfirmationModal.vue'

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(ConfirmationModal, {
    props: {
      open: true,
      ...props,
    },
    slots,
    global: {
      stubs: {
        // Stub Modal to render content inline (avoid Teleport)
        Modal: {
          template: '<div data-testid="modal"><slot /></div>',
          props: ['open', 'title'],
        },
      },
    },
  })
}

describe('ConfirmationModal', () => {
  describe('rendering', () => {
    it('renders message text', () => {
      const wrapper = mountModal({ message: 'Delete this item?' })

      expect(wrapper.text()).toContain('Delete this item?')
    })

    it('renders default message when not specified', () => {
      const wrapper = mountModal()

      expect(wrapper.text()).toContain('Are you sure you want to proceed?')
    })

    it('renders confirm and cancel buttons', () => {
      const wrapper = mountModal()

      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map((b) => b.text())
      expect(buttonTexts).toContain('Cancel')
      expect(buttonTexts).toContain('Confirm')
    })

    it('renders custom button labels', () => {
      const wrapper = mountModal({
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
      })

      expect(wrapper.text()).toContain('Delete')
      expect(wrapper.text()).toContain('Keep')
    })

    it('renders additional content via default slot', () => {
      const wrapper = mountModal({}, {
        default: '<p>Extra warning info</p>',
      })

      expect(wrapper.text()).toContain('Extra warning info')
    })
  })

  describe('variant → icon mapping', () => {
    it('does not show icon for default variant', () => {
      const wrapper = mountModal({ variant: 'default' })

      // v-if="showIcon && variant !== 'default'"
      const icon = wrapper.find('.h-6.w-6')
      expect(icon.exists()).toBe(false)
    })

    it('shows AlertTriangle icon for destructive variant', () => {
      const wrapper = mountModal({ variant: 'destructive' })

      const icon = wrapper.find('.h-6.w-6')
      expect(icon.exists()).toBe(true)
      expect(icon.html()).toContain('text-destructive')
    })

    it('shows AlertTriangle icon for warning variant', () => {
      const wrapper = mountModal({ variant: 'warning' })

      const icon = wrapper.find('.h-6.w-6')
      expect(icon.exists()).toBe(true)
      expect(icon.html()).toContain('text-warning')
    })

    it('shows Info icon for info variant', () => {
      const wrapper = mountModal({ variant: 'info' })

      const icon = wrapper.find('.h-6.w-6')
      expect(icon.exists()).toBe(true)
      expect(icon.html()).toContain('text-info')
    })

    it('hides icon when showIcon is false', () => {
      const wrapper = mountModal({ variant: 'destructive', showIcon: false })

      const icon = wrapper.find('.h-6.w-6')
      expect(icon.exists()).toBe(false)
    })
  })

  describe('confirm button variant', () => {
    it('uses default variant for default modal', () => {
      const wrapper = mountModal({ variant: 'default' })

      const buttons = wrapper.findAll('button')
      const confirmBtn = buttons.find((b) => b.text() === 'Confirm')
      // Default variant should use orange bg
      expect(confirmBtn?.html()).toContain('bg-orange')
    })

    it('uses destructive variant for destructive modal', () => {
      const wrapper = mountModal({ variant: 'destructive' })

      const buttons = wrapper.findAll('button')
      const confirmBtn = buttons.find((b) => b.text() === 'Confirm')
      expect(confirmBtn?.html()).toContain('bg-red')
    })
  })

  describe('events', () => {
    it('emits confirm on confirm button click', async () => {
      const wrapper = mountModal()

      const buttons = wrapper.findAll('button')
      const confirmBtn = buttons.find((b) => b.text() === 'Confirm')
      await confirmBtn!.trigger('click')

      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('emits cancel and update:open on cancel button click', async () => {
      const wrapper = mountModal()

      const buttons = wrapper.findAll('button')
      const cancelBtn = buttons.find((b) => b.text() === 'Cancel')
      await cancelBtn!.trigger('click')

      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    })
  })

  describe('loading state', () => {
    it('shows spinner on confirm button when loading', () => {
      const wrapper = mountModal({ isLoading: true })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('disables both buttons when loading', () => {
      const wrapper = mountModal({ isLoading: true })

      const buttons = wrapper.findAll('button')
      buttons.forEach((btn) => {
        expect(btn.attributes('disabled')).toBeDefined()
      })
    })

    it('does not show spinner when not loading', () => {
      const wrapper = mountModal({ isLoading: false })

      expect(wrapper.find('.animate-spin').exists()).toBe(false)
    })
  })
})
