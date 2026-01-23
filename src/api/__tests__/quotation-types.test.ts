
import { describe, it, expectTypeOf } from 'vitest'
import type { CreateQuotationData, Quotation } from '../useQuotations'
import type { paths, components } from '../types'

// 1. Extract the "Real" types from the OpenAPI definition
type ApiQuotation = components['schemas']['QuotationResource']
type ApiCreatePayload = paths['/quotations']['post']['requestBody']['content']['application/json']

describe('Quotation Type Safety Net', () => {
  
  it('Manual "Quotation" type matches the API Resource exactly', () => {
    // This checks if the return type we use in the app matches the API response
    expectTypeOf<Quotation>().toEqualTypeOf<ApiQuotation>()
  })

  it('Manual "CreateQuotationData" matches the POST body exactly', () => {
    // This is the most critical check. 
    // If this fails, it means your current code might be sending wrong data
    // or missing required fields that the backend expects.
    expectTypeOf<CreateQuotationData>().toEqualTypeOf<ApiCreatePayload>()
  })

  // it('Manual "QuotationFilters" matches the GET query params', () => {
  //   expectTypeOf<QuotationFilters>().toEqualTypeOf<ApiFilters>()
  // })

})
