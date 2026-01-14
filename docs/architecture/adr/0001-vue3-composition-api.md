# ADR 0001: Vue 3 with Composition API

## Status

**Accepted**

## Date

2024-10-01

## Context

We need to choose a frontend framework for the Enter365 Solar ERP application. The application will have:
- 50+ pages across 10 business modules
- Complex forms with validation
- Real-time calculations (solar proposals)
- Integration with Laravel REST API
- Role-based access control

### Options Considered

1. **Vue 3 + Composition API**
2. **Vue 3 + Options API**
3. **React + TypeScript**
4. **Angular**

## Decision

We chose **Vue 3 with Composition API** and `<script setup>` syntax.

## Rationale

### Why Vue 3 over React/Angular

| Factor | Vue 3 | React | Angular |
|--------|-------|-------|---------|
| Learning curve | Gentle | Moderate | Steep |
| TypeScript support | Excellent | Excellent | Native |
| Bundle size | Smaller | Moderate | Larger |
| Team familiarity | High | Moderate | Low |
| Laravel ecosystem | VueUse, Inertia | - | - |

### Why Composition API over Options API

| Factor | Composition API | Options API |
|--------|-----------------|-------------|
| TypeScript inference | Excellent | Limited |
| Code reuse | Composables | Mixins (problematic) |
| Logical organization | By feature | By option type |
| IDE support | Better | Good |

### Why `<script setup>`

```vue
<!-- Options API: 30+ lines of boilerplate -->
<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  props: { ... },
  setup(props, { emit }) {
    const count = ref(0)
    const double = computed(() => count.value * 2)
    return { count, double }
  }
})
</script>

<!-- Composition API with script setup: cleaner -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ initial: number }>()
const emit = defineEmits<{ (e: 'update', value: number): void }>()

const count = ref(props.initial)
const double = computed(() => count.value * 2)
</script>
```

## Consequences

### Positive

- Better TypeScript integration with automatic type inference
- Cleaner code with `<script setup>` syntax
- Easy code reuse through composables
- Great Vue DevTools for debugging
- Strong ecosystem (VueUse, Pinia, TanStack Query)

### Negative

- Team needs to learn Composition API if coming from Vue 2
- Some third-party libraries still use Options API examples
- Slightly different mental model from Vue 2

### Mitigations

- Team training on Composition API patterns
- Establish clear coding standards (see [ONBOARDING.md](../../getting-started/ONBOARDING.md))
- Use composables from VueUse where possible

## References

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Script Setup RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md)
