/**
 * Pricing Service
 *
 * Strategy pattern implementation for flexible pricing rules.
 * Supports volume discounts, contract pricing, and more.
 */

// Types
export * from './types'

// Service
export { PricingService, pricingService } from './PricingService'

// Composable
export { usePricing } from './usePricing'

// Strategies
export { StandardPricingStrategy } from './strategies/StandardPricingStrategy'
export { VolumeDiscountStrategy } from './strategies/VolumeDiscountStrategy'
export { ContractPricingStrategy } from './strategies/ContractPricingStrategy'

// Bootstrap: Register default strategies
import { pricingService } from './PricingService'
import { StandardPricingStrategy } from './strategies/StandardPricingStrategy'
import { VolumeDiscountStrategy } from './strategies/VolumeDiscountStrategy'

// Standard pricing (fallback)
pricingService.addStrategy(new StandardPricingStrategy())

// Volume discount tiers (example - can be configured per company)
pricingService.addStrategy(
  new VolumeDiscountStrategy([
    { minQuantity: 100, discountPercent: 10 },
    { minQuantity: 50, discountPercent: 5 },
    { minQuantity: 20, discountPercent: 2 },
  ])
)

// Note: Contract pricing should be loaded from API when needed
// pricingService.addStrategy(new ContractPricingStrategy(contracts))
