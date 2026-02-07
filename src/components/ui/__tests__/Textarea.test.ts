/**
 * Textarea Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Textarea from '../Textarea.vue'

function mountTextarea(props: Record<string, unknown> = {}) {
  return mount(Textarea, { props })
}

describe('Textarea', () => {
  describe('rendering', () => {
    it('renders a textarea element', () => {
      const wrapper = mountTextarea()

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('renders with default 4 rows', () => {
      const wrapper = mountTextarea()

      expect(wrapper.find('textarea').attributes('rows')).toBe('4')
    })

    it('renders with custom rows', () => {
      const wrapper = mountTextarea({ rows: 8 })

      expect(wrapper.find('textarea').attributes('rows')).toBe('8')
    })

    it('renders with modelValue', () => {
      const wrapper = mountTextarea({ modelValue: 'Hello world' })

      expect(wrapper.find('textarea').element.value).toBe('Hello world')
    })
  })

  describe('v-model', () => {
    it('emits update:modelValue on input', async () => {
      const wrapper = mountTextarea()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('new text')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted![emitted!.length - 1][0]).toBe('new text')
    })
  })

  describe('error state', () => {
    it('applies red border when error is true', () => {
      const wrapper = mountTextarea({ error: true })

      expect(wrapper.find('textarea').html()).toContain('border-red-500')
    })

    it('applies default border when no error', () => {
      const wrapper = mountTextarea({ error: false })

      expect(wrapper.find('textarea').html()).toContain('border-slate-300')
    })
  })

  describe('disabled state', () => {
    it('sets disabled attribute', () => {
      const wrapper = mountTextarea({ disabled: true })

      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    })

    it('applies disabled styling', () => {
      const wrapper = mountTextarea({ disabled: true })

      expect(wrapper.find('textarea').html()).toContain('cursor-not-allowed')
    })
  })

  describe('character counter', () => {
    it('hides counter by default', () => {
      const wrapper = mountTextarea({ modelValue: 'hello' })

      expect(wrapper.find('p').exists()).toBe(false)
    })

    it('shows character count when showCount is true', () => {
      const wrapper = mountTextarea({ showCount: true, modelValue: 'hello' })

      expect(wrapper.find('p').text()).toBe('5 characters')
    })

    it('shows count with maxLength format', () => {
      const wrapper = mountTextarea({ showCount: true, maxLength: 100, modelValue: 'hello' })

      expect(wrapper.find('p').text()).toBe('5/100')
    })

    it('shows 0 characters for empty value', () => {
      const wrapper = mountTextarea({ showCount: true, modelValue: '' })

      expect(wrapper.find('p').text()).toBe('0 characters')
    })

    it('applies red text at maxLength', () => {
      const wrapper = mountTextarea({
        showCount: true,
        maxLength: 5,
        modelValue: 'hello',
      })

      expect(wrapper.find('p').html()).toContain('text-red-500')
    })

    it('applies normal text below maxLength', () => {
      const wrapper = mountTextarea({
        showCount: true,
        maxLength: 100,
        modelValue: 'hello',
      })

      expect(wrapper.find('p').html()).toContain('text-slate-500')
      expect(wrapper.find('p').html()).not.toContain('text-red-500')
    })
  })

  describe('maxLength', () => {
    it('sets maxlength attribute on textarea', () => {
      const wrapper = mountTextarea({ maxLength: 200 })

      expect(wrapper.find('textarea').attributes('maxlength')).toBe('200')
    })
  })
})
