<script setup lang="ts">
/**
 * StatusBadge Component
 *
 * Enhanced Badge that uses the centralized status registry.
 * Automatically gets the correct label and variant for any document status.
 *
 * @example
 * ```vue
 * <StatusBadge document-type="quotation" :status="quotation.status" />
 * <StatusBadge document-type="invoice" status="paid" />
 * ```
 */

import { computed } from 'vue'
import Badge from './Badge.vue'
import { statusService } from '@/services/status'
import type { DocumentType } from '@/services/status/types'

interface Props {
  documentType: DocumentType
  status: string
}

const props = defineProps<Props>()

const statusConfig = computed(() => statusService.getStatus(props.documentType, props.status))
</script>

<template>
  <Badge :variant="statusConfig.variant">
    {{ statusConfig.label }}
  </Badge>
</template>
