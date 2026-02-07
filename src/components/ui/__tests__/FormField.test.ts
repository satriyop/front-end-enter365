/**
 * FormField Component Tests
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '../FormField.vue'

function mountFormField(props: Record<string, unknown> = {}, slotContent = '<input />') {
  return mount(FormField, {
    props,
    slots: { default: slotContent },
  })
}

describe('FormField', () => {
  describe('label', () => {
    it('renders label when provided', () => {
      const wrapper = mountFormField({ label: 'Email' })

      expect(wrapper.find('label').text()).toContain('Email')
    })

    it('does not render label when not provided', () => {
      const wrapper = mountFormField()

      expect(wrapper.find('label').exists()).toBe(false)
    })

    it('sets for attribute on label', () => {
      const wrapper = mountFormField({ label: 'Email', for: 'email-input' })

      expect(wrapper.find('label').attributes('for')).toBe('email-input')
    })
  })

  describe('required indicator', () => {
    it('shows asterisk when required', () => {
      const wrapper = mountFormField({ label: 'Name', required: true })

      expect(wrapper.find('label').text()).toContain('*')
      expect(wrapper.find('label span').html()).toContain('text-red-500')
    })

    it('does not show asterisk when not required', () => {
      const wrapper = mountFormField({ label: 'Name', required: false })

      expect(wrapper.find('label').text()).not.toContain('*')
    })
  })

  describe('error message', () => {
    it('shows error message', () => {
      const wrapper = mountFormField({ error: 'This field is required' })

      const errorEl = wrapper.find('[role="alert"]')
      expect(errorEl.exists()).toBe(true)
      expect(errorEl.text()).toBe('This field is required')
    })

    it('applies error text styling', () => {
      const wrapper = mountFormField({ error: 'Error' })

      expect(wrapper.find('[role="alert"]').html()).toContain('text-red-600')
    })

    it('does not show error element when no error', () => {
      const wrapper = mountFormField()

      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  describe('hint text', () => {
    it('shows hint when provided', () => {
      const wrapper = mountFormField({ hint: 'Enter your email address' })

      const hint = wrapper.findAll('p').find((p) => p.text() === 'Enter your email address')
      expect(hint).toBeTruthy()
    })

    it('applies hint styling', () => {
      const wrapper = mountFormField({ hint: 'A hint' })

      const hint = wrapper.findAll('p').find((p) => p.text() === 'A hint')
      expect(hint?.html()).toContain('text-slate-500')
    })

    it('error takes priority over hint', () => {
      const wrapper = mountFormField({
        error: 'Required',
        hint: 'Enter value',
      })

      // Error should show, hint should not (v-else-if)
      expect(wrapper.text()).toContain('Required')
      expect(wrapper.text()).not.toContain('Enter value')
    })
  })

  describe('slot', () => {
    it('renders slot content', () => {
      const wrapper = mountFormField({}, '<input data-testid="my-input" />')

      expect(wrapper.find('[data-testid="my-input"]').exists()).toBe(true)
    })

    it('passes error state to scoped slot', () => {
      const wrapper = mount(FormField, {
        props: { error: 'Error!' },
        slots: {
          default: `<template #default="{ error }">
            <span data-testid="error-flag">{{ error }}</span>
          </template>`,
        },
      })

      expect(wrapper.find('[data-testid="error-flag"]').text()).toBe('true')
    })

    it('passes false error state when no error', () => {
      const wrapper = mount(FormField, {
        props: {},
        slots: {
          default: `<template #default="{ error }">
            <span data-testid="error-flag">{{ error }}</span>
          </template>`,
        },
      })

      expect(wrapper.find('[data-testid="error-flag"]').text()).toBe('false')
    })
  })
})
