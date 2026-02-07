/**
 * Attachments API hooks
 */

import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Attachment = components['schemas']['AttachmentResource']
export type AttachmentCategory = components['schemas']['StoreAttachmentRequest']['category']

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch attachments for a specific model (e.g. Invoice #5)
 */
export function useAttachmentsFor(type: MaybeRefOrGetter<string>, id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => ['attachments', toValue(type), toValue(id)]),
    queryFn: async () => {
      const response = await api.get<{ data: Attachment[] }>(
        `/attachments/for/${toValue(type)}/${toValue(id)}`,
        { params: { per_page: 50 } },
      )
      return response.data.data
    },
    enabled: computed(() => toValue(id) > 0),
  })
}

/**
 * Fetch available attachment categories from API
 */
export function useAttachmentCategories() {
  return useQuery({
    queryKey: ['attachments', 'categories'],
    queryFn: async () => {
      const response = await api.get<{ categories: Record<string, string> }>(
        '/attachments/categories',
      )
      return response.data.categories
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Upload a new attachment via multipart/form-data
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      file: File
      attachable_type: string
      attachable_id: number
      description?: string
      category?: string
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('attachable_type', data.attachable_type)
      formData.append('attachable_id', String(data.attachable_id))
      if (data.description) formData.append('description', data.description)
      if (data.category) formData.append('category', data.category)

      const response = await api.post<{ data: Attachment }>('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
}

/**
 * Delete an attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/attachments/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] })
    },
  })
}

/**
 * Download an attachment using blob pattern (authenticated)
 */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async (attachment: Attachment) => {
      const response = await api.get(`/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = attachment.filename
      link.click()
      URL.revokeObjectURL(link.href)
      return true
    },
  })
}
