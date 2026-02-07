/**
 * StatusBadge Component Tests
 *
 * Tests the StatusBadge which delegates to Badge via the statusService.
 * We mock the statusService to control the returned label/variant.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../StatusBadge.vue'

// Mock the statusService
vi.mock('@/services/status', () => ({
  statusService: {
    getStatus: vi.fn(),
  },
}))

import { statusService } from '@/services/status'
const mockedGetStatus = vi.mocked(statusService.getStatus)

function mountStatusBadge(props: Record<string, unknown> = {}) {
  return mount(StatusBadge, {
    props: {
      documentType: 'invoice',
      status: 'draft',
      ...props,
    },
    global: {
      stubs: {
        Badge: {
          template: '<span :data-variant="variant"><slot /></span>',
          props: ['variant'],
        },
      },
    },
  })
}

beforeEach(() => {
  mockedGetStatus.mockReturnValue({
    label: 'Draft',
    variant: 'default',
  })
})

describe('StatusBadge', () => {
  describe('rendering', () => {
    it('renders status label from service', () => {
      mockedGetStatus.mockReturnValue({ label: 'Paid', variant: 'success' })

      const wrapper = mountStatusBadge({ status: 'paid' })

      expect(wrapper.text()).toBe('Paid')
    })

    it('passes variant to Badge', () => {
      mockedGetStatus.mockReturnValue({ label: 'Approved', variant: 'info' })

      const wrapper = mountStatusBadge({ status: 'approved' })

      expect(wrapper.find('span').attributes('data-variant')).toBe('info')
    })
  })

  describe('service integration', () => {
    it('calls getStatus with documentType and status', () => {
      mountStatusBadge({ documentType: 'quotation', status: 'sent' })

      expect(mockedGetStatus).toHaveBeenCalledWith('quotation', 'sent')
    })

    it('handles different document types', () => {
      mockedGetStatus.mockReturnValue({ label: 'Received', variant: 'success' })

      const wrapper = mountStatusBadge({ documentType: 'goods_receipt', status: 'received' })

      expect(mockedGetStatus).toHaveBeenCalledWith('goods_receipt', 'received')
      expect(wrapper.text()).toBe('Received')
    })

    it('renders destructive variant for cancelled status', () => {
      mockedGetStatus.mockReturnValue({ label: 'Cancelled', variant: 'destructive' })

      const wrapper = mountStatusBadge({ status: 'cancelled' })

      expect(wrapper.find('span').attributes('data-variant')).toBe('destructive')
      expect(wrapper.text()).toBe('Cancelled')
    })

    it('renders warning variant for pending status', () => {
      mockedGetStatus.mockReturnValue({ label: 'Pending', variant: 'warning' })

      const wrapper = mountStatusBadge({ status: 'pending' })

      expect(wrapper.find('span').attributes('data-variant')).toBe('warning')
    })
  })

  describe('reactivity', () => {
    it('updates when status prop changes', async () => {
      mockedGetStatus.mockReturnValue({ label: 'Draft', variant: 'default' })

      const wrapper = mountStatusBadge({ status: 'draft' })
      expect(wrapper.text()).toBe('Draft')

      mockedGetStatus.mockReturnValue({ label: 'Sent', variant: 'info' })
      await wrapper.setProps({ status: 'sent' })

      expect(wrapper.text()).toBe('Sent')
      expect(wrapper.find('span').attributes('data-variant')).toBe('info')
    })
  })
})
