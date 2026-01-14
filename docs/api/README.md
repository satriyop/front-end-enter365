# API Integration

> Overview of API communication patterns in Enter365

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT                                                       │
│    │                                                             │
│    │  const { data, isLoading } = useQuotations(filters)         │
│    ▼                                                             │
├─────────────────────────────────────────────────────────────────┤
│  API HOOK (src/api/useQuotations.ts)                             │
│    │                                                             │
│    │  useQuery({ queryKey, queryFn })                            │
│    ▼                                                             │
├─────────────────────────────────────────────────────────────────┤
│  TANSTACK QUERY                                                  │
│    │                                                             │
│    │  Cache check → Fetch if stale → Return data                 │
│    ▼                                                             │
├─────────────────────────────────────────────────────────────────┤
│  AXIOS CLIENT (src/api/client.ts)                                │
│    │                                                             │
│    │  Bearer token → Request → Token refresh on 401              │
│    ▼                                                             │
├─────────────────────────────────────────────────────────────────┤
│  LARAVEL API                                                     │
│    /api/v1/*                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| I want to... | See |
|--------------|-----|
| Fetch data | [HOOKS-PATTERN.md](HOOKS-PATTERN.md) |
| Create/Update/Delete | [MUTATIONS.md](MUTATIONS.md) |
| Handle errors | [ERROR-HANDLING.md](ERROR-HANDLING.md) |
| Understand auth | [AUTHENTICATION.md](AUTHENTICATION.md) |

---

## File Structure

```
src/api/
├── client.ts                   # Axios instance + interceptors
├── types.ts                    # OpenAPI-generated types (33K lines)
├── useQuotations.ts            # Quotation hooks
├── useInvoices.ts              # Invoice hooks
├── useSolarProposals.ts        # Solar proposal hooks
├── useContacts.ts              # Contact hooks
├── useProducts.ts              # Product hooks
├── useBoms.ts                  # BOM hooks
└── [15+ more hook files]
```

---

## API Client

```typescript
// src/api/client.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

See [client.ts](../../src/api/client.ts) for full implementation including token refresh.

---

## Hook Pattern Summary

### Query (Read)

```typescript
export function useQuotations(filters: Ref<Filters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: async () => {
      const response = await api.get('/quotations', { params: filters.value })
      return response.data
    },
  })
}
```

### Mutation (Write)

```typescript
export function useCreateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/quotations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  })
}
```

---

## API Hook List

| Hook | Entity | Operations |
|------|--------|------------|
| `useQuotations` | Quotation | List, get, create, update, delete, submit, approve, reject, convert, duplicate, revise |
| `useInvoices` | Invoice | List, get, create, update, delete, post, void, send, duplicate |
| `useSolarProposals` | SolarProposal | List, get, create, update, delete, calculate, attach-variants |
| `useContacts` | Contact | List, get, create, update, delete, lookup |
| `useProducts` | Product | List, get, create, update, delete, lookup |
| `useBoms` | BOM | List, get, create, update, delete, variants, cost calc |
| `useBills` | Bill | List, get, create, update, delete |
| `usePayments` | Payment | List, get, create, update, delete |
| `useProjects` | Project | List, get, create, update, delete |
| `useWorkOrders` | WorkOrder | List, get, create, update, delete |
| `useInventory` | Stock | Levels, movements, adjustments |
| `useUsers` | User | List, get, create, update, delete, toggle, password |
| `useDashboard` | Dashboard | Summary, metrics, recent activity |
| `useReports` | Reports | All financial reports (8 types) |

---

## Type Generation

Types are generated from the Laravel OpenAPI spec:

```bash
# Regenerate types after API changes
npm run types:generate
```

This generates `src/api/types.ts` (~33,000 lines) with all API types.

```typescript
// Import generated types
import type { components } from './types'

type Quotation = components['schemas']['QuotationResource']
type Contact = components['schemas']['ContactResource']
```

---

## Response Format

### Paginated List

```json
{
  "data": [
    { "id": 1, "quotation_number": "Q-2024-001", ... },
    { "id": 2, "quotation_number": "Q-2024-002", ... }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 10,
    "total": 100
  }
}
```

### Single Item

```json
{
  "data": {
    "id": 1,
    "quotation_number": "Q-2024-001",
    ...
  }
}
```

### Validation Error (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "contact_id": ["The selected contact is invalid."]
  }
}
```

---

## Documentation Index

- [HOOKS-PATTERN.md](HOOKS-PATTERN.md) - Query and mutation patterns
- [MUTATIONS.md](MUTATIONS.md) - Create, update, delete patterns
- [ERROR-HANDLING.md](ERROR-HANDLING.md) - Error handling strategies
- [AUTHENTICATION.md](AUTHENTICATION.md) - Auth flow and token refresh
