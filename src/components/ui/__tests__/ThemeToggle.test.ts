/**
 * ThemeToggle Component Tests
 *
 * Mocks the useDarkMode composable to isolate the component from
 * singleton state and localStorage side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ThemeToggle from '../ThemeToggle.vue'

// Mock useDarkMode composable
const mockIsDark = ref(false)
const mockTheme = ref<'light' | 'dark' | 'system'>('light')
const mockToggle = vi.fn()

vi.mock('@/composables/useDarkMode', () => ({
  useDarkMode: () => ({
    isDark: mockIsDark,
    theme: mockTheme,
    toggle: mockToggle,
  }),
}))

function mountThemeToggle(props: Record<string, unknown> = {}) {
  return mount(ThemeToggle, { props })
}

beforeEach(() => {
  mockIsDark.value = false
  mockTheme.value = 'light'
  mockToggle.mockClear()
})

describe('ThemeToggle', () => {
  describe('simple toggle (default)', () => {
    it('renders a toggle button', () => {
      const wrapper = mountThemeToggle()

      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('has "Toggle dark mode" title', () => {
      const wrapper = mountThemeToggle()

      expect(wrapper.find('button').attributes('title')).toBe('Toggle dark mode')
    })

    it('shows moon icon in light mode', () => {
      mockIsDark.value = false
      const wrapper = mountThemeToggle()

      // Moon icon is the v-else branch (shown when NOT dark)
      const svgs = wrapper.findAll('svg')
      expect(svgs).toHaveLength(1)
    })

    it('shows sun icon in dark mode', () => {
      mockIsDark.value = true
      const wrapper = mountThemeToggle()

      const svgs = wrapper.findAll('svg')
      expect(svgs).toHaveLength(1)
    })

    it('calls toggle on click', async () => {
      const wrapper = mountThemeToggle()

      await wrapper.find('button').trigger('click')

      expect(mockToggle).toHaveBeenCalledOnce()
    })
  })

  describe('sizes', () => {
    it('applies md size by default', () => {
      const wrapper = mountThemeToggle()

      const button = wrapper.find('button')
      expect(button.classes()).toContain('w-9')
      expect(button.classes()).toContain('h-9')
    })

    it('applies sm size', () => {
      const wrapper = mountThemeToggle({ size: 'sm' })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('w-7')
      expect(button.classes()).toContain('h-7')
    })

    it('applies md icon size', () => {
      const wrapper = mountThemeToggle({ size: 'md' })

      const icon = wrapper.find('svg')
      expect(icon.classes()).toContain('w-5')
      expect(icon.classes()).toContain('h-5')
    })

    it('applies sm icon size', () => {
      const wrapper = mountThemeToggle({ size: 'sm' })

      const icon = wrapper.find('svg')
      expect(icon.classes()).toContain('w-4')
      expect(icon.classes()).toContain('h-4')
    })
  })

  describe('system option indicator', () => {
    it('does not show system indicator by default', () => {
      mockTheme.value = 'system'
      const wrapper = mountThemeToggle()

      // Simple toggle doesn't show the indicator dot
      expect(wrapper.find('.bg-primary-500').exists()).toBe(false)
    })

    it('shows system indicator dot when showSystemOption + system theme', () => {
      mockTheme.value = 'system'
      const wrapper = mountThemeToggle({ showSystemOption: true })

      expect(wrapper.find('.bg-primary-500.rounded-full').exists()).toBe(true)
    })

    it('hides system indicator when theme is not system', () => {
      mockTheme.value = 'dark'
      const wrapper = mountThemeToggle({ showSystemOption: true })

      expect(wrapper.find('.bg-primary-500').exists()).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('switches icon when isDark changes', async () => {
      mockIsDark.value = false
      const wrapper = mountThemeToggle()

      // Get initial icon path
      const initialPath = wrapper.find('svg path').attributes('d')

      // Switch to dark
      mockIsDark.value = true
      await wrapper.vm.$nextTick()

      const darkPath = wrapper.find('svg path').attributes('d')
      expect(darkPath).not.toBe(initialPath)
    })
  })
})
