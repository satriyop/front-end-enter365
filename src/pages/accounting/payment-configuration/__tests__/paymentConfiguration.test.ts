import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PaymentConfigurationPage from '../PaymentConfigurationPage.vue'
import { api } from '@/api/client'
import { newPaymentConfiguration, paymentMasterTitles, type PaymentMasterKind } from '@/api/paymentConfiguration'

const permissions = vi.hoisted(() => ({ edit: true }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ hasPermission: (p: string) => p === 'journals.view' || permissions.edit }) }))
vi.mock('@/api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() }, getErrorMessage: (e: Error) => e.message }))
const list = (data: unknown[]) => ({ data: { data, meta: { current_page: 1, last_page: 1, total: data.length, per_page: 50 } } })
const kinds = Object.keys(paymentMasterTitles) as PaymentMasterKind[]
const render = (kind: PaymentMasterKind) => mount(PaymentConfigurationPage, { props: { kind } })

beforeEach(() => {
  permissions.edit = true
  vi.mocked(api.get).mockImplementation(async (url) => url === '/journals'
    ? { data: { data: [{ id: 1, name: 'Bank', type: 'bank' }, { id: 2, name: 'Sales', type: 'sales' }] } }
    : list([]))
})
describe('payment configuration journeys', () => {
  it.each(kinds)('creates and reloads %s', async (kind) => {
    const wrapper = render(kind)
    await flushPromises()
    expect(wrapper.text()).toContain(paymentMasterTitles[kind])
    await wrapper.get('[data-testid="config-new"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="config-code"]').setValue('TEST')
    await wrapper.get('[data-testid="config-name"]').setValue('Test configuration')
    const record = { ...newPaymentConfiguration(kind), id: 1, code: 'TEST', name: 'Test configuration' }
    if (kind === 'checks') {
      await wrapper.get('[data-testid="config-journal"]').setValue('1')
      record.journal_id = 1
    }
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: record } })
    vi.mocked(api.get).mockResolvedValueOnce(list([record]))
    await wrapper.get('[data-testid="config-save"]').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith(`/${kind}`, expect.objectContaining({ code: 'TEST', name: 'Test configuration' }))
    expect(wrapper.text()).toContain('Configuration saved.')
    expect(wrapper.find('tbody').text()).toContain('TEST')
    wrapper.unmount()
  })
  it('adds installments and previews only saved schedules', async () => {
    const record = { ...newPaymentConfiguration('payment-terms'), id: 2, code: 'NET30', name: 'Net 30' }
    vi.mocked(api.get).mockResolvedValueOnce(list([record]))
    const wrapper = render('payment-terms')
    await flushPromises()
    await wrapper.get('tbody button').trigger('click')
    await wrapper.get('[data-testid="add-installment"]').trigger('click')
    expect(wrapper.text()).toContain('Save your changes before previewing')
    expect(wrapper.get('[data-testid="preview-schedule"]').attributes('disabled')).toBeDefined()
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: { ...record, lines: [{ type: 'percent', value: 30, days: 0, due_type: 'days_after' }, ...record.lines!] } } })
    await wrapper.get('[data-testid="config-save"]').trigger('submit')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/payment-terms/2', expect.objectContaining({ lines: expect.arrayContaining([expect.objectContaining({ type: 'percent', value: 30 })]) }))
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: [{ due_date: '2028-01-31', amount: 30000 }, { due_date: '2028-03-01', amount: 70000 }] } })
    await wrapper.get('[data-testid="preview-schedule"]').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/payment-terms/2/preview', expect.objectContaining({ amount: 100000 }))
    expect(wrapper.text()).toContain('2028-03-01')
    wrapper.unmount()
  })
  it('keeps rejected edits and shows the server validation error', async () => {
    const wrapper = render('payment-methods')
    await flushPromises()
    await wrapper.get('[data-testid="config-new"]').trigger('click')
    await wrapper.get('[data-testid="config-code"]').setValue('DUP')
    vi.mocked(api.post).mockRejectedValueOnce(new Error('This code is already in use.'))
    await wrapper.get('[data-testid="config-save"]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('already in use')
    expect((wrapper.get('[data-testid="config-code"]').element as HTMLInputElement).value).toBe('DUP')
    wrapper.unmount()
  })
  it('supports read-only access and route changes without stale records', async () => {
    permissions.edit = false
    vi.mocked(api.get).mockResolvedValueOnce(list([{ ...newPaymentConfiguration('checks'), id: 1, name: 'Bank checks' }]))
    const wrapper = render('checks')
    await flushPromises()
    expect(wrapper.find('[data-testid="config-new"]').exists()).toBe(false)
    await wrapper.get('tbody button').trigger('click')
    expect(wrapper.find('[data-testid="config-save"]').exists()).toBe(false)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ kind: 'payment-terms' })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Bank checks')
    expect(wrapper.find('fieldset').exists()).toBe(false)
    wrapper.unmount()
  })
  it('renders load errors and retries', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Service unavailable'))
    const wrapper = render('payment-providers')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Service unavailable')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('No configuration found.')
    wrapper.unmount()
  })
})
