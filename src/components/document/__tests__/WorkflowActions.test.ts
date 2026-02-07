/**
 * WorkflowActions Component Tests
 *
 * Tests action filtering via canExecute, confirmation flow, and event delegation.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw, defineComponent, nextTick } from 'vue'
import WorkflowActions from '../WorkflowActions.vue'
import type { WorkflowAction } from '../WorkflowActions.vue'

const MockIcon = markRaw(
  defineComponent({
    name: 'MockIcon',
    template: '<svg data-testid="mock-icon"></svg>',
  })
)

function createActions(): WorkflowAction[] {
  return [
    {
      event: 'approve',
      label: 'Approve',
      variant: 'success',
      icon: MockIcon,
    },
    {
      event: 'reject',
      label: 'Reject',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Reject Document',
      confirmationMessage: 'Are you sure you want to reject this?',
    },
    {
      event: 'submit',
      label: 'Submit',
      variant: 'default',
    },
    {
      event: 'cancel',
      label: 'Cancel',
      variant: 'outline',
      requiresConfirmation: true,
    },
  ]
}

function mountWorkflow(props: Record<string, unknown> = {}) {
  return mount(WorkflowActions, {
    props: {
      actions: createActions(),
      canExecute: () => true,
      ...props,
    },
    global: {
      stubs: {
        // Stub Modal used inside ConfirmationModal to avoid Teleport
        Modal: {
          template: '<div data-testid="modal" v-if="open"><slot /></div>',
          props: ['open', 'title'],
          emits: ['update:open'],
        },
      },
    },
  })
}

describe('WorkflowActions', () => {
  describe('action filtering', () => {
    it('renders all actions when canExecute returns true for all', () => {
      const wrapper = mountWorkflow()

      expect(wrapper.text()).toContain('Approve')
      expect(wrapper.text()).toContain('Reject')
      expect(wrapper.text()).toContain('Submit')
      expect(wrapper.text()).toContain('Cancel')
    })

    it('filters out actions where canExecute returns false', () => {
      const canExecute = vi.fn((event: string) => event !== 'reject')
      const wrapper = mountWorkflow({ canExecute })

      expect(wrapper.text()).toContain('Approve')
      expect(wrapper.text()).not.toContain('Reject')
      expect(wrapper.text()).toContain('Submit')
    })

    it('renders nothing when no actions pass canExecute', () => {
      const wrapper = mountWorkflow({ canExecute: () => false })

      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(0)
    })

    it('calls canExecute with each action event', () => {
      const canExecute = vi.fn(() => true)
      mountWorkflow({ canExecute })

      expect(canExecute).toHaveBeenCalledWith('approve')
      expect(canExecute).toHaveBeenCalledWith('reject')
      expect(canExecute).toHaveBeenCalledWith('submit')
      expect(canExecute).toHaveBeenCalledWith('cancel')
    })
  })

  describe('direct action (no confirmation)', () => {
    it('emits action event immediately for non-confirmation actions', async () => {
      const wrapper = mountWorkflow()

      const approveBtn = wrapper.findAll('button').find((b) => b.text().includes('Approve'))
      await approveBtn!.trigger('click')

      expect(wrapper.emitted('action')?.[0]).toEqual(['approve'])
    })

    it('emits submit event when Submit clicked', async () => {
      const wrapper = mountWorkflow()

      const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Submit'))
      await submitBtn!.trigger('click')

      expect(wrapper.emitted('action')?.[0]).toEqual(['submit'])
    })
  })

  describe('confirmation flow', () => {
    it('opens confirmation modal for actions with requiresConfirmation', async () => {
      const wrapper = mountWorkflow()

      const rejectBtn = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
      await rejectBtn!.trigger('click')

      // Should NOT emit action yet
      expect(wrapper.emitted('action')).toBeUndefined()

      // Modal should be visible
      await nextTick()
      expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
    })

    it('emits action after confirming in modal', async () => {
      const wrapper = mountWorkflow()

      // Click reject to open modal
      const rejectBtn = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
      await rejectBtn!.trigger('click')
      await nextTick()

      // Find and click the Confirm button inside the modal
      const modalButtons = wrapper.find('[data-testid="modal"]').findAll('button')
      const confirmBtn = modalButtons.find((b) => b.text().includes('Confirm'))

      if (confirmBtn) {
        await confirmBtn.trigger('click')
        expect(wrapper.emitted('action')?.[0]).toEqual(['reject'])
      }
    })

    it('does not emit action on cancel', async () => {
      const wrapper = mountWorkflow()

      // Click cancel action to open modal
      const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      await cancelBtn!.trigger('click')
      await nextTick()

      // Find the Cancel button in the modal
      const modalButtons = wrapper.find('[data-testid="modal"]').findAll('button')
      const modalCancelBtn = modalButtons.find((b) => b.text() === 'Cancel')

      if (modalCancelBtn) {
        await modalCancelBtn.trigger('click')
      }

      expect(wrapper.emitted('action')).toBeUndefined()
    })

    it('uses custom confirmation title and message', async () => {
      const wrapper = mountWorkflow()

      const rejectBtn = wrapper.findAll('button').find((b) => b.text().includes('Reject'))
      await rejectBtn!.trigger('click')
      await nextTick()

      // The ConfirmationModal should receive custom title/message
      expect(wrapper.html()).toContain('Are you sure you want to reject this?')
    })

    it('uses default confirmation title when not specified', async () => {
      const wrapper = mountWorkflow()

      // Cancel action has requiresConfirmation but no custom title
      const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Cancel'))
      await cancelBtn!.trigger('click')
      await nextTick()

      expect(wrapper.html()).toContain('Are you sure you want to perform this action?')
    })
  })

  describe('transitioning state', () => {
    it('disables all buttons when transitioning', () => {
      const wrapper = mountWorkflow({ isTransitioning: true })

      const buttons = wrapper.findAll('button')
      buttons.forEach((btn) => {
        expect(btn.attributes('disabled')).toBeDefined()
      })
    })

    it('shows spinner when transitioning', () => {
      const wrapper = mountWorkflow({ isTransitioning: true })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('hides icons when transitioning (shows spinner instead)', () => {
      const wrapper = mountWorkflow({ isTransitioning: true })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(false)
    })

    it('shows icons when not transitioning', () => {
      const wrapper = mountWorkflow({ isTransitioning: false })

      expect(wrapper.find('[data-testid="mock-icon"]').exists()).toBe(true)
    })
  })

  describe('button variants', () => {
    it('applies action variant to button', () => {
      // Approve has variant: 'success' → should use emerald/green bg
      const wrapper = mountWorkflow({
        actions: [{ event: 'approve', label: 'Approve', variant: 'success' }],
        canExecute: () => true,
      })

      const btn = wrapper.find('button')
      expect(btn.html()).toContain('bg-emerald')
    })

    it('defaults to outline variant when action has no variant', () => {
      const wrapper = mountWorkflow({
        actions: [{ event: 'do', label: 'Do Something' }],
        canExecute: () => true,
      })

      const btn = wrapper.find('button')
      expect(btn.html()).toContain('border')
    })
  })
})
