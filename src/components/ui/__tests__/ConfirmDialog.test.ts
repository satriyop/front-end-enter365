/**
 * ConfirmDialog Component Tests
 *
 * Tests the promise-based confirmation dialog that uses defineExpose({ open }).
 * Unlike ConfirmationModal (prop-driven), this component manages its own state
 * and resolves a promise on confirm/cancel.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../ConfirmDialog.vue'

function mountConfirmDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props,
    global: {
      stubs: {
        Modal: {
          template: '<div v-if="open" data-testid="modal"><slot /><div data-testid="footer"><slot name="footer" /></div></div>',
          props: ['open', 'title', 'size', 'closeOnBackdrop', 'closeOnEscape', 'showClose'],
          emits: ['update:open'],
        },
        Button: {
          template: '<button :disabled="disabled" :class="{ loading }" @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['variant', 'loading', 'disabled'],
          emits: ['click'],
        },
      },
    },
  })
}

describe('ConfirmDialog', () => {
  describe('initial state', () => {
    it('is not visible initially', () => {
      const wrapper = mountConfirmDialog()

      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })
  })

  describe('open()', () => {
    it('becomes visible when open() is called', async () => {
      const wrapper = mountConfirmDialog()

      // Call exposed open() method — don't await the promise yet
      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    })

    it('shows default title and message', async () => {
      const wrapper = mountConfirmDialog()

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Are you sure you want to proceed?')
    })

    it('shows custom title and message', async () => {
      const wrapper = mountConfirmDialog({
        title: 'Delete Item',
        message: 'This action cannot be undone.',
      })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('This action cannot be undone.')
    })

    it('returns a promise', () => {
      const wrapper = mountConfirmDialog()

      const result = wrapper.vm.open()

      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('confirm flow', () => {
    it('resolves promise with true on confirm', async () => {
      const wrapper = mountConfirmDialog()

      const promise = wrapper.vm.open()
      await wrapper.vm.$nextTick()

      // Find and click confirm button
      const buttons = wrapper.findAll('button')
      const confirmBtn = buttons.find((b) => b.text() === 'Confirm')
      await confirmBtn!.trigger('click')

      const result = await promise
      expect(result).toBe(true)
    })

    it('closes modal after confirm', async () => {
      const wrapper = mountConfirmDialog()

      const promise = wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const confirmBtn = buttons.find((b) => b.text() === 'Confirm')
      await confirmBtn!.trigger('click')
      await promise

      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })
  })

  describe('cancel flow', () => {
    it('resolves promise with false on cancel', async () => {
      const wrapper = mountConfirmDialog()

      const promise = wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const cancelBtn = buttons.find((b) => b.text() === 'Cancel')
      await cancelBtn!.trigger('click')

      const result = await promise
      expect(result).toBe(false)
    })

    it('closes modal after cancel', async () => {
      const wrapper = mountConfirmDialog()

      const promise = wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      const cancelBtn = buttons.find((b) => b.text() === 'Cancel')
      await cancelBtn!.trigger('click')
      await promise

      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
    })
  })

  describe('custom button text', () => {
    it('renders custom confirm text', async () => {
      const wrapper = mountConfirmDialog({ confirmText: 'Delete' })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      expect(buttons.some((b) => b.text() === 'Delete')).toBe(true)
    })

    it('renders custom cancel text', async () => {
      const wrapper = mountConfirmDialog({ cancelText: 'Go Back' })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const buttons = wrapper.findAll('button')
      expect(buttons.some((b) => b.text() === 'Go Back')).toBe(true)
    })
  })

  describe('variants', () => {
    it('shows destructive variant icon', async () => {
      const wrapper = mountConfirmDialog({ variant: 'destructive' })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-red-100')
    })

    it('shows warning variant icon', async () => {
      const wrapper = mountConfirmDialog({ variant: 'warning' })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-amber-100')
    })

    it('shows info variant icon', async () => {
      const wrapper = mountConfirmDialog({ variant: 'info' })

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-blue-100')
    })

    it('defaults to destructive variant', async () => {
      const wrapper = mountConfirmDialog()

      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toContain('bg-red-100')
    })
  })

  describe('re-open after close', () => {
    it('can be opened multiple times', async () => {
      const wrapper = mountConfirmDialog()

      // First open + cancel
      const promise1 = wrapper.vm.open()
      await wrapper.vm.$nextTick()

      const cancelBtn1 = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
      await cancelBtn1!.trigger('click')
      await promise1

      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)

      // Second open
      wrapper.vm.open()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    })
  })
})
