# Migration Checklist

This document provides checklists for migrating existing pages and components to the new architecture.

## Page Migration Checklist Template

Copy this template for each page migration:

```markdown
## Page Migration: [Page Name]

### Pre-Migration
- [ ] Identify all dependencies and imports
- [ ] Create feature flag in `src/config/featureFlags.ts`
- [ ] Create V2 page file (e.g., `QuotationFormPageV2.vue`)
- [ ] Write tests for new implementation

### Migration Steps
- [ ] Migrate to useDocumentForm composable
- [ ] Migrate to useLineItems composable (if applicable)
- [ ] Use new LineItemsTable component
- [ ] Use DocumentFormLayout component
- [ ] Integrate with state machine workflows
- [ ] Connect to event bus for observability

### Testing
- [ ] Manual testing with feature flag enabled
- [ ] Unit tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance acceptable

### Rollout
- [ ] Enable for specific test users
- [ ] Monitor for errors (check logs, Sentry)
- [ ] Increase rollout to 50%
- [ ] Monitor for errors
- [ ] Enable for all users (100%)

### Cleanup
- [ ] Remove feature flag from config
- [ ] Delete legacy page component
- [ ] Update any direct imports
- [ ] Update documentation
```

---

## Current Migration Status

### Infrastructure (Phase 1) - ✅ Complete
- [x] Event Bus
- [x] Logger with transports
- [x] DI Container
- [x] Error types and guards

### Services (Phase 2) - ✅ Complete
- [x] Calculation Service with strategies
- [x] Line Items Service
- [x] Status Service
- [x] Pricing Service

### Composables (Phase 3) - ✅ Complete
- [x] useDocumentForm
- [x] useLineItems
- [x] useDocumentWorkflow
- [x] useResourceList
- [x] useResourceDetail

### Components (Phase 4) - ✅ Complete
- [x] LineItemsTable
- [x] DocumentFormLayout
- [x] DocumentDetailLayout
- [x] VirtualList

### State Machine (Phase 6) - ✅ Complete
- [x] Core state machine implementation
- [x] Quotation workflow
- [x] Invoice workflow
- [x] Purchase Order workflow

### Testing Infrastructure (Phase 7) - ✅ Complete
- [x] Test factories
- [x] API mocks
- [x] Component test patterns
- [x] 415 tests passing

### Performance (Phase 8) - ✅ Complete
- [x] Query caching configuration
- [x] Query keys factory
- [x] Async component loading
- [x] VirtualList for large lists
- [x] Performance monitoring
- [x] Bundle optimization

### Migration Infrastructure (Phase 9) - ✅ Complete
- [x] Feature flag system
- [x] Deprecation utilities
- [x] Migration documentation

---

## Pending Page Migrations

### Sales Module
- [ ] QuotationFormPage
- [ ] InvoiceFormPage
- [ ] DeliveryOrderFormPage
- [ ] SalesReturnFormPage

### Purchasing Module
- [ ] PurchaseOrderFormPage
- [ ] BillFormPage
- [ ] GoodsReceiptNoteFormPage
- [ ] PurchaseReturnFormPage

### Manufacturing Module
- [ ] WorkOrderFormPage
- [ ] MaterialRequisitionFormPage
- [ ] SubcontractorWorkOrderFormPage

### Finance Module
- [ ] JournalEntryFormPage
- [ ] PaymentFormPage
- [ ] DownPaymentFormPage

---

## Migration Best Practices

### 1. Use Feature Flags
Always create a feature flag before migrating a page:

```typescript
// src/config/featureFlags.ts
'page:quotation-form-v2': {
  name: 'Quotation Form V2',
  description: 'Use refactored quotation form page',
  enabled: false,
  enabledForUsers: [1, 2], // Test users first
},
```

### 2. Create Parallel Implementation
Keep the legacy code while building the new version:

```
src/pages/quotations/
├── QuotationFormPage.vue      # Legacy
├── QuotationFormPageV2.vue    # New (feature flagged)
└── index.ts                   # Exports based on flag
```

### 3. Use Deprecation Warnings
When wrapping old functions with new implementations:

```typescript
import { deprecationWarning } from '@/utils/deprecation'

export function useOldComposable() {
  deprecationWarning(
    'useOldComposable',
    'useNewComposable from @/composables',
    'v2.0.0'
  )
  return useNewComposable()
}
```

### 4. Gradual Rollout
1. Enable for specific test users first
2. Monitor logs and errors
3. Increase to 10%, then 50%, then 100%
4. Only remove legacy code after full rollout

### 5. Test Thoroughly
- Write unit tests for new implementation
- Manual test all user flows
- Check for console errors
- Verify TypeScript compiles
- Test edge cases

---

## Rollback Procedures

If something goes wrong:

### 1. Quick Feature Flag Disable
```typescript
// In browser console (dev only)
featureFlags.override('page:quotation-form-v2', false)

// Or update config and redeploy
```

### 2. Git Revert
```bash
git revert <commit-hash>
```

### 3. When to Rollback
- Error rate increases > 5%
- Critical functionality broken
- Performance degradation > 50%
- Data integrity issues

---

## Success Criteria

A migration is complete when:

1. **Functionality**: All features work identically to legacy
2. **Performance**: No degradation (ideally improved)
3. **Tests**: All tests pass, coverage > 70%
4. **TypeScript**: No type errors
5. **Cleanup**: Legacy code removed, imports updated
6. **Documentation**: Updated to reflect new patterns
