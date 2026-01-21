/**
 * Pricing Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PricingService } from '../PricingService'
import { StandardPricingStrategy } from '../strategies/StandardPricingStrategy'
import { VolumeDiscountStrategy } from '../strategies/VolumeDiscountStrategy'
import { ContractPricingStrategy } from '../strategies/ContractPricingStrategy'
import type { PricingContext } from '../types'

describe('PricingService', () => {
  let service: PricingService

  beforeEach(() => {
    service = new PricingService()
  })

  describe('strategy registration', () => {
    it('should register strategies', () => {
      service.addStrategy(new StandardPricingStrategy())
      expect(service.getStrategies()).toHaveLength(1)
    })

    it('should sort strategies by priority', () => {
      service.addStrategy(new StandardPricingStrategy()) // priority 100
      service.addStrategy(new VolumeDiscountStrategy([{ minQuantity: 10, discountPercent: 5 }])) // priority 20

      const strategies = service.getStrategies()
      expect(strategies).toHaveLength(2)
      expect(strategies[0]!.priority).toBeLessThan(strategies[1]!.priority)
    })

    it('should remove strategy by name', () => {
      service.addStrategy(new StandardPricingStrategy())
      service.removeStrategy('Standard')
      expect(service.getStrategies()).toHaveLength(0)
    })
  })

  describe('StandardPricingStrategy', () => {
    beforeEach(() => {
      service.addStrategy(new StandardPricingStrategy())
    })

    it('should return base price with no discount', () => {
      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 1,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(100)
      expect(result.discount).toBe(0)
      expect(result.discountPercent).toBe(0)
    })

    it('should always be applicable', () => {
      const strategy = new StandardPricingStrategy()
      expect(strategy.isApplicable({ productId: 1, basePrice: 100, quantity: 1 })).toBe(true)
    })
  })

  describe('VolumeDiscountStrategy', () => {
    const volumeTiers = [
      { minQuantity: 100, discountPercent: 10 },
      { minQuantity: 50, discountPercent: 5 },
      { minQuantity: 20, discountPercent: 2 },
    ]

    beforeEach(() => {
      service.addStrategy(new VolumeDiscountStrategy(volumeTiers))
      service.addStrategy(new StandardPricingStrategy())
    })

    it('should apply 10% discount for 100+ units', () => {
      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 100,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(90)
      expect(result.discount).toBe(10)
      expect(result.discountPercent).toBe(10)
    })

    it('should apply 5% discount for 50-99 units', () => {
      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 75,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(95)
      expect(result.discount).toBe(5)
      expect(result.discountPercent).toBe(5)
    })

    it('should apply 2% discount for 20-49 units', () => {
      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 30,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(98)
      expect(result.discount).toBe(2)
      expect(result.discountPercent).toBe(2)
    })

    it('should not apply discount for less than 20 units', () => {
      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 10,
      }

      const result = service.calculatePrice(context)

      // Falls back to standard pricing
      expect(result.finalPrice).toBe(100)
      expect(result.discount).toBe(0)
    })

    it('should get tier for quantity', () => {
      const strategy = new VolumeDiscountStrategy(volumeTiers)

      expect(strategy.getTierForQuantity(150)?.discountPercent).toBe(10)
      expect(strategy.getTierForQuantity(75)?.discountPercent).toBe(5)
      expect(strategy.getTierForQuantity(25)?.discountPercent).toBe(2)
      expect(strategy.getTierForQuantity(10)).toBeNull()
    })
  })

  describe('ContractPricingStrategy', () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 86400000 * 30) // 30 days from now
    const pastDate = new Date(now.getTime() - 86400000 * 30) // 30 days ago

    const contracts = [
      {
        customerId: 1,
        productId: 100,
        contractPrice: 80,
        validFrom: pastDate,
        validUntil: futureDate,
      },
    ]

    beforeEach(() => {
      service.addStrategy(new ContractPricingStrategy(contracts))
      service.addStrategy(new StandardPricingStrategy())
    })

    it('should apply contract price for matching customer and product', () => {
      const context: PricingContext = {
        customerId: 1,
        productId: 100,
        basePrice: 100,
        quantity: 1,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(80)
      expect(result.discount).toBe(20)
      expect(result.discountPercent).toBe(20)
      expect(result.pricingRule).toBe('Contract Price')
    })

    it('should not apply for different customer', () => {
      const context: PricingContext = {
        customerId: 2,
        productId: 100,
        basePrice: 100,
        quantity: 1,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(100)
      expect(result.pricingRule).toBe('Standard Price')
    })

    it('should not apply for different product', () => {
      const context: PricingContext = {
        customerId: 1,
        productId: 200,
        basePrice: 100,
        quantity: 1,
      }

      const result = service.calculatePrice(context)

      expect(result.finalPrice).toBe(100)
    })

    it('should not apply for expired contract', () => {
      const expiredContracts = [
        {
          customerId: 1,
          productId: 100,
          contractPrice: 80,
          validFrom: new Date('2020-01-01'),
          validUntil: new Date('2020-12-31'),
        },
      ]

      const freshService = new PricingService()
      freshService.addStrategy(new ContractPricingStrategy(expiredContracts))
      freshService.addStrategy(new StandardPricingStrategy())

      const context: PricingContext = {
        customerId: 1,
        productId: 100,
        basePrice: 100,
        quantity: 1,
      }

      const result = freshService.calculatePrice(context)

      expect(result.finalPrice).toBe(100)
    })

    it('should prioritize contract over volume discount', () => {
      const freshService = new PricingService()
      freshService.addStrategy(new ContractPricingStrategy(contracts))
      freshService.addStrategy(
        new VolumeDiscountStrategy([{ minQuantity: 10, discountPercent: 15 }])
      )
      freshService.addStrategy(new StandardPricingStrategy())

      const context: PricingContext = {
        customerId: 1,
        productId: 100,
        basePrice: 100,
        quantity: 100, // Would qualify for volume discount
      }

      const result = freshService.calculatePrice(context)

      // Contract (priority 10) should win over volume (priority 20)
      expect(result.finalPrice).toBe(80)
      expect(result.pricingRule).toBe('Contract Price')
    })
  })

  describe('calculateWithAnalysis', () => {
    it('should return analysis of all applicable strategies', () => {
      service.addStrategy(new ContractPricingStrategy([]))
      service.addStrategy(
        new VolumeDiscountStrategy([{ minQuantity: 10, discountPercent: 5 }])
      )
      service.addStrategy(new StandardPricingStrategy())

      const context: PricingContext = {
        productId: 1,
        basePrice: 100,
        quantity: 50,
      }

      const { result, applicableStrategies } = service.calculateWithAnalysis(context)

      expect(result.finalPrice).toBe(95) // Volume discount applied
      expect(applicableStrategies).toHaveLength(2) // Volume + Standard
      expect(applicableStrategies[0]!.name).toBe('Volume Discount')
      expect(applicableStrategies[1]!.name).toBe('Standard')
    })
  })
})
