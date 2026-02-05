<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useProductCategory,
  useDeleteProductCategory,
} from '@/api/useProductCategories'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import { Pencil, Trash2, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const categoryId = computed(() => Number(route.params.id))
const { data: category, isLoading } = useProductCategory(categoryId)

const deleteMutation = useDeleteProductCategory()

// Delete modal
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(categoryId.value)
    toast.success('Category deleted')
    router.push('/settings/product-categories')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete category'
    toast.error(message)
  } finally {
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading category...</span>
      </div>
    </div>

    <template v-else-if="category">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ category.name }}</h1>
            <Badge :variant="category.is_active ? 'success' : 'default'">
              {{ category.is_active ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
          <p v-if="category.code" class="text-muted-foreground font-mono">{{ category.code }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.push('/settings/product-categories')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <RouterLink :to="`/settings/product-categories/${category.id}/edit`">
            <Button variant="secondary">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
          <Button variant="destructive" @click="showDeleteModal = true">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Basic Information</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">Code</dt>
                <dd class="font-mono text-foreground">{{ category.code || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Name</dt>
                <dd class="text-foreground">{{ category.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Parent Category</dt>
                <dd class="text-foreground">
                  <RouterLink
                    v-if="category.parent"
                    :to="`/settings/product-categories/${category.parent.id}`"
                    class="text-primary hover:text-primary/80"
                  >
                    {{ category.parent.name }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Sort Order</dt>
                <dd class="text-foreground">{{ category.sort_order }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-muted-foreground">Description</dt>
                <dd class="text-foreground whitespace-pre-line">{{ category.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Child Categories -->
          <Card v-if="category.children && category.children.length > 0">
            <template #header>
              <h2 class="font-medium text-foreground">Child Categories</h2>
            </template>
            <div class="divide-y divide-border">
              <RouterLink
                v-for="child in category.children"
                :key="child.id"
                :to="`/settings/product-categories/${child.id}`"
                class="block px-3 py-2 -mx-3 hover:bg-muted/50 rounded-md transition-colors"
              >
                <div class="flex items-center justify-between">
                  <span class="text-primary font-medium">{{ child.name }}</span>
                  <Badge :variant="child.is_active ? 'success' : 'default'" size="sm">
                    {{ child.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </div>
              </RouterLink>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Status</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Active</dt>
                <dd>
                  <Badge :variant="category.is_active ? 'success' : 'destructive'">
                    {{ category.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Category" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ category?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Note: Categories with products assigned cannot be deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
