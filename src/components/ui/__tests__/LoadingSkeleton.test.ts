/**
 * LoadingSkeleton Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSkeleton from '../LoadingSkeleton.vue'

function mountSkeleton(props: Record<string, unknown> = {}) {
  return mount(LoadingSkeleton, { props })
}

describe('LoadingSkeleton', () => {
  describe('variants', () => {
    it('renders text variant with rounded class (default)', () => {
      const wrapper = mountSkeleton()

      expect(wrapper.html()).toContain('rounded')
      expect(wrapper.html()).toContain('h-4')
    })

    it('renders circular variant with rounded-full', () => {
      const wrapper = mountSkeleton({ variant: 'circular' })

      expect(wrapper.html()).toContain('rounded-full')
    })

    it('renders rounded variant with rounded-lg', () => {
      const wrapper = mountSkeleton({ variant: 'rounded' })

      expect(wrapper.html()).toContain('rounded-lg')
    })

    it('renders rectangular variant without border-radius', () => {
      const wrapper = mountSkeleton({ variant: 'rectangular' })
      const html = wrapper.html()

      // rectangular has no extra rounding class
      expect(html).not.toContain('rounded-full')
      expect(html).not.toContain('rounded-lg')
    })
  })

  describe('animation', () => {
    it('applies animate-pulse by default', () => {
      const wrapper = mountSkeleton()

      expect(wrapper.html()).toContain('animate-pulse')
    })

    it('removes animate-pulse when animated is false', () => {
      const wrapper = mountSkeleton({ animated: false })

      expect(wrapper.html()).not.toContain('animate-pulse')
    })
  })

  describe('dimensions', () => {
    it('defaults to 100% width for text variant', () => {
      const wrapper = mountSkeleton()

      const el = wrapper.find('div')
      expect(el.attributes('style')).toContain('width: 100%')
    })

    it('applies custom width', () => {
      const wrapper = mountSkeleton({ width: '200px' })

      expect(wrapper.find('div').attributes('style')).toContain('width: 200px')
    })

    it('applies custom height', () => {
      const wrapper = mountSkeleton({ height: '50px' })

      expect(wrapper.find('div').attributes('style')).toContain('height: 50px')
    })

    it('uses 40px x 40px for circular variant by default', () => {
      const wrapper = mountSkeleton({ variant: 'circular' })

      const style = wrapper.find('div').attributes('style')!
      expect(style).toContain('width: 40px')
      expect(style).toContain('height: 40px')
    })

    it('uses 100px height for rectangular variant by default', () => {
      const wrapper = mountSkeleton({ variant: 'rectangular' })

      expect(wrapper.find('div').attributes('style')).toContain('height: 100px')
    })

    it('uses 100px height for rounded variant by default', () => {
      const wrapper = mountSkeleton({ variant: 'rounded' })

      expect(wrapper.find('div').attributes('style')).toContain('height: 100px')
    })
  })

  describe('multi-line text', () => {
    it('renders multiple lines when lines > 1', () => {
      const wrapper = mountSkeleton({ lines: 3 })

      const lines = wrapper.findAll('.space-y-2 > div')
      expect(lines).toHaveLength(3)
    })

    it('last line is 60% width', () => {
      const wrapper = mountSkeleton({ lines: 3 })

      const lines = wrapper.findAll('.space-y-2 > div')
      const lastLine = lines[2]
      expect(lastLine.attributes('style')).toContain('width: 60%')
    })

    it('non-last lines have width between 85% and 100%', () => {
      const wrapper = mountSkeleton({ lines: 4 })

      const lines = wrapper.findAll('.space-y-2 > div')
      // Check first 3 lines (not the last one)
      for (let i = 0; i < 3; i++) {
        const style = lines[i].attributes('style')!
        const widthMatch = style.match(/width:\s*([\d.]+)%/)
        expect(widthMatch).toBeTruthy()
        const width = parseFloat(widthMatch![1])
        expect(width).toBeGreaterThanOrEqual(85)
        expect(width).toBeLessThanOrEqual(100)
      }
    })

    it('single line does not use space-y-2 wrapper', () => {
      const wrapper = mountSkeleton({ lines: 1 })

      expect(wrapper.find('.space-y-2').exists()).toBe(false)
    })

    it('multi-line only applies to text variant', () => {
      // Even with lines > 1, circular variant renders single element
      const wrapper = mountSkeleton({ variant: 'circular', lines: 3 })

      expect(wrapper.find('.space-y-2').exists()).toBe(false)
    })
  })

  describe('base styling', () => {
    it('applies skeleton background color', () => {
      const wrapper = mountSkeleton()

      expect(wrapper.html()).toContain('bg-slate-200')
    })
  })
})
