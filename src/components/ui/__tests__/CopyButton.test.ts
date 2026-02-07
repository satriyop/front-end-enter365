/**
 * CopyButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CopyButton from '../CopyButton.vue'

// Mock useClipboard composable
const mockCopy = vi.fn().mockResolvedValue(true)
const mockCopied = ref(false)

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({
    copy: mockCopy,
    copied: mockCopied,
    isSupported: ref(true),
  }),
}))

function mountCopyButton(props: Record<string, unknown> = {}) {
  return mount(CopyButton, {
    props: {
      text: 'Hello World',
      ...props,
    },
    global: {
      stubs: {
        Button: {
          template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['variant', 'size', 'type'],
          emits: ['click'],
        },
      },
    },
  })
}

beforeEach(() => {
  mockCopy.mockClear()
  mockCopied.value = false
})

describe('CopyButton', () => {
  describe('icon variant (default)', () => {
    it('renders as a plain button with title', () => {
      const wrapper = mountCopyButton()

      const button = wrapper.find('button[title="Copy to clipboard"]')
      expect(button.exists()).toBe(true)
    })

    it('shows copy icon by default', () => {
      const wrapper = mountCopyButton()

      // Copy icon SVG exists
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('calls copy with text when clicked', async () => {
      const wrapper = mountCopyButton({ text: 'test-value' })

      await wrapper.find('button').trigger('click')

      expect(mockCopy).toHaveBeenCalledWith('test-value', true)
    })

    it('shows check icon when copied', async () => {
      mockCopied.value = true
      const wrapper = mountCopyButton()

      // Check mark icon has text-green-500
      const checkIcon = wrapper.findAll('svg').find((s) => s.classes().includes('text-green-500'))
      expect(checkIcon).toBeTruthy()
    })
  })

  describe('button variant', () => {
    it('renders with Button component and label', () => {
      const wrapper = mountCopyButton({ variant: 'button' })

      expect(wrapper.text()).toContain('Copy')
    })

    it('renders custom label', () => {
      const wrapper = mountCopyButton({ variant: 'button', label: 'Copy Link' })

      expect(wrapper.text()).toContain('Copy Link')
    })

    it('shows "Copied!" text when copied', async () => {
      mockCopied.value = true
      const wrapper = mountCopyButton({ variant: 'button' })

      expect(wrapper.text()).toContain('Copied!')
    })

    it('calls copy with text on click', async () => {
      const wrapper = mountCopyButton({ variant: 'button', text: 'https://example.com' })

      await wrapper.find('button').trigger('click')

      expect(mockCopy).toHaveBeenCalledWith('https://example.com', true)
    })

    it('passes showToast=false when configured', async () => {
      const wrapper = mountCopyButton({ variant: 'button', showToast: false })

      await wrapper.find('button').trigger('click')

      expect(mockCopy).toHaveBeenCalledWith('Hello World', false)
    })
  })

  describe('sizes', () => {
    it('applies xs size classes in icon variant', () => {
      const wrapper = mountCopyButton({ size: 'xs' })

      expect(wrapper.find('button').classes()).toContain('w-6')
      expect(wrapper.find('button').classes()).toContain('h-6')
    })

    it('applies sm size classes in icon variant (default)', () => {
      const wrapper = mountCopyButton()

      expect(wrapper.find('button').classes()).toContain('w-7')
      expect(wrapper.find('button').classes()).toContain('h-7')
    })

    it('applies default size classes in icon variant', () => {
      const wrapper = mountCopyButton({ size: 'default' })

      expect(wrapper.find('button').classes()).toContain('w-8')
      expect(wrapper.find('button').classes()).toContain('h-8')
    })

    it('applies xs icon size', () => {
      const wrapper = mountCopyButton({ size: 'xs' })

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('w-3.5')
      expect(svg.classes()).toContain('h-3.5')
    })
  })
})
