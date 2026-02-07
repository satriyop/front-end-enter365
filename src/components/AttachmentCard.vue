<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useAttachmentsFor,
  useAttachmentCategories,
  useUploadAttachment,
  useDeleteAttachment,
  useDownloadAttachment,
  type Attachment,
} from '@/api/useAttachments'
import { getErrorMessage } from '@/api/client'
import { Card, Button, Badge, Select, Input, useToast } from '@/components/ui'
import { FileText, Image, File, Download, Trash2, Upload, Paperclip } from 'lucide-vue-next'

interface Props {
  attachableType: string
  attachableId: number
}

const props = defineProps<Props>()
const toast = useToast()

// Queries
const { data: attachments, isLoading } = useAttachmentsFor(
  () => props.attachableType,
  () => props.attachableId,
)

const { data: categoriesMap } = useAttachmentCategories()

// Mutations
const uploadMutation = useUploadAttachment()
const deleteMutation = useDeleteAttachment()
const downloadMutation = useDownloadAttachment()

// Upload form state
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const category = ref('')
const description = ref('')

const count = computed(() => attachments.value?.length ?? 0)

const categoryOptions = computed(() => {
  const base = [{ value: '', label: 'No category' }]
  if (!categoriesMap.value) return base
  return [
    ...base,
    ...Object.entries(categoriesMap.value).map(([value, label]) => ({ value, label })),
  ]
})

function getFileIcon(attachment: Attachment) {
  if (attachment.is_pdf) return { icon: FileText, class: 'text-red-500' }
  if (attachment.is_image) return { icon: Image, class: 'text-blue-500' }
  return { icon: File, class: 'text-muted-foreground' }
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function resetForm() {
  selectedFile.value = null
  category.value = ''
  description.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleUpload() {
  if (!selectedFile.value) return
  try {
    await uploadMutation.mutateAsync({
      file: selectedFile.value,
      attachable_type: props.attachableType,
      attachable_id: props.attachableId,
      description: description.value || undefined,
      category: category.value || undefined,
    })
    toast.success('File uploaded')
    resetForm()
  } catch (err) {
    toast.error(getErrorMessage(err, 'Upload failed'))
  }
}

async function handleDownload(attachment: Attachment) {
  try {
    await downloadMutation.mutateAsync(attachment)
  } catch {
    toast.error('Download failed')
  }
}

async function handleDelete(attachment: Attachment) {
  if (!confirm(`Delete "${attachment.filename}"?`)) return
  try {
    await deleteMutation.mutateAsync(attachment.id)
    toast.success('File deleted')
  } catch {
    toast.error('Delete failed')
  }
}
</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center gap-2">
        <Paperclip class="w-4 h-4 text-muted-foreground" />
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">
          Attachments
          <span v-if="count > 0" class="text-muted-foreground font-normal">({{ count }})</span>
        </h2>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="isLoading" class="text-sm text-muted-foreground text-center py-4">
      Loading...
    </div>

    <template v-else>
      <!-- File List -->
      <div v-if="count > 0" class="space-y-3 mb-4">
        <div
          v-for="file in attachments"
          :key="file.id"
          class="flex items-start gap-3 py-2 border-b border-border last:border-0"
        >
          <!-- Icon -->
          <component :is="getFileIcon(file).icon" class="w-5 h-5 mt-0.5 shrink-0" :class="getFileIcon(file).class" />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {{ file.filename }}
            </p>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{{ file.size_human }}</span>
              <span v-if="file.category_label">·</span>
              <Badge v-if="file.category_label" variant="secondary" size="sm">
                {{ file.category_label }}
              </Badge>
              <span>·</span>
              <span>{{ formatTimeAgo(file.created_at) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="xs"
              :loading="downloadMutation.isPending.value"
              @click="handleDownload(file)"
            >
              <Download class="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              class="text-destructive hover:text-destructive"
              :loading="deleteMutation.isPending.value"
              @click="handleDelete(file)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <p v-else class="text-sm text-muted-foreground text-center py-4">
        No files attached
      </p>

      <!-- Upload Section -->
      <div class="border-t border-border pt-4 space-y-3">
        <input
          ref="fileInputRef"
          type="file"
          class="block w-full text-sm text-muted-foreground
            file:mr-3 file:py-1.5 file:px-3
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-secondary file:text-secondary-foreground
            hover:file:bg-secondary/80
            cursor-pointer"
          @change="onFileSelect"
        />

        <template v-if="selectedFile">
          <Select
            :model-value="category"
            :options="categoryOptions"
            placeholder="Category (optional)"
            @update:model-value="(v) => category = String(v ?? '')"
          />

          <Input
            v-model="description"
            placeholder="Description (optional)"
          />

          <Button
            class="w-full"
            size="sm"
            :loading="uploadMutation.isPending.value"
            @click="handleUpload"
          >
            <Upload class="w-4 h-4 mr-2" />
            Upload
          </Button>
        </template>
      </div>
    </template>
  </Card>
</template>
