                                                                                              
  Top 3 Bad Things About Your Code & Patterns                                                                                                                                  
                                                                                                                                                                               
  1. Massive CSS Inconsistency - Design System Ignored                                                                                                                         
                                                                                                                                                                               
  Evidence:                                                                                                                                                                    
  - 2,876 occurrences of hardcoded colors (text-slate-500, bg-white, bg-slate-900, etc.) across 96 files                                                                       
  - Only 52 occurrences of semantic tokens (text-muted-foreground, bg-card) across just 6 files                                                                                
                                                                                                                                                                               
  The Problem:                                                                                                                                                                 
  Your CLAUDE.md explicitly says:                                                                                                                                              
  Do NOT use hardcoded colors (bg-white, text-slate-500) → use semantic tokens                                                                                                 
                                                                                                                                                                               
  Yet 95% of your pages violate this rule. Compare:                                                                                                                            
                                                                                                                                                                               
  <!-- QuotationListPage.vue (correct) -->                                                                                                                                     
  <p class="text-muted-foreground">Manage sales quotations</p>                                                                                                                 
                                                                                                                                                                               
  <!-- InvoiceListPage.vue (wrong) -->                                                                                                                                         
  <p class="text-slate-500 dark:text-slate-400">Manage sales invoices</p>                                                                                                      
                                                                                                                                                                               
  Impact: Theme changes, dark mode bugs, inconsistent styling, maintenance nightmare. Every dark mode class you manually write (dark:text-slate-400) is a bug waiting to       
  happen.                                                                                                                                                                      
                                                                                                                                                                               
  ---                                                                                                                                                                          
  2. Unused Abstractions - Over-Engineered Then Abandoned                                                                                                                      
                                                                                                                                                                               
  Evidence:                                                                                                                                                                    
  You built sophisticated composables and services that nobody uses:                                                                                                           
  ┌───────────────────────────────────────┬───────────────┐                                                                                                                    
  │                 Built                 │ Used in pages │                                                                                                                    
  ├───────────────────────────────────────┼───────────────┤                                                                                                                    
  │ useDocumentForm                       │ 0 form pages  │                                                                                                                    
  ├───────────────────────────────────────┼───────────────┤                                                                                                                    
  │ useLineItems                          │ 0 form pages  │                                                                                                                    
  ├───────────────────────────────────────┼───────────────┤                                                                                                                    
  │ useCalculation composable             │ 0 form pages  │                                                                                                                    
  ├───────────────────────────────────────┼───────────────┤                                                                                                                    
  │ CalculationService (Strategy Pattern) │ 0 form pages  │                                                                                                                    
  └───────────────────────────────────────┴───────────────┘                                                                                                                    
  The Problem:                                                                                                                                                                 
  Every form page (QuotationFormPage.vue, InvoiceFormPage.vue, BillFormPage.vue) has its own duplicated calculation logic:                                                     
                                                                                                                                                                               
  // QuotationFormPage.vue:121-127                                                                                                                                             
  function calculateItemTotal(item: QuotationItemFormData): number {                                                                                                           
    const gross = (item.quantity || 0) * (item.unit_price || 0)                                                                                                                
    const discountAmount = gross * ((item.discount_percent || 0) / 100)                                                                                                        
    const afterDiscount = gross - discountAmount                                                                                                                               
    const taxAmount = afterDiscount * ((item.tax_rate || 0) / 100)                                                                                                             
    return afterDiscount + taxAmount                                                                                                                                           
  }                                                                                                                                                                            
                                                                                                                                                                               
  // InvoiceFormPage.vue:105-107                                                                                                                                               
  function calculateItemTotal(item: InvoiceItemFormData): number {                                                                                                             
    return (item.quantity || 0) * (item.unit_price || 0)                                                                                                                       
  }                                                                                                                                                                            
                                                                                                                                                                               
  // BillFormPage.vue:105-113                                                                                                                                                  
  // Yet another different implementation                                                                                                                                      
                                                                                                                                                                               
  Impact: You spent effort building CalculationService with Strategy Pattern, then never used it. When tax rules change, you'll need to update 10+ files instead of one        
  service.                                                                                                                                                                     
                                                                                                                                                                               
  ---                                                                                                                                                                          
  3. Native HTML Elements in Forms - UI Components Bypassed                                                                                                                    
                                                                                                                                                                               
  Evidence:                                                                                                                                                                    
  QuotationFormPage.vue:349-420, InvoiceFormPage.vue:293-343, and others use native <select> and <input> elements:                                                             
                                                                                                                                                                               
  <!-- QuotationFormPage.vue:349-366 - WRONG -->                                                                                                                               
  <select                                                                                                                                                                      
    :value="field.value.product_id ?? ''"                                                                                                                                      
    class="w-full px-2 py-1.5 rounded border border-slate-300..."                                                                                                              
  >                                                                                                                                                                            
    <option value="">Custom</option>                                                                                                                                           
    ...                                                                                                                                                                        
  </select>                                                                                                                                                                    
                                                                                                                                                                               
  <!-- Should use -->                                                                                                                                                          
  <Select v-model="field.value.product_id" :options="productOptions" />                                                                                                        
                                                                                                                                                                               
  Your CLAUDE.md says:                                                                                                                                                         
  Do NOT use native <select>, <input>, <button> → use @/components/ui                                                                                                          
                                                                                                                                                                               
  Impact:                                                                                                                                                                      
  - Inconsistent styling and behavior                                                                                                                                          
  - Missing accessibility features your UI components provide                                                                                                                  
  - Every native element needs its own dark mode classes                                                                                                                       
  - Form validation UX inconsistencies                                                                                                                                         
                                                                                                                                                                               
  ---                                                                                                                                                                          
  ★ Insight ─────────────────────────────────────                                                                                                                              
  This codebase exhibits a common pattern: architecture astronautics followed by abandonment. Someone designed a beautiful service layer with Strategy Pattern, composables for
   forms and calculations, and semantic design tokens - then nobody enforced their usage. The result is worse than having no architecture at all because:                      
                                                                                                                                                                               
  1. New developers see complex abstractions and assume they're optional                                                                                                       
  2. The "correct" way exists but nobody knows to use it                                                                                                                       
  3. Technical debt compounds as people copy existing (wrong) patterns                                                                                                         
  ─────────────────────────────────────────────────                                                                                                                            
                                                                                                                                                                               
  ---                                                                                                                                                                          
  Verdict: The architecture is actually good - the problem is adoption. You have ~15 form pages that should be refactored to use useDocumentForm, useLineItems, useCalculation,
   semantic tokens, and UI components. Until that happens, your abstractions are just dead code making the codebase harder to understand.                                      
                                                                                                                                         