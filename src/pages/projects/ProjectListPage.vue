<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjects, useDeleteProject, type ProjectFilters } from '@/api/useProjects'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { formatDate } from '@/utils/format'

const toast = useToast()

const filters = ref<ProjectFilters>({
  page: 1,
  per_page: 10,
  status: undefined,
  search: '',
})

const { data, isLoading, error } = useProjects(filters)

const projects = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  confirmed: 'info',
  in_progress: 'warning',
  on_hold: 'destructive',
  completed: 'success',
  cancelled: 'destructive',
}

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteProject()
const showDeleteModal = ref(false)
const projectToDelete = ref<string | null>(null)

function confirmDelete(id: string) {
  projectToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!projectToDelete.value) return
  try {
    await deleteMutation.mutateAsync(projectToDelete.value)
    showDeleteModal.value = false
    projectToDelete.value = null
    toast.success('Project deleted')
  } catch {
    toast.error('Failed to delete project')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Projects</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage solar installation projects</p>
      </div>
      <RouterLink to="/projects/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search projects..."
            @update:model-value="handleSearch"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.status" :options="statusOptions" placeholder="All Status" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load projects</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="projects.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No projects found"
        description="Create projects to track solar installations"
        action-label="New Project"
        @action="$router.push('/projects/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project #</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="project in projects" :key="project.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <RouterLink :to="`/projects/${project.id}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                {{ project.project_number }}
              </RouterLink>
            </td>
            <td class="px-6 py-4 text-slate-900 dark:text-slate-100">
              {{ project.name }}
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
              {{ project.contact?.name ?? '-' }}
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
              {{ formatDate(project.start_date) }} - {{ formatDate(project.end_date) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-500 rounded-full"
                    :style="{ width: `${project.progress_percentage ?? 0}%` }"
                  />
                </div>
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ project.progress_percentage ?? 0 }}%</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="statusColors[project.status] || 'default'">
                {{ project.status.replace('_', ' ') }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/projects/${project.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button
                  v-if="project.status === 'draft'"
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDelete(project.id)"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <Modal :open="showDeleteModal" title="Delete Project" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">Are you sure you want to delete this project?</p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
